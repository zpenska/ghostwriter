'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import { Mathematics } from '@tiptap-pro/extension-mathematics';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Emoji, gitHubEmojis } from '@tiptap-pro/extension-emoji';
import CollaborationHistory from '@tiptap-pro/extension-collaboration-history';
import FileHandler from '@tiptap-pro/extension-file-handler';
import UniqueID from '@tiptap-pro/extension-unique-id';
import DragHandle from '@tiptap-pro/extension-drag-handle';
import Snapshot from '@tiptap-pro/extension-snapshot';
import Details from '@tiptap-pro/extension-details';
import DetailsSummary from '@tiptap-pro/extension-details-summary';
import DetailsContent from '@tiptap-pro/extension-details-content';
import InvisibleCharacters from '@tiptap-pro/extension-invisible-characters';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';
import EditorToolbar from './EditorToolbar';
import AiMenu from './AiMenu';
import { buttonStyles } from '@/lib/utils/button-styles';
import { LanguageTool } from '@/lib/tiptap/extensions/languagetool';
import { configureTiptapAI, configureAiChanges, configureAiSuggestion, createAiAgentProvider, configureAiAgent } from '@/lib/tiptap/ai-config';
import 'katex/dist/katex.min.css';

interface TemplateEditorProps {
  onEditorReady?: (editor: any) => void;
  aiAgentProvider?: any; // Pass the provider from parent
}

export default function TemplateEditor({ onEditorReady, aiAgentProvider: externalProvider }: TemplateEditorProps) {
  const [showAiChat, setShowAiChat] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [ydoc] = useState(() => new Y.Doc());
  const [snapshotProvider, setSnapshotProvider] = useState<any>(null);
  const [internalAiAgentProvider, setInternalAiAgentProvider] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Use external provider if provided, otherwise create internal one
  const aiAgentProvider = externalProvider || internalAiAgentProvider;

  // Initialize AI Agent Provider if not provided externally
  useEffect(() => {
    if (!externalProvider && aiAgentProvider) {
      // Only set up listeners if provider has the methods
      if (typeof aiAgentProvider.on === 'function') {
        // Subscribe to state changes
        const handleStateChange = (newState: any) => {
          console.log('AI Agent state changed:', newState);
          setIsAiLoading(newState.status === 'loading');
        };

        const handleError = (error: any) => {
          console.error('AI Agent error:', error);
          setIsAiLoading(false);
        };

        aiAgentProvider.on('stateChange', handleStateChange);
        aiAgentProvider.on('loadingError', handleError);

        return () => {
          if (typeof aiAgentProvider.off === 'function') {
            aiAgentProvider.off('stateChange', handleStateChange);
            aiAgentProvider.off('loadingError', handleError);
          }
        };
      }
    }
  }, [externalProvider, aiAgentProvider]);

  // Initialize IndexedDB persistence for local versioning
  useEffect(() => {
    const provider = new IndexeddbPersistence('ghostwriter-template', ydoc);
    
    provider.on('synced', () => {
      console.log('Document synced with IndexedDB');
    });

    return () => {
      provider.destroy();
    };
  }, [ydoc]);

  // Build extensions array
  const extensions = [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      history: false, // We'll use CollaborationHistory
    }),
    Placeholder.configure({
      placeholder: 'Start typing your letter here...',
      showOnlyWhenEditable: true,
      emptyEditorClass: 'is-editor-empty',
    }),
    Typography,
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: 'highlight',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Underline,
    CharacterCount.configure({
      limit: null,
    }),
    Mathematics,
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'template-table',
      },
    }),
    TableRow,
    TableHeader,
    TableCell,
    FileHandler.configure({
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'],
      onDrop: (currentEditor: any, files: File[], pos: number) => {
        files.forEach((file: File) => {
          const fileReader = new FileReader();
          fileReader.readAsDataURL(file);
          fileReader.onload = () => {
            currentEditor.chain().insertContentAt(pos, {
              type: 'image',
              attrs: {
                src: fileReader.result,
              },
            }).focus().run();
          };
        });
      },
    } as any),
    Emoji.configure({
      enableEmoticons: true,
      emojis: gitHubEmojis,
    }),
    UniqueID.configure({
      attributeName: 'data-unique-id',
      types: ['paragraph', 'heading', 'listItem'],
    }),
    CollaborationHistory.configure({
      provider: null as any,
      maxVersions: 100,
    } as any),
    DragHandle.configure({
      render: () => {
        const element = document.createElement('div');
        element.classList.add('drag-handle');
        element.innerHTML = '⋮⋮';
        return element;
      },
    }),
    Snapshot,
    Details.configure({
      persist: true,
      HTMLAttributes: {
        class: 'details',
      },
    }),
    DetailsSummary,
    DetailsContent,
    InvisibleCharacters.configure({
      visible: false, // Can be toggled via toolbar
    }),
    // Add Tiptap AI extensions
    configureTiptapAI(),
  ]; // <- This closing bracket was missing

  // Only add these if they return valid extensions
  const aiChanges = configureAiChanges();
  if (aiChanges) extensions.push(aiChanges as any);

  const aiSuggestion = configureAiSuggestion();
  if (aiSuggestion) extensions.push(aiSuggestion as any);

  const aiAgent = aiAgentProvider ? configureAiAgent(aiAgentProvider) : null;
  if (aiAgent) extensions.push(aiAgent as any);

  const editor = useEditor({
    extensions: extensions.filter(Boolean) as any[], // Use 'as any[]' to bypass strict type checking
    content: '',
    autofocus: true,
    editable: true,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[600px] px-8 py-6',
      },
    },
    onCreate: ({ editor }) => {
      // Set up snapshot provider
      const provider = editor.storage.snapshot;
      setSnapshotProvider(provider);
      
      if (onEditorReady) {
        onEditorReady(editor);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      setSelectedText(text);
    },
  }, [aiAgentProvider]);

  const takeSnapshot = useCallback(() => {
    if (!editor) return;
    
    // Use the Snapshot extension
    const content = editor.getHTML();
    const snapshots = JSON.parse(localStorage.getItem('template-snapshots') || '[]');
    snapshots.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      content: content,
    });
    if (snapshots.length > 20) snapshots.shift();
    localStorage.setItem('template-snapshots', JSON.stringify(snapshots));
    
    alert('Snapshot saved!');
  }, [editor]);

  const checkSpelling = useCallback(async () => {
    if (!editor) return;
    
    try {
      // Import the spell check service
      const { spellCheckService } = await import('@/lib/services/spell-check');
      await spellCheckService.checkEditor(editor);
    } catch (error) {
      console.error('Spell check error:', error);
      alert('Spell check failed. Please try again.');
    }
  }, [editor]);

  const checkGrammar = useCallback(() => {
    // Grammar check uses the same service as spell check
    checkSpelling();
  }, [checkSpelling]);

  const showInvisibleCharacters = useCallback(() => {
    if (!editor) return;
    
    // Toggle invisible characters
    editor.chain().focus().toggleInvisibleCharacters().run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8a7fae] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="template-editor-container flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Toolbar */}
      <EditorToolbar 
        editor={editor} 
        onOpenAiChat={() => setShowAiChat(true)}
      />

      {/* Editor */}
      <div ref={editorRef} className="flex-1 overflow-y-auto relative bg-white">
        <EditorContent editor={editor} className="template-editor h-full" />
        
        {/* AI Loading Indicator */}
        {isAiLoading && (
          <div className="absolute bottom-4 right-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
            <span>AI is thinking...</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>
            {editor.storage.characterCount.characters()} characters
          </span>
          <span>
            {editor.storage.characterCount.words()} words
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={takeSnapshot}
            className={buttonStyles.text}
            title="Save version"
          >
            Snapshot
          </button>
          <button
            onClick={checkSpelling}
            className={buttonStyles.text}
            title="Check spelling"
          >
            Spelling
          </button>
          <button
            onClick={checkGrammar}
            className={buttonStyles.text}
            title="Check grammar"
          >
            Grammar
          </button>
          <button
            onClick={showInvisibleCharacters}
            className={buttonStyles.text}
            title="Show/hide invisible characters"
          >
            ¶
          </button>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showAiChat && (
        <AiMenu 
          editor={editor}
          onClose={() => setShowAiChat(false)}
        />
      )}
    </div>
  );
}
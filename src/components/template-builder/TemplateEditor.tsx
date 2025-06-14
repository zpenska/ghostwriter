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
// Temporarily commented out to fix instanceof error
// import CollaborationHistory from '@tiptap-pro/extension-collaboration-history';
import FileHandler from '@tiptap-pro/extension-file-handler';
import UniqueID from '@tiptap-pro/extension-unique-id';
import DragHandle from '@tiptap-pro/extension-drag-handle';
import Details from '@tiptap-pro/extension-details';
import DetailsSummary from '@tiptap-pro/extension-details-summary';
import DetailsContent from '@tiptap-pro/extension-details-content';
import InvisibleCharacters from '@tiptap-pro/extension-invisible-characters';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';
import EditorToolbar from './EditorToolbar';
import AiMenu from './AiMenu';
import AiAgentMenu from './AiAgentMenu';
import { Button } from '@/components/ui/button';
import { LanguageTool } from '@/lib/tiptap/extensions/languagetool';
import 'katex/dist/katex.min.css';

interface TemplateEditorProps {
  onEditorReady?: (editor: any) => void;
}

export default function TemplateEditor({ onEditorReady }: TemplateEditorProps) {
  const [showAiChat, setShowAiChat] = useState(false);
  const [showAiAgentMenu, setShowAiAgentMenu] = useState(false);
  const [aiMenuPosition, setAiMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [ydoc] = useState(() => new Y.Doc());
  const editorRef = useRef<HTMLDivElement>(null);

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Re-enabled history to fix undo/redo
        history: {
          depth: 100,
          newGroupDelay: 500,
        },
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
      // Temporarily disabled CollaborationHistory to fix instanceof error
      // CollaborationHistory.configure({
      //   provider: null,
      // }),
      DragHandle.configure({
        render: () => {
          const element = document.createElement('div');
          element.classList.add('drag-handle');
          element.innerHTML = '⋮⋮';
          return element;
        },
      }),
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
    ],
    content: '',
    autofocus: true,
    editable: true,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[600px] px-8 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      // Check for "/" to show AI agent menu
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from - 1, from);
      
      if (text === '/') {
        const coords = editor.view.coordsAtPos(from);
        const editorRect = editorRef.current?.getBoundingClientRect();
        if (editorRect && coords) {
          setAiMenuPosition({
            top: coords.top - editorRect.top + 20,
            left: coords.left - editorRect.left,
          });
          setShowAiAgentMenu(true);
        }
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      setSelectedText(text);
    },
  });

  // Callback for editor ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  const takeSnapshot = useCallback(() => {
    if (!editor) return;
    
    // Use local storage for snapshots
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
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
        
        {/* AI Agent Menu - FIXED: Added AiAgentMenu component back */}
        {showAiAgentMenu && (
          <div 
            style={{
              position: 'absolute',
              top: aiMenuPosition.top,
              left: aiMenuPosition.left,
            }}
          >
            <AiAgentMenu 
              editor={editor}
              onClose={() => {
                setShowAiAgentMenu(false);
                // Remove the "/" from the editor
                editor.chain().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).focus().run();
              }}
            />
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
          <Button
            variant="ghost"
            size="sm"
            onClick={takeSnapshot}
          >
            Snapshot
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkSpelling}
          >
            Spelling
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkGrammar}
          >
            Grammar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={showInvisibleCharacters}
          >
            ¶
          </Button>
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
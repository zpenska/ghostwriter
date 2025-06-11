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
import FileHandler from '@tiptap-pro/extension-file-handler';
import UniqueID from '@tiptap-pro/extension-unique-id';
import Details from '@tiptap-pro/extension-details';
import DetailsSummary from '@tiptap-pro/extension-details-summary';
import DetailsContent from '@tiptap-pro/extension-details-content';
import InvisibleCharacters from '@tiptap-pro/extension-invisible-characters';

// Tiptap Cloud imports
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { TiptapCollabProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

// AI imports
import AI from '@tiptap-pro/extension-ai';
import AiAgent from '@tiptap-pro/extension-ai-agent';
import { configureTiptapAI, configureAiAgent } from '@/lib/tiptap/ai-config';

import { useCallback, useEffect, useRef, useState } from 'react';
import EditorToolbar from './EditorToolbar';
import AiMenu from './AiMenu';
import AiAgentMenu from './AiAgentMenu';
import { buttonStyles } from '@/lib/utils/button-styles';
import 'katex/dist/katex.min.css';

interface TemplateEditorProps {
  onEditorReady?: (editor: any) => void;
  documentName?: string; // For cloud collaboration
  userName?: string;
  userId?: string;
}

export default function TemplateEditor({ 
  onEditorReady, 
  documentName = 'ghostwriter-template',
  userName = 'User',
  userId = 'user-123'
}: TemplateEditorProps) {
  const [showAiChat, setShowAiChat] = useState(false);
  const [showAiAgentMenu, setShowAiAgentMenu] = useState(false);
  const [aiMenuPosition, setAiMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [provider, setProvider] = useState<TiptapCollabProvider | null>(null);
  const [aiAgentReady, setAiAgentReady] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize Yjs document
  const ydoc = new Y.Doc();

  // Initialize Tiptap Cloud provider
  useEffect(() => {
    const initializeCloudProvider = async () => {
      try {
        // Get JWT token for authentication
        const response = await fetch('/api/tiptap-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userName })
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate');
        }

        const { token } = await response.json();

        // Create Tiptap Cloud provider
        const cloudProvider = new TiptapCollabProvider({
          appId: 'j9yd36p9', // Your Document Server App ID
          name: documentName,
          document: ydoc,
          token,
          onAuthenticationFailed: () => {
            console.error('Authentication failed');
          },
        });

        setProvider(cloudProvider);
        console.log('Tiptap Cloud provider initialized');
      } catch (error) {
        console.error('Failed to initialize cloud provider:', error);
      }
    };

    initializeCloudProvider();

    return () => {
      provider?.destroy();
    };
  }, [documentName, userId, userName]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        history: false, // Collaboration handles history
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
      Details.configure({
        persist: true,
        HTMLAttributes: {
          class: 'details',
        },
      }),
      DetailsSummary,
      DetailsContent,
      InvisibleCharacters.configure({
        visible: false,
      }),
      // Collaboration extensions
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: userName,
          color: '#8a7fae',
        },
      }),
      // AI extensions with Cloud - simplified configuration
      configureTiptapAI(),
      configureAiAgent(),
    ],
    content: '',
    autofocus: true,
    editable: true,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[600px] px-8 py-6',
      },
    },
    onCreate: ({ editor }) => {
      console.log('Editor created, AI Agent should be available with cloud provider');
      setAiAgentReady(true);
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
  }, [provider]); // Re-create editor when provider is ready

  // Callback for editor ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  const takeSnapshot = useCallback(() => {
    if (!editor) return;
    
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
      const { spellCheckService } = await import('@/lib/services/spell-check');
      await spellCheckService.checkEditor(editor);
    } catch (error) {
      console.error('Spell check error:', error);
      alert('Spell check failed. Please try again.');
    }
  }, [editor]);

  const checkGrammar = useCallback(() => {
    checkSpelling();
  }, [checkSpelling]);

  const showInvisibleCharacters = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleInvisibleCharacters().run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8a7fae] mx-auto mb-4"></div>
          <p className="text-gray-600">
            {provider ? 'Loading editor...' : 'Connecting to cloud...'}
          </p>
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

      {/* Status bar */}
      <div className="px-4 py-1 bg-gray-50 text-xs text-gray-600 border-b flex items-center gap-4">
        <span className={provider?.isConnected ? 'text-green-600' : 'text-red-600'}>
          {provider?.isConnected ? '● Connected' : '● Disconnected'}
        </span>
        <span>Document: {documentName}</span>
        {aiAgentReady && <span className="text-blue-600">AI Agent Ready</span>}
      </div>

      {/* Editor */}
      <div ref={editorRef} className="flex-1 overflow-y-auto relative bg-white">
        <EditorContent editor={editor} className="template-editor h-full" />
        
        {/* AI Agent Menu - Now works with cloud */}
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

      {/* AI Chat Modal - Uses basic AI, not Agent */}
      {showAiChat && (
        <AiMenu 
          editor={editor}
          onClose={() => setShowAiChat(false)}
        />
      )}
    </div>
  );
}
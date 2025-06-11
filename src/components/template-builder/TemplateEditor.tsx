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
import { useCallback, useEffect, useRef, useState } from 'react';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';
import EditorToolbar from './EditorToolbar';
import AiMenu from './AiMenu';
import AiAgentMenu from './AiAgentMenu';
import CollaborationPresence from './CollaborationPresence';
import { buttonStyles } from '@/lib/utils/button-styles';
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

  // Initialize IndexedDB persistence
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
        history: false, // We're using CollaborationHistory instead
        heading: {
          levels: [1, 2, 3],
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
        allowBase64: true,
        acceptedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'],
        onPaste: () => {
          // Images are handled automatically by the extension
        },
        onDrop: () => {
          // Images are handled automatically by the extension
        },
      }),
      Emoji.configure({
        enableEmoticons: true,
        emojis: gitHubEmojis,
      }),
      UniqueID.configure({
        attributeName: 'data-unique-id',
        types: ['paragraph', 'heading', 'listItem'],
      }),
      CollaborationHistory.configure({
        provider: null, // We'll use local storage for now
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
    
    const timestamp = new Date().toLocaleString();
    const content = editor.getHTML();
    
    // Save to localStorage as a simple version history
    const snapshots = JSON.parse(localStorage.getItem('template-snapshots') || '[]');
    snapshots.push({ timestamp, content });
    // Keep only last 10 snapshots
    if (snapshots.length > 10) snapshots.shift();
    localStorage.setItem('template-snapshots', JSON.stringify(snapshots));
    
    alert(`Snapshot saved at ${timestamp}`);
  }, [editor]);

  const checkSpelling = useCallback(() => {
    if (!editor) return;
    // This would integrate with a spell check API
    alert('Spell check feature coming soon!');
  }, [editor]);

  const checkGrammar = useCallback(() => {
    if (!editor) return;
    // This would integrate with a grammar check API
    alert('Grammar check feature coming soon!');
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="template-editor-container flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Toolbar */}
      <EditorToolbar 
        editor={editor} 
        onOpenAiChat={() => setShowAiChat(true)}
      />

      {/* Editor */}
      <div ref={editorRef} className="flex-1 overflow-y-auto relative">
        <EditorContent editor={editor} className="template-editor" />
        
        {/* AI Agent Menu */}
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
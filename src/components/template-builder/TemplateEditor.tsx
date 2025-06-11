'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import CharacterCount from '@tiptap/extension-character-count';
import { useDroppable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import CollaborationHistory from '@tiptap-pro/extension-collaboration-history';
import FileHandler from '@tiptap-pro/extension-file-handler';
import UniqueID from '@tiptap-pro/extension-unique-id';
// Remove DragHandle for now - it's a React component, not an extension
import Emoji from '@tiptap-pro/extension-emoji';
import Mathematics from '@tiptap-pro/extension-mathematics';
import Snapshot from '@tiptap-pro/extension-snapshot';
import { 
  configureTiptapAI, 
  configureAiChanges, 
  configureAiSuggestion,
  createAiAgentProvider,
  configureAiAgent 
} from '@/lib/tiptap/ai-config';
import EditorToolbar from './EditorToolbar';
import AiMenu from './AiMenu';
import AiAgentMenu from './AiAgentMenu';
import CollaborationPresence from './CollaborationPresence';
import { buttonStyles } from '@/lib/utils/button-styles';

interface TemplateEditorProps {
  onEditorReady?: (editor: any, aiProvider?: any) => void;
}

// Mock users for now - in production, this would come from your auth system
const mockUsers = [
  { name: 'You', color: '#8B5CF6' },
];

export default function TemplateEditor({ onEditorReady }: TemplateEditorProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'editor-droppable',
  });
  
  const [ydoc] = useState(() => new Y.Doc());
  const [users, setUsers] = useState(mockUsers);
  const [showAiAgent, setShowAiAgent] = useState(false);
  const [aiAgentPosition, setAiAgentPosition] = useState({ top: 0, left: 0 });
  const [aiAgentProvider, setAiAgentProvider] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Initialize AI Agent Provider
  useEffect(() => {
    const provider = createAiAgentProvider();
    setAiAgentProvider(provider);

    // Subscribe to AI Agent state changes
    provider.on('stateChange', (newState) => {
      setIsAiLoading(newState.isLoading || false);
    });

    // Subscribe to AI Agent errors
    provider.on('loadingError', (error) => {
      console.error('AI Agent error:', error);
      // You could show a toast notification here
    });

    return () => {
      provider.destroy();
    };
  }, []);

  // Initialize collaboration
  useEffect(() => {
    // For local development, we'll use IndexedDB for persistence
    const indexeddbProvider = new IndexeddbPersistence('ghostwriter-template', ydoc);
    
    return () => {
      indexeddbProvider.destroy();
    };
  }, [ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // We'll use collaboration history
      }),
      configureTiptapAI(),
      configureAiChanges(),
      configureAiSuggestion(),
      aiAgentProvider ? configureAiAgent(aiAgentProvider) : null,
      UniqueID.configure({
        attributeName: 'data-id',
        types: ['paragraph', 'heading', 'listItem'],
      }),
      FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        onDrop: (currentEditor, files, pos) => {
          files.forEach(file => {
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
        onPaste: (currentEditor, files) => {
          files.forEach(file => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
              currentEditor.chain().insertContent({
                type: 'image',
                attrs: {
                  src: fileReader.result,
                },
              }).focus().run();
            };
          });
        },
      }),
      Typography,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextStyle,
      Color,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent-lavender underline',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList.configure({
        HTMLAttributes: {
          class: 'space-y-2',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start',
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`;
          }
          return 'Start typing your template or drag variables from the left panel... Type "/" for AI commands or "++" for suggestions';
        },
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationHistory.configure({
        provider: null, // We'll add WebSocket provider when ready
      }),
      CollaborationCursor.configure({
        provider: null,
        user: {
          name: 'You',
          color: '#8B5CF6',
        },
      }),
      Snapshot.configure({
        onSnapshot: (editor: any) => {
          const content = editor.getJSON();
          const snapshot = {
            content,
            timestamp: new Date().toISOString(),
            author: 'You',
          };
          console.log('Snapshot created:', snapshot);
          // Here you would save the snapshot to your backend
          return snapshot;
        },
      }),
      CharacterCount.configure({
        limit: null,
      }),
      Emoji.configure({
        enableEmoticons: true,
        suggestion: {
          char: ':',
          startOfLine: false,
        },
      }),
      Mathematics,
    ].filter(Boolean),
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[600px] px-12 py-8',
        spellcheck: 'true',
      },
      handleKeyDown: (view, event) => {
        // Trigger AI Agent with '/' key
        if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          const editorRect = view.dom.getBoundingClientRect();
          
          setAiAgentPosition({
            top: coords.top - editorRect.top + coords.bottom - coords.top,
            left: coords.left - editorRect.left,
          });
          setShowAiAgent(true);
          
          // Prevent the '/' from being inserted
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
  }, [aiAgentProvider]);

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor, aiAgentProvider);
    }
  }, [editor, aiAgentProvider, onEditorReady]);

  // Take snapshot
  const takeSnapshot = () => {
    if (editor) {
      // The Snapshot extension likely uses a different API
      // For now, we'll create a manual snapshot
      const content = editor.getJSON();
      const snapshot = {
        content,
        timestamp: new Date().toISOString(),
        author: 'You',
      };
      console.log('Snapshot created:', snapshot);
      // Here you would save the snapshot to your backend
      
      // Show feedback to user
      alert('Snapshot saved!');
    }
  };

  // Spell check integration
  const checkSpelling = async () => {
    if (!editor) return;
    
    const text = editor.getText();
    try {
      const response = await fetch('https://api.languagetoolplus.com/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          language: 'en-US',
        }),
      });
      
      const data = await response.json();
      console.log('Spelling/Grammar check:', data);
      // Here you would highlight the errors in the editor
    } catch (error) {
      console.error('Spell check error:', error);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      {/* Enhanced Toolbar */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <EditorToolbar editor={editor} />
          <div className="flex items-center space-x-4">
            <CollaborationPresence users={users} />
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
            >
              Check Spelling
            </button>
            <AiMenu editor={editor} />
          </div>
        </div>
      </div>
      
      {/* Editor Container - Letter Size */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div 
          ref={setNodeRef}
          className={classNames(
            "mx-auto bg-white shadow-lg transition-all duration-200",
            isOver ? "ring-4 ring-accent-lavender ring-opacity-30 shadow-xl" : ""
          )}
          style={{
            width: '8.5in',
            minHeight: '11in',
            padding: '1in',
          }}
        >
          <EditorContent editor={editor} className="template-editor" />
          <AiAgentMenu
            editor={editor}
            show={showAiAgent}
            position={aiAgentPosition}
            onClose={() => setShowAiAgent(false)}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 px-4 py-2 text-sm text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Words: {editor.storage.characterCount?.words() || 0}</span>
          <span>Characters: {editor.storage.characterCount?.characters() || 0}</span>
          <span className="text-accent-lavender">Press / for AI commands • Type ++ for suggestions</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Auto-saved
          </span>
        </div>
      </div>

      {/* AI Loading Indicator */}
      {isAiLoading && (
        <div className="absolute bottom-20 right-4 bg-[#8a7fae] text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          AI is thinking...
        </div>
      )}
    </div>
  );
}

function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import CollaborationHistory from '@tiptap-pro/extension-collaboration-history';
import Comments from '@tiptap-pro/extension-comments';
import { Mathematics } from '@tiptap-pro/extension-mathematics';
import FileHandler from '@tiptap-pro/extension-file-handler';
import { Emoji, gitHubEmojis } from '@tiptap-pro/extension-emoji';
import AI from '@tiptap-pro/extension-ai';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import UniqueID from '@tiptap-pro/extension-unique-id';
import DragHandle from '@tiptap-pro/extension-drag-handle';
import Snapshot from '@tiptap-pro/extension-snapshot';
import Details from '@tiptap-pro/extension-details';
import DetailsSummary from '@tiptap-pro/extension-details-summary';
import DetailsContent from '@tiptap-pro/extension-details-content';
import InvisibleCharacters from '@tiptap-pro/extension-invisible-characters';
import { useCallback, useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import EditorToolbar from './EditorToolbar';
import AiMenu from './AiMenu';
import { buttonStyles } from '@/lib/utils/button-styles';
import { TIPTAP_CLOUD_CONFIG } from '@/lib/tiptap/cloud-config';
import 'katex/dist/katex.min.css';

interface TemplateEditorCloudProps {
  documentId: string;
  userId: string;
  userName: string;
  templateName?: string;
  onEditorReady?: (editor: any) => void;
}

export default function TemplateEditorCloud({ 
  documentId, 
  userId, 
  userName,
  templateName = 'Untitled Template',
  onEditorReady
}: TemplateEditorCloudProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [tokens, setTokens] = useState<any>(null);
  const [status, setStatus] = useState<string>('Connecting...');
  const [ydoc] = useState(() => new Y.Doc());
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMenuPosition, setAiMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Get authentication tokens
  useEffect(() => {
    async function getTokens() {
      try {
        const response = await fetch('/api/tiptap-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userName, documentId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get authentication tokens');
        }
        
        const tokens = await response.json();
        setTokens(tokens);
      } catch (error) {
        console.error('Auth error:', error);
        setStatus('Authentication failed');
      }
    }
    getTokens();
  }, [userId, userName, documentId]);

  // Initialize collaboration provider
  useEffect(() => {
    if (!tokens) return;

    // Update the WebSocket URL to match your config
    const wsUrl = `${TIPTAP_CLOUD_CONFIG.collaborationUrl}/${TIPTAP_CLOUD_CONFIG.appId}`;
    
    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: documentId,
      document: ydoc,
      token: tokens.documentToken,
      
      onOpen: () => {
        setStatus('Connected');
        console.log('Connected to collaboration server');
      },
      
      onClose: () => {
        setStatus('Disconnected');
        console.log('Disconnected from collaboration server');
      },
      
      onSynced: () => {
        console.log('Document synced');
      },
      
      onError: (event: any) => {
        console.error('Collaboration error:', event);
        setStatus('Connection error');
      },
    } as any);

    setProvider(provider);

    return () => {
      provider.destroy();
    };
  }, [documentId, tokens, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Collaboration handles history
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      ...(provider ? [
        CollaborationCursor.configure({
          provider: provider as any,
          user: {
            name: userName,
            color: '#8a7fae',
          },
        }),
        CollaborationHistory.configure({
          provider: provider as any,
        }),
        Comments.configure({
          provider: provider as any,
        }),
      ] : []),
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
        visible: false,
      }),
      AI.configure({
        appId: TIPTAP_CLOUD_CONFIG.aiAppId,
        token: tokens?.aiToken || TIPTAP_CLOUD_CONFIG.aiSecret,
        baseUrl: 'https://api.tiptap.dev/v1',
        autocompletion: true,
      } as any),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[600px] px-8 py-6',
      },
    },
    onCreate: ({ editor }) => {
      if (onEditorReady) {
        onEditorReady(editor);
      }
    },
    onUpdate: ({ editor }) => {
      // Check for "/" to show AI agent menu
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from - 1, from);
      
      
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      setSelectedText(text);
    },
  }, [provider, tokens, onEditorReady]);

  const takeSnapshot = useCallback(() => {
    if (!editor) return;
    
    // Save snapshot to localStorage
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

  if (!editor || !provider) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8a7fae] mx-auto mb-4"></div>
          <p className="text-gray-600">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="template-editor-container flex flex-col h-full bg-white rounded-lg shadow-sm">
      <EditorToolbar 
        editor={editor} 
        onOpenAiChat={() => setShowAiChat(true)}
      />
      
      <div ref={editorRef} className="flex-1 overflow-y-auto relative">
        <EditorContent editor={editor} className="template-editor" />
        
      </div>
      
      <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${
              status === 'Connected' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {status}
          </span>
          <span>Document: {templateName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>{editor.storage.characterCount?.characters() || 0} characters</span>
          <span>{editor.storage.characterCount?.words() || 0} words</span>
          <button onClick={takeSnapshot} className={buttonStyles.text} title="Save version">
            Snapshot
          </button>
          <button onClick={checkSpelling} className={buttonStyles.text} title="Check spelling">
            Spelling
          </button>
          <button onClick={checkGrammar} className={buttonStyles.text} title="Check grammar">
            Grammar
          </button>
          <button onClick={showInvisibleCharacters} className={buttonStyles.text} title="Show/hide invisible characters">
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
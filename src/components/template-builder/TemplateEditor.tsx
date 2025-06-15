'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
// Only include Pro extensions that are known to be compatible
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
import InvisibleCharacters from '@tiptap-pro/extension-invisible-characters';
import { useCallback, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { Plugin } from 'prosemirror-state';
import EditorToolbar from './EditorToolbar';
import 'katex/dist/katex.min.css';

// Reusable component block support
import { Node } from '@tiptap/core';
const ReusableBlock = Node.create({
  name: 'reusableBlock',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      label: { default: '' },
      imageUrl: { default: '' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-reusable-block]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        ...HTMLAttributes,
        'data-reusable-block': 'true',
        class: 'p-2 border rounded bg-zinc-100 flex items-center gap-2',
      },
      ...(HTMLAttributes.imageUrl
        ? [['img', { src: HTMLAttributes.imageUrl, class: 'h-8 w-auto', alt: HTMLAttributes.label }]]
        : []),
      ['span', { class: 'text-sm font-medium text-zinc-700' }, HTMLAttributes.label],
    ];
  },
});

// Drag + Snap-to-Section
import { Extension } from '@tiptap/core';
const GhostwriterDropExtension = Extension.create({
  name: 'ghostwriterDrop',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDrop(view, event) {
            const data = event.dataTransfer?.getData('application/x-ghostwriter');
            if (!data) return false;
            const parsed = JSON.parse(data);
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (!coords) return false;

            let insertPos = coords.pos;
            const $pos = view.state.doc.resolve(coords.pos);
            for (let i = $pos.depth; i > 0; i--) {
              const node = $pos.node(i);
              if (node.type.name === 'heading') {
                insertPos = $pos.before(i + 1);
                break;
              }
            }

            const tr = view.state.tr;
            if (parsed.type === 'Text' || parsed.type === 'Date' || parsed.type === 'ID') {
              tr.insertText(`{{${parsed.name}}}`, insertPos);
            } else {
              const node = view.state.schema.nodes.reusableBlock.create({
                label: parsed.name,
                imageUrl: parsed.imageUrl || '',
              });
              tr.insert(insertPos, node);
            }

            view.dispatch(tr);
            return true;
          },
        },
      }),
    ];
  },
});

interface TemplateEditorProps {
  documentId: string;
  userId: string;
  userName: string;
  templateName?: string;
  onEditorReady?: (editor: any) => void;
  onContentChange?: (content: string) => void;
}

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function TemplateEditor({
  documentId,
  userId,
  userName,
  templateName = 'Untitled Template',
  onEditorReady,
  onContentChange,
}: TemplateEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [tokens, setTokens] = useState<any>(null);
  const [status, setStatus] = useState('Connecting...');
  const [ydoc] = useState(() => new Y.Doc());

  useEffect(() => {
    async function getTokens() {
      try {
        const response = await fetch('/api/tiptap-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userName, documentId }),
        });
        if (!response.ok) throw new Error('Failed to get authentication tokens');
        const tokens = await response.json();
        setTokens(tokens);
      } catch (error) {
        console.error('Auth error:', error);
        setStatus('Authentication failed - Using local mode');
        // Continue without cloud features
      }
    }
    getTokens();
  }, [userId, userName, documentId]);

  useEffect(() => {
    if (!tokens) return;
    
    try {
      // Create HocuspocusProvider for TipTap collaboration
      const provider = new HocuspocusProvider({
        url: `wss://collab.tiptap.dev/v1/${tokens.appId}`,
        name: documentId,
        document: ydoc,
        token: tokens.documentToken,
        onOpen: () => setStatus('Connected'),
        onClose: () => setStatus('Disconnected'),
        onError: (error: any) => {
          console.error('Collab error:', error);
          setStatus('Connection error - Working locally');
        },
      } as any);
      
      setProvider(provider);
      return () => {
        if (provider && typeof provider.destroy === 'function') {
          provider.destroy();
        }
      };
    } catch (error) {
      console.error('Provider setup error:', error);
      setStatus('Local mode');
    }
  }, [tokens, documentId, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        history: false, // Disable default history when using collaboration
        heading: { levels: [1, 2, 3] } 
      }),
      // Y.js collaboration - this handles version history automatically
      Collaboration.configure({ document: ydoc }),
      // Collaboration cursor with user info
      ...(provider ? [
        CollaborationCursor.configure({ 
          provider, 
          user: { name: userName, color: '#71717a' } 
        }),
      ] : []),
      Placeholder.configure({
        placeholder: 'Start typing your letter here, or ask Casper AI to draft one for you...',
        showOnlyWhenEditable: true,
        emptyEditorClass: 'is-editor-empty',
      }),
      Typography,
      Highlight.configure({ 
        multicolor: true, 
        HTMLAttributes: { class: 'highlight' } 
      }),
      TextAlign.configure({ 
        types: ['heading', 'paragraph'], 
        alignments: ['left', 'center', 'right', 'justify'] 
      }),
      Underline,
      CharacterCount.configure({ limit: null }),
      Mathematics,
      Table.configure({ 
        resizable: true, 
        HTMLAttributes: { class: 'template-table' } 
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
                attrs: { src: fileReader.result },
              }).focus().run();
            };
          });
        },
      }),
      Emoji.configure({ 
        enableEmoticons: true, 
        emojis: gitHubEmojis 
      }),
      UniqueID.configure({ 
        attributeName: 'data-unique-id', 
        types: ['paragraph', 'heading', 'listItem'] 
      }),
      DragHandle.configure({ 
        render: () => {
          const el = document.createElement('div');
          el.classList.add('drag-handle');
          el.innerHTML = '⋮⋮';
          return el;
        } 
      }),
      InvisibleCharacters.configure({ visible: false }),
      ReusableBlock,
      GhostwriterDropExtension,
      // AI extension with proper configuration (only if tokens available)
      ...(tokens?.aiToken ? [
        AI.configure({
          appId: tokens.aiAppId,
          token: tokens.aiToken,
          autocompletion: true,
        })
      ] : []),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[600px] px-8 py-6 text-zinc-900',
      },
    },
    onCreate: ({ editor }) => {
      console.log('📝 Editor created successfully');
      onEditorReady?.(editor);
    },
    onUpdate: ({ editor }) => {
      // This will be called for all changes, including collaborative ones
      const content = editor.getHTML();
      
      // Only save to localStorage and call onChange for local changes
      // Collaboration changes are automatically synced via Y.js
      localStorage.setItem(`template-${documentId}`, content);
      onContentChange?.(content);
    },
    // Handle collaboration events
    onTransaction: ({ editor, transaction }) => {
      // This fires for every transaction, including collaborative ones
      // Use this for real-time features like live cursors, etc.
    },
  }, [provider, tokens, onEditorReady, ydoc, userName, documentId, onContentChange]);

  const takeSnapshot = useCallback(() => {
    if (!editor) return;
    // Manual snapshot implementation
    const content = editor.getHTML();
    const snapshots = JSON.parse(localStorage.getItem('template-snapshots') || '[]');
    snapshots.push({ 
      id: Date.now(), 
      timestamp: new Date().toISOString(), 
      content,
      templateName 
    });
    if (snapshots.length > 20) snapshots.shift();
    localStorage.setItem('template-snapshots', JSON.stringify(snapshots));
    alert('Snapshot saved!');
  }, [editor, templateName]);

  const checkSpelling = useCallback(async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to || editor.state.doc.content.size);
    if (!text) return alert('Please select some text to check.');
    
    const apiUrl = process.env.NEXT_PUBLIC_LANGUAGETOOL_API_KEY
      ? 'https://api.languagetoolplus.com/v2/check'
      : 'https://api.languagetool.org/v2/check';
    
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded', 
          Accept: 'application/json' 
        },
        body: new URLSearchParams({
          text,
          language: 'en-US',
          apiKey: process.env.NEXT_PUBLIC_LANGUAGETOOL_API_KEY || '',
          disabledRules: 'WHITESPACE_RULE,PUNCTUATION_PARAGRAPH_END',
        }),
      });
      
      const data = await res.json();
      if (data.matches?.length > 0) {
        const errors = data.matches.map((m: any) => 
          `• ${m.message} (at ${m.offset})`
        ).join('\n');
        alert(`Issues Found:\n\n${errors}`);
      } else {
        alert('No issues found!');
      }
    } catch (err) {
      console.error('Spell check error:', err);
      alert('Spell check failed.');
    }
  }, [editor]);

  const showInvisibleCharacters = useCallback(() => {
    editor?.chain().focus().toggleInvisibleCharacters().run();
  }, [editor]);

  // Load saved content on mount
  useEffect(() => {
    if (editor && documentId) {
      const saved = localStorage.getItem(`template-${documentId}`);
      if (saved && saved !== '<p></p>') {
        editor.commands.setContent(saved);
      }
    }
  }, [editor, documentId]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-zinc-600">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="template-editor-container flex flex-col h-full bg-white rounded-lg border border-zinc-200">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto relative bg-zinc-50">
        <EditorContent editor={editor} id="editor-droppable" className="template-editor h-full" />
      </div>
      <div className="border-t border-zinc-200 px-4 py-2 flex items-center justify-between text-sm text-zinc-600 bg-white">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <span className={classNames(
              "w-2 h-2 rounded-full mr-2",
              status === 'Connected' ? 'bg-emerald-500' : 
              status.includes('local') || status.includes('Local') ? 'bg-blue-500' :
              'bg-zinc-400'
            )} />
            {status}
          </span>
          <span>Document: {templateName}</span>
          <span className="text-zinc-600">Ask Casper AI to help</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>{editor.storage.characterCount?.characters() || 0} characters</span>
          <span>{editor.storage.characterCount?.words() || 0} words</span>
          <button 
            onClick={takeSnapshot} 
            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500"
          >
            Snapshot
          </button>
          <button 
            onClick={checkSpelling} 
            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500"
          >
            Spelling
          </button>
          <button 
            onClick={showInvisibleCharacters} 
            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500"
          >
            ¶
          </button>
        </div>
      </div>
    </div>
  );
}
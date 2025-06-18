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
import EditorToolbar from './EditorToolbar';
import { useDroppable } from '@dnd-kit/core';
import 'katex/dist/katex.min.css';
import Image from '@tiptap/extension-image';
import { PageBreak } from '@/lib/tiptap/extensions/page-break';

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

interface TemplateEditorProps {
  documentId: string;
  userId: string;
  userName: string;
  templateName?: string;
  initialContent?: string; // Add this prop for Firebase content
  isExistingTemplate?: boolean; // Add this prop to know if we're editing
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
  initialContent = '', // Firebase content
  isExistingTemplate = false, // Whether this is an existing template
  onEditorReady,
  onContentChange,
}: TemplateEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [tokens, setTokens] = useState<any>(null);
  const [status, setStatus] = useState('Connecting...');
  const [ydoc] = useState(() => new Y.Doc());
  const [contentLoaded, setContentLoaded] = useState(false);
  const [showPageMargins, setShowPageMargins] = useState(true);

  // Add droppable zone for @dnd-kit
  const { setNodeRef, isOver } = useDroppable({
    id: 'editor-droppable',
  });

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
      // Image extension for proper image rendering - PRESERVE EXISTING FUNCTIONALITY
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image', // Keep existing class for resizable functionality
        },
      }),
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
      // Page Break Extension
      PageBreak,
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
        class: 'template-editor-content prose prose-sm max-w-none focus:outline-none text-zinc-900 document-editor',
      },
    },
    onCreate: ({ editor }) => {
      console.log('📝 Editor created successfully');
      onEditorReady?.(editor);
    },
    onUpdate: ({ editor }) => {
      // This will be called for all changes, including collaborative ones
      const content = editor.getHTML();
      
      // Only save to localStorage for NEW templates (not existing ones)
      if (!isExistingTemplate) {
        localStorage.setItem(`template-${documentId}`, content);
      }
      
      onContentChange?.(content);
    },
    // Handle collaboration events
    onTransaction: ({ editor, transaction }) => {
      // This fires for every transaction, including collaborative ones
      // Use this for real-time features like live cursors, etc.
    },
  }, [provider, tokens, onEditorReady, ydoc, userName, documentId, onContentChange, isExistingTemplate]);

  // FIXED: Proper content loading logic
  useEffect(() => {
    if (!editor || contentLoaded) return;

    console.log('🔄 Loading content...', {
      isExistingTemplate,
      hasInitialContent: !!initialContent,
      documentId
    });

    if (isExistingTemplate && initialContent) {
      // For existing templates, prioritize Firebase content
      console.log('📄 Loading Firebase content for existing template');
      editor.commands.setContent(initialContent);
      setContentLoaded(true);
    } else if (!isExistingTemplate) {
      // For new templates, try localStorage first
      const saved = localStorage.getItem(`template-${documentId}`);
      if (saved && saved !== '<p></p>') {
        console.log('💾 Loading localStorage content for new template');
        editor.commands.setContent(saved);
      }
      setContentLoaded(true);
    }
  }, [editor, initialContent, isExistingTemplate, documentId, contentLoaded]);

  // Update content when initialContent changes (for existing templates)
  useEffect(() => {
    if (editor && isExistingTemplate && initialContent && contentLoaded) {
      console.log('🔄 Updating content from Firebase');
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent, isExistingTemplate, contentLoaded]);

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

  const toggleMargins = useCallback(() => {
    setShowPageMargins(!showPageMargins);
    console.log('Toggling margins:', !showPageMargins);
  }, [showPageMargins]);

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
      <EditorToolbar 
        editor={editor} 
        showPageMargins={showPageMargins}
        onToggleMargins={toggleMargins}
      />
      
      {/* Document Container with Letter Size */}
      <div className="flex-1 overflow-y-auto bg-zinc-100 p-6">
        <div 
          ref={setNodeRef}
          className={classNames(
            "document-container mx-auto bg-white shadow-lg transition-all duration-200",
            isOver ? "ring-4 ring-blue-500 ring-opacity-30" : "",
            showPageMargins ? "document-with-margins" : ""
          )}
          style={{
            width: '8.5in',
            minHeight: '11in',
            maxWidth: '100%',
            padding: showPageMargins ? '1in 1in 1in 1in' : '0.75in',
            position: 'relative',
          }}
        >
          {/* Margin Guidelines */}
          {showPageMargins && (
            <>
              {/* Top margin line */}
              <div 
                className="absolute left-0 right-0 border-t-2 border-blue-400 border-dashed pointer-events-none"
                style={{ top: '1in', opacity: 0.7, zIndex: 10 }}
              />
              {/* Bottom margin line */}
              <div 
                className="absolute left-0 right-0 border-b-2 border-blue-400 border-dashed pointer-events-none"
                style={{ bottom: '1in', opacity: 0.7, zIndex: 10 }}
              />
              {/* Left margin line */}
              <div 
                className="absolute top-0 bottom-0 border-l-2 border-blue-400 border-dashed pointer-events-none"
                style={{ left: '1in', opacity: 0.7, zIndex: 10 }}
              />
              {/* Right margin line */}
              <div 
                className="absolute top-0 bottom-0 border-r-2 border-blue-400 border-dashed pointer-events-none"
                style={{ right: '1in', opacity: 0.7, zIndex: 10 }}
              />
            </>
          )}
          
          <EditorContent 
            editor={editor} 
            id="editor-droppable" 
            className="template-editor h-full document-content" 
          />
        </div>
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
          <button 
            onClick={toggleMargins} 
            className={classNames(
              "inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500",
              showPageMargins 
                ? "bg-blue-100 text-blue-900 hover:bg-blue-200" 
                : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            )}
            title={showPageMargins ? "Hide Margins" : "Show Margins"}
          >
            {showPageMargins ? "Hide Margins" : "Show Margins"}
          </button>
        </div>
      </div>
      
      {/* CSS for document styling - moved to external CSS file */}
    </div>
  );
}
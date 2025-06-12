'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import { Mathematics } from '@tiptap-pro/extension-mathematics';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Emoji, gitHubEmojis } from '@tiptap-pro/extension-emoji';
import FileHandler from '@tiptap-pro/extension-file-handler';
import UniqueID from '@tiptap-pro/extension-unique-id';
import DragHandle from '@tiptap-pro/extension-drag-handle';
import Snapshot from '@tiptap-pro/extension-snapshot';
import Details from '@tiptap-pro/extension-details';
import DetailsSummary from '@tiptap-pro/extension-details-summary';
import DetailsContent from '@tiptap-pro/extension-details-content';
import InvisibleCharacters from '@tiptap-pro/extension-invisible-characters';
import Image from '@tiptap/extension-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';
import EditorToolbar from './EditorToolbar';
import { buttonStyles } from '@/lib/utils/button-styles';
import { LanguageTool } from '@/lib/tiptap/extensions/languagetool';
import { configureTiptapAI } from '@/lib/tiptap/ai-config';
import 'katex/dist/katex.min.css';

interface TemplateEditorProps {
  onEditorReady?: (editor: any) => void;
}

export default function TemplateEditor({ onEditorReady }: TemplateEditorProps) {
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
        // history is included by default in StarterKit
      }),
      configureTiptapAI(), // Standard Tiptap AI extension
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
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'template-link',
        },
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
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'template-image',
        },
      }),
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
      LanguageTool.configure({
        apiKey: process.env.NEXT_PUBLIC_LANGUAGETOOL_API_KEY,
        language: 'en-US',
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
  });

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
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to || editor.state.doc.content.size);
      
      if (!text) {
        alert('Please select some text to check.');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_LANGUAGETOOL_API_KEY 
        ? 'https://api.languagetoolplus.com/v2/check'
        : 'https://api.languagetool.org/v2/check';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          text: text,
          language: 'en-US',
          apiKey: process.env.NEXT_PUBLIC_LANGUAGETOOL_API_KEY || '',
          enabledRules: '',
          disabledRules: 'WHITESPACE_RULE,PUNCTUATION_PARAGRAPH_END',
        }),
      });

      const data = await response.json();
      
      if (data.matches && data.matches.length > 0) {
        const errors = data.matches.map((match: any) => 
          `• ${match.message} (at position ${match.offset})`
        ).join('\n');
        
        alert(`Grammar/Spelling Issues Found:\n\n${errors}`);
      } else {
        alert('No spelling or grammar issues found!');
      }
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
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="template-editor-container flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor */}
      <div ref={editorRef} className="flex-1 overflow-y-auto relative bg-white">
        <EditorContent editor={editor} className="template-editor h-full" />
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
    </div>
  );
}
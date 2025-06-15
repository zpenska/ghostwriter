'use client';

import { Editor } from '@tiptap/react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  Code2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  MinusIcon,
  UndoIcon,
  RedoIcon,
  TableIcon,
  ImageIcon,
  LinkIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  HighlighterIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface EditorToolbarProps {
  editor: Editor | null;
  onOpenAiChat?: () => void;
}

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function EditorToolbar({ editor, onOpenAiChat }: EditorToolbarProps) {
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const highlightMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (highlightMenuRef.current && !highlightMenuRef.current.contains(event.target as Node)) {
        setShowHighlightMenu(false);
      }
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) {
    return null;
  }

  const highlightColors = [
    { name: 'Yellow', color: '#fef08a' },
    { name: 'Green', color: '#bbf7d0' },
    { name: 'Blue', color: '#bfdbfe' },
    { name: 'Pink', color: '#fbcfe8' },
    { name: 'Clear', color: 'transparent' },
  ];

  return (
    <div className="border-b border-zinc-200 bg-white p-2">
      <div className="flex items-center space-x-1 flex-wrap">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('bold') ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Bold"
          >
            <BoldIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('italic') ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Italic"
          >
            <ItalicIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('underline') ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('strike') ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Strikethrough"
          >
            <StrikethroughIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('code') ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Code"
          >
            <Code2Icon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-300" />

        {/* Alignment */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive({ textAlign: 'left' }) ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Align Left"
          >
            <AlignLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive({ textAlign: 'center' }) ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Align Center"
          >
            <AlignCenterIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive({ textAlign: 'right' }) ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Align Right"
          >
            <AlignRightIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive({ textAlign: 'justify' }) ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Justify"
          >
            <AlignJustifyIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-300" />

        {/* Headings */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('heading', { level: 1 }) ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Heading 1"
          >
            <Heading1Icon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('heading', { level: 2 }) ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Heading 2"
          >
            <Heading2Icon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('heading', { level: 3 }) ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Heading 3"
          >
            <Heading3Icon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-300" />

        {/* Lists */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('bulletList') ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Bullet List"
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('orderedList') ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Numbered List"
          >
            <ListOrderedIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={classNames(
              "p-1.5 rounded hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1",
              editor.isActive('blockquote') ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600'
            )}
            title="Quote"
          >
            <QuoteIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1"
            title="Horizontal Rule"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-300" />

        {/* Highlight */}
        <div className="relative" ref={highlightMenuRef}>
          <button
            type="button"
            onClick={() => setShowHighlightMenu(!showHighlightMenu)}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 flex items-center space-x-1 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1"
            title="Highlight"
          >
            <HighlighterIcon className="h-4 w-4" />
            <ChevronDownIcon className="h-3 w-3" />
          </button>
          {showHighlightMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg ring-1 ring-zinc-200 z-10">
              <div className="p-2 space-y-1">
                {highlightColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => {
                      if (color.color === 'transparent') {
                        editor.chain().focus().unsetHighlight().run();
                      } else {
                        editor.chain().focus().toggleHighlight({ color: color.color }).run();
                      }
                      setShowHighlightMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  >
                    <div 
                      className="w-4 h-4 rounded border border-zinc-300"
                      style={{ backgroundColor: color.color }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="relative" ref={tableMenuRef}>
          <button
            type="button"
            onClick={() => setShowTableMenu(!showTableMenu)}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 flex items-center space-x-1 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1"
            title="Table"
          >
            <TableIcon className="h-4 w-4" />
            <ChevronDownIcon className="h-3 w-3" />
          </button>
          {showTableMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg ring-1 ring-zinc-200 z-10">
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  Insert Table
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().addColumnAfter().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  Add Column
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().addRowAfter().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  Add Row
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteColumn().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  Delete Column
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteRow().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  Delete Row
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteTable().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded text-red-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  Delete Table
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-zinc-300" />

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1"
            title="Undo"
          >
            <UndoIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1"
            title="Redo"
          >
            <RedoIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-300" />

        {/* AI Button */}
        {onOpenAiChat && (
          <button
            type="button"
            onClick={onOpenAiChat}
            className="text-xs px-3 py-1 bg-zinc-900 text-white hover:bg-zinc-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            AI
          </button>
        )}
      </div>
    </div>
  );
}
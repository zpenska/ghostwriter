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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface EditorToolbarProps {
  editor: Editor | null;
  onOpenAiChat?: () => void;
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
    { name: 'Swift', color: '#E3F2FD' },
    { name: 'Neural', color: '#FFEBEE' },
    { name: 'Scrub', color: '#C8E6C9' },
    { name: 'Yellow', color: '#FFF59D' },
    { name: 'Clear', color: 'transparent' },
  ];

  return (
    <div className="border-b border-gray-200 bg-white p-2">
      <div className="flex items-center space-x-1 flex-wrap">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1">
          <Button
            plain
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5",
              editor.isActive('bold') ? 'bg-gray-200' : ''
            )}
          >
            <BoldIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5",
              editor.isActive('italic') ? 'bg-gray-200' : ''
            )}
          >
            <ItalicIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "p-1.5",
              editor.isActive('underline') ? 'bg-gray-200' : ''
            )}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5",
              editor.isActive('strike') ? 'bg-gray-200' : ''
            )}
          >
            <StrikethroughIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              "p-1.5",
              editor.isActive('code') ? 'bg-gray-200' : ''
            )}
          >
            <Code2Icon className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Alignment */}
        <div className="flex items-center space-x-1">
          <Button
            plain
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn(
              "p-1.5",
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
            )}
          >
            <AlignLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn(
              "p-1.5",
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
            )}
          >
            <AlignCenterIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn(
              "p-1.5",
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
            )}
          >
            <AlignRightIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={cn(
              "p-1.5",
              editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''
            )}
          >
            <AlignJustifyIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Headings */}
        <div className="flex items-center space-x-1">
          <Button
            plain
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              "p-1.5",
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
            )}
          >
            <Heading1Icon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              "p-1.5",
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
            )}
          >
            <Heading2Icon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              "p-1.5",
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
            )}
          >
            <Heading3Icon className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Lists */}
        <div className="flex items-center space-x-1">
          <Button
            plain
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "p-1.5",
              editor.isActive('bulletList') ? 'bg-gray-200' : ''
            )}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "p-1.5",
              editor.isActive('orderedList') ? 'bg-gray-200' : ''
            )}
          >
            <ListOrderedIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "p-1.5",
              editor.isActive('blockquote') ? 'bg-gray-200' : ''
            )}
          >
            <QuoteIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5"
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Highlight */}
        <div className="relative" ref={highlightMenuRef}>
          <Button
            plain
            onClick={() => setShowHighlightMenu(!showHighlightMenu)}
            className="p-1.5 flex items-center space-x-1"
          >
            <HighlighterIcon className="h-4 w-4" />
            <ChevronDownIcon className="h-3 w-3" />
          </Button>
          {showHighlightMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              <div className="p-2 space-y-1">
                {highlightColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      if (color.color === 'transparent') {
                        editor.chain().focus().unsetHighlight().run();
                      } else {
                        editor.chain().focus().toggleHighlight({ color: color.color }).run();
                      }
                      setShowHighlightMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-1 text-sm text-left hover:bg-gray-100 rounded"
                  >
                    <div 
                      className="w-4 h-4 rounded border border-gray-300"
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
          <Button
            plain
            onClick={() => setShowTableMenu(!showTableMenu)}
            className="p-1.5 flex items-center space-x-1"
          >
            <TableIcon className="h-4 w-4" />
            <ChevronDownIcon className="h-3 w-3" />
          </Button>
          {showTableMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-gray-100 rounded"
                >
                  Insert Table
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().addColumnAfter().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-gray-100 rounded"
                >
                  Add Column
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().addRowAfter().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-gray-100 rounded"
                >
                  Add Row
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().deleteColumn().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-gray-100 rounded"
                >
                  Delete Column
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().deleteRow().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-gray-100 rounded"
                >
                  Delete Row
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().deleteTable().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-gray-100 rounded text-red-600"
                >
                  Delete Table
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Undo/Redo - Now simplified since we're using default history */}
        <div className="flex items-center space-x-1">
          <Button
            plain
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5"
          >
            <UndoIcon className="h-4 w-4" />
          </Button>
          <Button
            plain
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5"
          >
            <RedoIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* AI Button */}
        {onOpenAiChat && (
          <Button
            color="indigo"
            onClick={onOpenAiChat}
            className="text-xs px-3 py-1"
          >
            AI
          </Button>
        )}
      </div>
    </div>
  );
}
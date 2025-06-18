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
  FileTextIcon,
  RulerIcon,
  SeparatorHorizontalIcon,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { classNames } from '@/lib/utils/cn';

interface EditorToolbarProps {
  editor: Editor | null;
  onOpenAiChat?: () => void;
  showPageMargins?: boolean;
  onToggleMargins?: () => void;
}

export default function EditorToolbar({ 
  editor, 
  onOpenAiChat, 
  showPageMargins = true, 
  onToggleMargins 
}: EditorToolbarProps) {
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showPageMenu, setShowPageMenu] = useState(false);
  const highlightMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const pageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (highlightMenuRef.current && !highlightMenuRef.current.contains(event.target as Node)) {
        setShowHighlightMenu(false);
      }
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false);
      }
      if (pageMenuRef.current && !pageMenuRef.current.contains(event.target as Node)) {
        setShowPageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) {
    return null;
  }

  const highlightColors = [
    { name: 'Swift', color: '#DFFC95' },
    { name: 'Neural', color: '#D3C5E8' },
    { name: 'Scrub', color: '#BAE5D6' },
    { name: 'Yellow', color: '#d4c57f' },
    { name: 'Clear', color: 'transparent' },
  ];

  // Image upload handler
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          editor.chain().focus().setImage({ src, alt: file.name }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Page break handler
  const insertPageBreak = () => {
    if (editor) {
      editor.chain().focus().setPageBreak().run();
      setShowPageMenu(false);
    }
  };

  // Catalyst UI button styling
  const toolbarButtonClass = "inline-flex items-center justify-center rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 transition-colors";
  const activeButtonClass = "bg-zinc-200 text-zinc-900";

  return (
    <div className="border-b border-zinc-200 bg-white p-2">
      <div className="flex items-center space-x-1 flex-wrap">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('bold') ? activeButtonClass : ''
            )}
            title="Bold"
          >
            <BoldIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('italic') ? activeButtonClass : ''
            )}
            title="Italic"
          >
            <ItalicIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('underline') ? activeButtonClass : ''
            )}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('strike') ? activeButtonClass : ''
            )}
            title="Strikethrough"
          >
            <StrikethroughIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('code') ? activeButtonClass : ''
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
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive({ textAlign: 'left' }) ? activeButtonClass : ''
            )}
            title="Align Left"
          >
            <AlignLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive({ textAlign: 'center' }) ? activeButtonClass : ''
            )}
            title="Align Center"
          >
            <AlignCenterIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive({ textAlign: 'right' }) ? activeButtonClass : ''
            )}
            title="Align Right"
          >
            <AlignRightIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive({ textAlign: 'justify' }) ? activeButtonClass : ''
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
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('heading', { level: 1 }) ? activeButtonClass : ''
            )}
            title="Heading 1"
          >
            <Heading1Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('heading', { level: 2 }) ? activeButtonClass : ''
            )}
            title="Heading 2"
          >
            <Heading2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('heading', { level: 3 }) ? activeButtonClass : ''
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
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('bulletList') ? activeButtonClass : ''
            )}
            title="Bullet List"
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('orderedList') ? activeButtonClass : ''
            )}
            title="Numbered List"
          >
            <ListOrderedIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={classNames(
              toolbarButtonClass,
              editor.isActive('blockquote') ? activeButtonClass : ''
            )}
            title="Quote"
          >
            <QuoteIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={toolbarButtonClass}
            title="Horizontal Rule"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-300" />

        {/* Media & Document */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleImageUpload}
            className={toolbarButtonClass}
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          
          {/* Page Layout Menu */}
          <div className="relative" ref={pageMenuRef}>
            <button
              onClick={() => setShowPageMenu(!showPageMenu)}
              className={classNames(
                toolbarButtonClass,
                'flex items-center space-x-1'
              )}
              title="Page Layout"
            >
              <FileTextIcon className="h-4 w-4" />
              <ChevronDownIcon className="h-3 w-3" />
            </button>
            {showPageMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <div className="p-2 space-y-1">
                  <button
                    onClick={insertPageBreak}
                    className="flex items-center space-x-2 w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded"
                  >
                    <SeparatorHorizontalIcon className="h-4 w-4" />
                    <span>Insert Page Break</span>
                  </button>
                  {onToggleMargins && (
                    <button
                      onClick={() => {
                        onToggleMargins();
                        setShowPageMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded"
                    >
                      <RulerIcon className="h-4 w-4" />
                      <span>{showPageMargins ? 'Hide Margins' : 'Show Margins'}</span>
                    </button>
                  )}
                  <div className="border-t border-zinc-200 my-1" />
                  <div className="px-3 py-1 text-xs text-zinc-500">
                    Document Size: Letter (8.5" × 11")
                  </div>
                  <div className="px-3 py-1 text-xs text-zinc-500">
                    Margins: 1" all sides
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-6 bg-zinc-300" />

        {/* Highlight */}
        <div className="relative" ref={highlightMenuRef}>
          <button
            onClick={() => setShowHighlightMenu(!showHighlightMenu)}
            className={classNames(
              toolbarButtonClass,
              'flex items-center space-x-1'
            )}
            title="Highlight"
          >
            <HighlighterIcon className="h-4 w-4" />
            <ChevronDownIcon className="h-3 w-3" />
          </button>
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
                    className="flex items-center space-x-2 w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded"
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
            onClick={() => setShowTableMenu(!showTableMenu)}
            className={classNames(
              toolbarButtonClass,
              'flex items-center space-x-1'
            )}
            title="Table"
          >
            <TableIcon className="h-4 w-4" />
            <ChevronDownIcon className="h-3 w-3" />
          </button>
          {showTableMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded"
                >
                  Insert Table
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().addColumnAfter().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded"
                >
                  Add Column
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().addRowAfter().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded"
                >
                  Add Row
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().deleteColumn().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded"
                >
                  Delete Column
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().deleteRow().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded"
                >
                  Delete Row
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().deleteTable().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full px-3 py-1 text-sm text-left hover:bg-zinc-100 rounded text-red-600"
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
            onClick={() => {
              try {
                // Try to use undo if available
                if (editor.commands.undo) {
                  editor.commands.undo();
                } else {
                  console.log('Undo not available - using CollaborationHistory');
                }
              } catch (e) {
                console.log('Undo error:', e);
              }
            }}
            disabled={false}
            className={toolbarButtonClass}
            title="Undo (Ctrl/Cmd+Z)"
          >
            <UndoIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              try {
                // Try to use redo if available
                if (editor.commands.redo) {
                  editor.commands.redo();
                } else {
                  console.log('Redo not available - using CollaborationHistory');
                }
              } catch (e) {
                console.log('Redo error:', e);
              }
            }}
            disabled={false}
            className={toolbarButtonClass}
            title="Redo (Ctrl/Cmd+Shift+Z)"
          >
            <RedoIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-300" />

        {/* Margins Toggle - Quick Access */}
        {onToggleMargins && (
          <button
            onClick={onToggleMargins}
            className={classNames(
              toolbarButtonClass,
              showPageMargins ? activeButtonClass : ''
            )}
            title={showPageMargins ? "Hide Margins" : "Show Margins"}
          >
            <RulerIcon className="h-4 w-4" />
          </button>
        )}

        <div className="w-px h-6 bg-zinc-300" />

        {/* AI Button */}
        {onOpenAiChat && (
          <button
            onClick={onOpenAiChat}
            className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
            title="AI Assistant"
          >
            AI
          </button>
        )}
      </div>
    </div>
  );
}
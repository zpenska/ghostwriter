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
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';
import AiToolbarButton from './AiToolbarButton';

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
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
    { name: 'Yellow', color: '#d4c57f' },
    { name: 'Clear', color: 'transparent' },
  ];

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border-b border-gray-200 bg-white p-2">
      <div className="flex items-center space-x-1 flex-wrap">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('bold') ? 'bg-gray-200' : ''
            )}
            title="Bold"
          >
            <BoldIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('italic') ? 'bg-gray-200' : ''
            )}
            title="Italic"
          >
            <ItalicIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('underline') ? 'bg-gray-200' : ''
            )}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('strike') ? 'bg-gray-200' : ''
            )}
            title="Strikethrough"
          >
            <StrikethroughIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('code') ? 'bg-gray-200' : ''
            )}
            title="Code"
          >
            <Code2Icon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Alignment */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
            )}
            title="Align Left"
          >
            <AlignLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
            )}
            title="Align Center"
          >
            <AlignCenterIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
            )}
            title="Align Right"
          >
            <AlignRightIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''
            )}
            title="Justify"
          >
            <AlignJustifyIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Headings */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
            )}
            title="Heading 1"
          >
            <Heading1Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
            )}
            title="Heading 2"
          >
            <Heading2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
            )}
            title="Heading 3"
          >
            <Heading3Icon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Lists */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('bulletList') ? 'bg-gray-200' : ''
            )}
            title="Bullet List"
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('orderedList') ? 'bg-gray-200' : ''
            )}
            title="Numbered List"
          >
            <ListOrderedIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('blockquote') ? 'bg-gray-200' : ''
            )}
            title="Quote"
          >
            <QuoteIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={buttonStyles.toolbar}
            title="Horizontal Rule"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Media */}
        <div className="flex items-center space-x-1">
          <button
            onClick={addImage}
            className={buttonStyles.toolbar}
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            onClick={setLink}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('link') ? 'bg-gray-200' : ''
            )}
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Highlight */}
        <div className="relative" ref={highlightMenuRef}>
          <button
            onClick={() => setShowHighlightMenu(!showHighlightMenu)}
            className={classNames(
              buttonStyles.toolbar,
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
          <button
            onClick={() => setShowTableMenu(!showTableMenu)}
            className={classNames(
              buttonStyles.toolbar,
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

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              try {
                // Try to use undo if available
                if (editor.can().undo()) {
                  editor.chain().focus().undo().run();
                } else {
                  console.log('Undo not available - using CollaborationHistory');
                }
              } catch (e) {
                console.log('Undo error:', e);
              }
            }}
            disabled={!editor.can().undo()}
            className={classNames(
              buttonStyles.toolbar,
              !editor.can().undo() && 'opacity-50 cursor-not-allowed'
            )}
            title="Undo (Ctrl/Cmd+Z)"
          >
            <UndoIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              try {
                // Try to use redo if available
                if (editor.can().redo()) {
                  editor.chain().focus().redo().run();
                } else {
                  console.log('Redo not available - using CollaborationHistory');
                }
              } catch (e) {
                console.log('Redo error:', e);
              }
            }}
            disabled={!editor.can().redo()}
            className={classNames(
              buttonStyles.toolbar,
              !editor.can().redo() && 'opacity-50 cursor-not-allowed'
            )}
            title="Redo (Ctrl/Cmd+Shift+Z)"
          >
            <RedoIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* AI Button */}
        <div className="flex items-center space-x-1">
          {/* Quick AI Actions */}
          <AiToolbarButton editor={editor} />
        </div>
      </div>
    </div>
  );
}
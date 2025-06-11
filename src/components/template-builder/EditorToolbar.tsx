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
  LinkIcon,
  ImageIcon,
  TableIcon,
  HighlighterIcon,
  PaletteIcon,
  CheckSquareIcon,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';

interface EditorToolbarProps {
  editor: Editor;
}

const textColors = [
  { name: 'Default', color: null },
  { name: 'Deep Forest', color: '#3a4943' },
  { name: 'Muted Lavender', color: '#8a7fae' },
  { name: 'Warm Beige', color: '#a88868' },
  { name: 'Slate Gray', color: '#3d3d3c' },
];

const highlightColors = [
  { name: 'None', color: null },
  { name: 'Swift', color: '#DFFC95' },
  { name: 'Neural', color: '#D3C5E8' },
  { name: 'Scrub', color: '#BAE5D6' },
  { name: 'Muted Yellow', color: '#d4c57f' },
  { name: 'Pale Mint', color: '#b9cab3' },
];

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const triggerAiCompletion = () => {
    editor.chain().focus().insertContent('++').run();
  };

  return (
    <div className="flex items-center space-x-1 flex-wrap">
      {/* Text Formatting */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={classNames(
            buttonStyles.toolbar,
            editor.isActive('bold') && buttonStyles.toolbarActive
          )}
          title="Bold (Cmd+B)"
        >
          <BoldIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={classNames(
            buttonStyles.toolbar,
            editor.isActive('italic') && buttonStyles.toolbarActive
          )}
          title="Italic (Cmd+I)"
        >
          <ItalicIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={classNames(
            buttonStyles.toolbar,
            editor.isActive('underline') && buttonStyles.toolbarActive
          )}
          title="Underline (Cmd+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={classNames(
            buttonStyles.toolbar,
            editor.isActive('strike') && buttonStyles.toolbarActive
          )}
          title="Strikethrough"
        >
          <StrikethroughIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Headings */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={classNames(
            buttonStyles.toolbar,
            editor.isActive('heading', { level: 1 }) && buttonStyles.toolbarActive
          )}
          title="Heading 1"
        >
          <Heading1Icon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={classNames(
            buttonStyles.toolbar,
            editor.isActive('heading', { level: 2 }) && buttonStyles.toolbarActive
          )}
          title="Heading 2"
        >
          <Heading2Icon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={classNames(
            buttonStyles.toolbar,
            editor.isActive('heading', { level: 3 }) && buttonStyles.toolbarActive
          )}
          title="Heading 3"
        >
          <Heading3Icon className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Lists */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={classNames(
            buttonStyles.toolbar,
            editor.isActive('bulletList') && buttonStyles.toolbarActive
          )}
          title="Bullet List"
        >
          <ListIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={classNames(
            buttonStyles.toolbar,
            editor.isActive('orderedList') && buttonStyles.toolbarActive
          )}
          title="Numbered List"
        >
          <ListOrderedIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={classNames(
            buttonStyles.toolbar,
            editor.isActive('taskList') && buttonStyles.toolbarActive
          )}
          title="Task List"
        >
          <CheckSquareIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Colors */}
      <div className="flex items-center space-x-1">
        <Menu as="div" className="relative">
          <Menu.Button className={buttonStyles.toolbar}>
            <PaletteIcon className="w-4 h-4" />
            <ChevronDownIcon className="w-3 h-3 ml-1" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {textColors.map((color) => (
                  <Menu.Item key={color.name}>
                    {({ active }) => (
                      <button
                        onClick={() =>
                          color.color
                            ? editor.chain().focus().setColor(color.color).run()
                            : editor.chain().focus().unsetColor().run()
                        }
                        className={classNames(
                          'flex items-center px-4 py-2 text-sm w-full transition-colors',
                          active ? 'bg-gray-100' : ''
                        )}
                      >
                        <span
                          className="w-4 h-4 rounded mr-2 border border-gray-300"
                          style={{ backgroundColor: color.color || 'white' }}
                        />
                        {color.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        <Menu as="div" className="relative">
          <Menu.Button className={buttonStyles.toolbar}>
            <HighlighterIcon className="w-4 h-4" />
            <ChevronDownIcon className="w-3 h-3 ml-1" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {highlightColors.map((highlight) => (
                  <Menu.Item key={highlight.name}>
                    {({ active }) => (
                      <button
                        onClick={() =>
                          highlight.color
                            ? editor.chain().focus().toggleHighlight({ color: highlight.color }).run()
                            : editor.chain().focus().unsetHighlight().run()
                        }
                        className={classNames(
                          'flex items-center px-4 py-2 text-sm w-full transition-colors',
                          active ? 'bg-gray-100' : ''
                        )}
                      >
                        <span
                          className="w-4 h-4 rounded mr-2 border border-gray-300"
                          style={{ backgroundColor: highlight.color || 'white' }}
                        />
                        {highlight.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Insert */}
      <div className="flex items-center space-x-1">
        {showLinkInput ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addLink();
                } else if (e.key === 'Escape') {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }
              }}
              placeholder="Enter URL"
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8a7fae] focus:border-transparent"
              autoFocus
            />
            <button
              onClick={addLink}
              className={buttonStyles.primary}
              style={{ padding: '0.25rem 0.5rem' }}
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLinkInput(true)}
            className={classNames(
              buttonStyles.toolbar,
              editor.isActive('link') && buttonStyles.toolbarActive
            )}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={addImage}
          className={buttonStyles.toolbar}
          title="Add Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={insertTable}
          className={buttonStyles.toolbar}
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Undo/Redo */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={classNames(
            buttonStyles.toolbar,
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title="Undo (Cmd+Z)"
        >
          <UndoIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={classNames(
            buttonStyles.toolbar,
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title="Redo (Cmd+Shift+Z)"
        >
          <RedoIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* AI Button */}
      <button
        onClick={triggerAiCompletion}
        className={classNames(
          buttonStyles.toolbar,
          'text-[#8a7fae] hover:text-[#8a7fae]/90 hover:bg-[#8a7fae]/10'
        )}
        title="AI Suggestion (or type ++)"
      >
        <span className="text-sm font-medium">AI</span>
      </button>
    </div>
  );
}
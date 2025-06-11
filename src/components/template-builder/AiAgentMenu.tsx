'use client';

import { Editor } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { 
  List, 
  Table, 
  Hash,
  Calendar,
  Type,
  Heading1,
  Heading2,
  Code,
  Quote,
  X
} from 'lucide-react';

interface AiAgentMenuProps {
  editor: Editor;
  onClose: () => void;
  aiAgentProvider?: any;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description: string;
  action: () => void;
}

export default function AiAgentMenu({ editor, onClose, aiAgentProvider }: AiAgentMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Basic editor commands only - no AI generation
  const menuItems: MenuItem[] = [
    {
      icon: Heading1,
      label: 'Heading 1',
      description: 'Large section heading',
      action: () => {
        editor.chain().toggleHeading({ level: 1 }).focus().run();
        onClose();
      }
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      description: 'Medium section heading',
      action: () => {
        editor.chain().toggleHeading({ level: 2 }).focus().run();
        onClose();
      }
    },
    {
      icon: Type,
      label: 'Paragraph',
      description: 'Normal text paragraph',
      action: () => {
        editor.chain().setParagraph().focus().run();
        onClose();
      }
    },
    {
      icon: List,
      label: 'Bullet List',
      description: 'Insert a bullet list',
      action: () => {
        editor.chain().toggleBulletList().focus().run();
        onClose();
      }
    },
    {
      icon: Hash,
      label: 'Numbered List',
      description: 'Insert a numbered list',
      action: () => {
        editor.chain().toggleOrderedList().focus().run();
        onClose();
      }
    },
    {
      icon: Quote,
      label: 'Blockquote',
      description: 'Insert a quote block',
      action: () => {
        editor.chain().toggleBlockquote().focus().run();
        onClose();
      }
    },
    {
      icon: Code,
      label: 'Code Block',
      description: 'Insert a code block',
      action: () => {
        editor.chain().toggleCodeBlock().focus().run();
        onClose();
      }
    },
    {
      icon: Table,
      label: 'Table',
      description: 'Insert a table',
      action: () => {
        editor.chain().insertTable({ rows: 3, cols: 3 }).focus().run();
        onClose();
      }
    },
    {
      icon: Calendar,
      label: 'Current Date',
      description: 'Insert today\'s date',
      action: () => {
        const date = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        editor.chain().insertContent(date).focus().run();
        onClose();
      }
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        menuItems[selectedIndex].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, menuItems, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // If aiAgentProvider is available, you could add a message or different behavior
  useEffect(() => {
    if (aiAgentProvider) {
      console.log('AI Agent Provider is available for future enhancements');
    }
  }, [aiAgentProvider]);

  return (
    <div ref={menuRef} className="ai-agent-menu bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[300px] max-h-[400px] overflow-y-auto">
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <span className="text-xs font-medium text-gray-500 uppercase">Insert</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-3 w-3" />
        </button>
      </div>
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={item.action}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full text-left px-3 py-2 rounded-md flex items-start gap-3 transition-colors ${
              selectedIndex === index 
                ? 'bg-blue-50 text-blue-900' 
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-sm">{item.label}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </button>
        );
      })}
      
      {/* Show a hint about AI features being in the chat */}
      {aiAgentProvider && (
        <div className="mt-2 pt-2 border-t border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-500">
            💡 Use the AI Assistant chat for letter generation
          </p>
        </div>
      )}
    </div>
  );
}
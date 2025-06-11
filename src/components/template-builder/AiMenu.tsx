'use client';

import { Editor } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { buttonStyles } from '@/lib/utils/button-styles';
import AiAgentChat from './AiAgentChat';

interface AiMenuProps {
  editor: Editor;
  onClose?: () => void;
}

export default function AiMenu({ editor, onClose }: AiMenuProps) {
  const [showChat, setShowChat] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleInsertText = (text: string) => {
    editor.chain().focus().insertContent(text).run();
  };

  const { from, to } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={menuRef} className="w-[600px] h-[500px] bg-white rounded-lg shadow-xl">
        <AiAgentChat
          onInsertText={handleInsertText}
          onClose={onClose}
          selectedText={selectedText}
        />
      </div>
    </div>
  );
}
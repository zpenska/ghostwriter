'use client';

import { Editor } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';

interface AiMenuProps {
  editor: Editor;
}

const aiActions = [
  { label: 'Improve writing', action: 'improve' },
  { label: 'Fix spelling & grammar', action: 'fixGrammar' },
  { label: 'Make shorter', action: 'shorter' },
  { label: 'Make longer', action: 'longer' },
  { label: 'Simplify', action: 'simplify' },
];

const toneOptions = [
  { label: 'Professional', action: 'professional' },
  { label: 'Friendly', action: 'friendly' },
  { label: 'Formal', action: 'formal' },
  { label: 'Casual', action: 'casual' },
];

export default function AiMenu({ editor }: AiMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showToneMenu, setShowToneMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowToneMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAiAction = async (action: string) => {
    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to, ' ');

    if (!selectedText && action !== 'custom') {
      alert('Please select some text first');
      return;
    }

    // Here you would integrate with your AI service
    // For now, we'll insert placeholder text
    let result = selectedText;
    
    switch (action) {
      case 'improve':
        result = `[AI: Improved version of "${selectedText}"]`;
        break;
      case 'fixGrammar':
        result = `[AI: Grammar-corrected version of "${selectedText}"]`;
        break;
      case 'shorter':
        result = `[AI: Shorter version of "${selectedText}"]`;
        break;
      case 'longer':
        result = `[AI: Expanded version of "${selectedText}"]`;
        break;
      case 'simplify':
        result = `[AI: Simplified version of "${selectedText}"]`;
        break;
      case 'professional':
      case 'friendly':
      case 'formal':
      case 'casual':
        result = `[AI: ${action} tone version of "${selectedText}"]`;
        break;
      case 'custom':
        const prompt = window.prompt('Enter your custom AI prompt:');
        if (prompt) {
          result = `[AI response to: "${prompt}"]`;
        }
        break;
    }

    if (result !== selectedText) {
      editor.chain().focus().deleteRange({ from: selection.from, to: selection.to }).insertContent(result).run();
    }

    setIsOpen(false);
    setShowToneMenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonStyles.text}
        title="AI Assistant"
      >
        <span className="text-sm font-medium">AI</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu">
            {aiActions.map((item) => (
              <button
                key={item.action}
                onClick={() => handleAiAction(item.action)}
                className={classNames(
                  buttonStyles.text,
                  'w-full text-left justify-start px-4 py-2 text-sm hover:bg-gray-50'
                )}
                role="menuitem"
              >
                {item.label}
              </button>
            ))}
            
            <div className="border-t border-gray-100 my-1" />
            
            <div className="relative">
              <button
                onMouseEnter={() => setShowToneMenu(true)}
                onMouseLeave={() => setShowToneMenu(false)}
                className={classNames(
                  buttonStyles.text,
                  'w-full text-left justify-between px-4 py-2 text-sm hover:bg-gray-50'
                )}
                role="menuitem"
              >
                Change tone
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              
              {showToneMenu && (
                <div className="absolute left-full top-0 ml-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu">
                    {toneOptions.map((option) => (
                      <button
                        key={option.action}
                        onClick={() => handleAiAction(option.action)}
                        className={classNames(
                          buttonStyles.text,
                          'w-full text-left justify-start px-4 py-2 text-sm hover:bg-gray-50'
                        )}
                        role="menuitem"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-100 my-1" />
            
            <button
              onClick={() => handleAiAction('custom')}
              className={classNames(
                buttonStyles.text,
                'w-full text-left justify-start px-4 py-2 text-sm hover:bg-gray-50'
              )}
              role="menuitem"
            >
              Custom prompt...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
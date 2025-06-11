'use client';

import { Editor } from '@tiptap/react';
import { SparklesIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ChevronRightIcon } from 'lucide-react';

interface AiMenuProps {
  editor: Editor;
}

const aiActions = [
  { label: 'Improve writing', action: 'improve' },
  { label: 'Make longer', action: 'expand' },
  { label: 'Make shorter', action: 'shorten' },
  { label: 'Fix grammar', action: 'fix' },
  { label: 'Change tone', subActions: [
    { label: 'Professional', action: 'tone-professional' },
    { label: 'Friendly', action: 'tone-friendly' },
    { label: 'Formal', action: 'tone-formal' },
    { label: 'Casual', action: 'tone-casual' },
  ]},
  { label: 'Simplify', action: 'simplify' },
  { label: 'Continue writing', action: 'continue' },
  { label: 'Generate from prompt', action: 'custom' },
];

export default function AiMenu({ editor }: AiMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomPrompt(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAiAction = async (action: string) => {
    const { selection } = editor.state;
    const { from, to } = selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    if (!selectedText && action !== 'custom' && action !== 'continue') {
      alert('Please select some text first');
      return;
    }

    try {
      // Use Tiptap AI commands
      switch (action) {
        case 'improve':
          editor.chain().focus().aiImprove().run();
          break;
        case 'expand':
          editor.chain().focus().aiExpand().run();
          break;
        case 'shorten':
          editor.chain().focus().aiShorten().run();
          break;
        case 'fix':
          editor.chain().focus().aiFix().run();
          break;
        case 'simplify':
          editor.chain().focus().aiSimplify().run();
          break;
        case 'continue':
          editor.chain().focus().aiContinue().run();
          break;
        case 'tone-professional':
          editor.chain().focus().aiTone({ tone: 'professional' }).run();
          break;
        case 'tone-friendly':
          editor.chain().focus().aiTone({ tone: 'friendly' }).run();
          break;
        case 'tone-formal':
          editor.chain().focus().aiTone({ tone: 'formal' }).run();
          break;
        case 'tone-casual':
          editor.chain().focus().aiTone({ tone: 'casual' }).run();
          break;
        default:
          if (action.startsWith('custom:')) {
            const prompt = action.substring(7);
            editor.chain().focus().aiGenerate({ prompt }).run();
          }
      }
    } catch (error) {
      console.error('AI error:', error);
      alert('AI processing failed. Please try again.');
    }
    
    setIsOpen(false);
    setShowCustomPrompt(false);
  };

  const handleCustomPrompt = () => {
    if (customPrompt.trim()) {
      handleAiAction(`custom: ${customPrompt}`);
      setCustomPrompt('');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded hover:bg-accent-lavender/10 text-accent-lavender flex items-center space-x-1"
        title="AI Assistant"
      >
        <SparklesIcon className="w-4 h-4" />
        <span className="text-sm">AI</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            {!showCustomPrompt ? (
              <>
                {aiActions.map((item) => (
                  <div key={item.label}>
                    {item.subActions ? (
                      <div className="relative group">
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-between">
                          {item.label}
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                        <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block">
                          {item.subActions.map((subItem) => (
                            <button
                              key={subItem.action}
                              onClick={() => handleAiAction(subItem.action)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                            >
                              {subItem.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (item.action === 'custom') {
                            setShowCustomPrompt(true);
                          } else {
                            handleAiAction(item.action);
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        {item.label}
                      </button>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="p-2">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your prompt..."
                  className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleCustomPrompt}
                    className="flex-1 px-3 py-1 bg-accent-lavender text-white rounded text-sm hover:bg-accent-lavender/90"
                  >
                    Generate
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomPrompt(false);
                      setCustomPrompt('');
                    }}
                    className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
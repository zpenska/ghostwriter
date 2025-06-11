'use client';

import { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { healthcarePrompts } from '@/lib/tiptap/ai-config';
import { classNames } from '@/lib/utils/cn';
import { 
  FileTextIcon, 
  UsersIcon, 
  HeartIcon, 
  ShieldCheckIcon, 
  ClipboardCheckIcon,
  XCircleIcon,
  MessageSquareIcon,
  CheckCircleIcon,
  FileIcon,
  PlusIcon,
  EditIcon,
  ActivityIcon,
  HashIcon,
  SyringeIcon,
  SparklesIcon
} from 'lucide-react';

interface AiAgentMenuProps {
  editor: Editor;
  onClose?: () => void;
}

export default function AiAgentMenu({ editor, onClose }: AiAgentMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customPromptRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustomPrompt && customPromptRef.current) {
      customPromptRef.current.focus();
    } else if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showCustomPrompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCustomPrompt) {
          setShowCustomPrompt(false);
          setCustomPrompt('');
        } else {
          onClose?.();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, showCustomPrompt]);

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      FileTextIcon,
      UsersIcon,
      HeartIcon,
      ShieldCheckIcon,
      ClipboardCheckIcon,
      XCircleIcon,
      MessageSquareIcon,
      CheckCircleIcon,
      FileIcon,
      PlusIcon,
      EditIcon,
      ActivityIcon,
      HashIcon,
      SyringeIcon,
      SparklesIcon
    };
    
    const Icon = iconMap[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const filteredPrompts = healthcarePrompts.filter(
    prompt =>
      prompt.label.toLowerCase().includes(search.toLowerCase()) ||
      prompt.description.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(filteredPrompts.map(p => p.category)));

  const promptsByCategory = selectedCategory
    ? filteredPrompts.filter(p => p.category === selectedCategory)
    : filteredPrompts;

  const handlePromptSelect = (prompt: typeof healthcarePrompts[0]) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    // Get the full prompt with selected text
    const fullPrompt = prompt.prompt.replace('{selectedText}', selectedText || 'the following text');
    
    // Try to trigger AI through the AI extension
    try {
      // Check if there's an AI command available
      if ((editor.commands as any).insertAI) {
        (editor.commands as any).insertAI(fullPrompt);
      } else if ((editor.commands as any).ai) {
        // Try generic ai command
        (editor.commands as any).ai(fullPrompt);
      } else {
        // Fallback: Insert the prompt as content for now
        // This will help you see what prompt would be sent
        editor.chain()
          .focus()
          .insertContent(`\n[AI Prompt: ${fullPrompt}]\n`)
          .run();
          
        console.log('AI command not found. Available commands:', Object.keys(editor.commands));
      }
    } catch (error) {
      console.error('Error executing AI command:', error);
      // Fallback
      editor.chain()
        .focus()
        .insertContent(`\n[AI Error: ${fullPrompt}]\n`)
        .run();
    }
    
    onClose?.();
  };

  const handleCustomPrompt = () => {
    if (customPrompt.trim()) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      
      const fullPrompt = selectedText 
        ? `${customPrompt} the following text: ${selectedText}`
        : customPrompt;
      
      try {
        if ((editor.commands as any).insertAI) {
          (editor.commands as any).insertAI(fullPrompt);
        } else if ((editor.commands as any).ai) {
          (editor.commands as any).ai(fullPrompt);
        } else {
          editor.chain()
            .focus()
            .insertContent(`\n[Custom AI: ${fullPrompt}]\n`)
            .run();
        }
      } catch (error) {
        console.error('Error with custom prompt:', error);
      }
      
      onClose?.();
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 mt-2 w-96 rounded-lg bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden"
    >
      {showCustomPrompt ? (
        // Custom prompt input
        <div className="p-4">
          <div className="mb-3">
            <button
              onClick={() => {
                setShowCustomPrompt(false);
                setCustomPrompt('');
              }}
              className="text-sm text-[#8a7fae] hover:underline"
            >
              ← Back to commands
            </button>
          </div>
          <div className="space-y-3">
            <input
              ref={customPromptRef}
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customPrompt.trim()) {
                  handleCustomPrompt();
                }
              }}
              placeholder="Enter your custom instruction..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8a7fae] focus:border-transparent"
            />
            <button
              onClick={handleCustomPrompt}
              disabled={!customPrompt.trim()}
              className={classNames(
                'w-full px-4 py-2 text-sm font-medium rounded-md transition-colors',
                customPrompt.trim()
                  ? 'bg-[#8a7fae] text-white hover:bg-[#7a6f9e]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              Apply Custom Instruction
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search AI actions..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8a7fae] focus:border-transparent"
            />
          </div>

          {/* Categories */}
          {!selectedCategory && categories.length > 1 && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className="px-3 py-1 text-xs font-medium text-[#44474F] bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Prompt Option */}
          <div className="p-2 border-b border-gray-100">
            <button
              onClick={() => setShowCustomPrompt(true)}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-[#8a7fae]">
                  <SparklesIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[#2E4A3F]">
                    Custom instruction
                  </p>
                  <p className="text-xs text-[#44474F]">
                    Enter your own AI instruction
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Prompts List */}
          <div className="max-h-64 overflow-y-auto">
            {selectedCategory && (
              <div className="px-3 py-2 border-b border-gray-100">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm text-[#8a7fae] hover:underline"
                >
                  ← Back to all
                </button>
              </div>
            )}
            
            {promptsByCategory.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No AI actions found
              </div>
            ) : (
              <div className="p-2">
                {promptsByCategory.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => handlePromptSelect(prompt)}
                    className={classNames(
                      'w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors',
                      'group'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="mt-0.5 text-[#8a7fae]">{getIcon(prompt.icon)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2E4A3F]">
                          {prompt.label}
                        </p>
                        <p className="text-xs text-[#44474F] mt-0.5">
                          {prompt.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
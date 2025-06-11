'use client';

import { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { healthcarePrompts } from '@/lib/tiptap/ai-config';
import { classNames } from '@/lib/utils/cn';

interface AiAgentMenuProps {
  editor: Editor;
  onClose?: () => void;
}

export default function AiAgentMenu({ editor, onClose }: AiAgentMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

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
    
    const fullPrompt = prompt.prompt.replace('{selectedText}', selectedText || '');
    
    // Insert AI response placeholder
    editor.chain()
      .focus()
      .insertContent(`<p class="ai-response">AI: ${fullPrompt}</p>`)
      .run();
    
    onClose?.();
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 mt-2 w-96 rounded-lg bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden"
    >
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

      {/* Prompts List */}
      <div className="max-h-96 overflow-y-auto">
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
                  <span className="mt-0.5 text-[#8a7fae]">{prompt.icon}</span>
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
    </div>
  );
}
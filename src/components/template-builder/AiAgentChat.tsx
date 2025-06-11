'use client';

import { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { healthcarePrompts } from '@/lib/tiptap/ai-config';
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';

export interface AiAgentChatProps {
  onInsertText?: (text: string) => void;
  onClose?: () => void;
  selectedText?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAgentChat({ onInsertText, onClose, selectedText }: AiAgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual AI integration)
      setTimeout(() => {
        const response = `I understand you'd like help with: "${userMessage}". ${
          selectedText ? `Based on the selected text: "${selectedText.substring(0, 50)}..."` : ''
        } Here's a professional response for your clinical letter...`;
        
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickActions = [
    { label: 'Professional tone', action: 'Rewrite this text in a professional clinical tone' },
    { label: 'Simplify language', action: 'Simplify this text for patient understanding' },
    { label: 'Add empathy', action: 'Add empathetic language while maintaining professionalism' },
    { label: 'HIPAA compliance', action: 'Review for HIPAA compliance and suggest improvements' },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-[#2E4A3F]">AI Assistant</h3>
        {onClose && (
          <button
            onClick={onClose}
            className={buttonStyles.icon}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.action)}
              disabled={isLoading}
              className={classNames(
                buttonStyles.text,
                'text-xs px-2 py-1'
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[#44474F] py-8">
            <p className="text-sm">Ask me to help improve your clinical letter.</p>
            {selectedText && (
              <p className="text-xs mt-2 text-gray-500">
                Selected text: "{selectedText.substring(0, 100)}..."
              </p>
            )}
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={classNames(
              'px-4 py-2 rounded-lg max-w-[80%]',
              message.role === 'user'
                ? 'ml-auto bg-[#8a7fae] text-white'
                : 'mr-auto bg-gray-100 text-[#44474F]'
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-[#44474F]">
            <div className="w-2 h-2 bg-[#8a7fae] rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-[#8a7fae] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-[#8a7fae] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8a7fae] focus:border-transparent resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={buttonStyles.purple}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  SparklesIcon, 
  PaperAirplaneIcon,
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { healthcarePrompts } from '@/lib/tiptap/ai-config';
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';

interface AiAgentChatProps {
  provider: any;
  editor: any;
  onClose?: () => void;
}

export default function AiAgentChat({ provider, editor, onClose }: AiAgentChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!provider) return;

    // Subscribe to state changes
    const handleStateChange = (newState) => {
      setMessages(newState.messages || []);
      setIsLoading(newState.isLoading || false);
    };

    provider.on('stateChange', handleStateChange);

    // Focus input on mount
    inputRef.current?.focus();

    return () => {
      provider.off('stateChange', handleStateChange);
    };
  }, [provider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !provider || isLoading) return;

    // Add user message and run AI
    provider.addUserMessage(input);
    provider.run();
    setInput('');
  };

  const handleQuickAction = (action: string) => {
    if (!provider || isLoading) return;
    provider.addUserMessage(action);
    provider.run();
  };

  const quickActions = [
    {
      icon: CheckCircleIcon,
      label: 'Fix Grammar',
      action: 'Correct all spelling and grammar mistakes in the document.',
      color: 'text-green-600',
    },
    {
      icon: DocumentTextIcon,
      label: 'Make Professional',
      action: 'Make the text more professional and formal.',
      color: 'text-blue-600',
    },
    {
      icon: PencilSquareIcon,
      label: 'Improve Writing',
      action: 'Improve the writing style, clarity, and flow.',
      color: 'text-purple-600',
    },
    {
      icon: MagnifyingGlassIcon,
      label: 'Summarize',
      action: 'Create a concise summary of the main points.',
      color: 'text-orange-600',
    },
  ];

  const healthcareActions = [
    {
      icon: DocumentTextIcon,
      label: 'Prior Auth Letter',
      action: healthcarePrompts.priorAuth.prompt,
      color: 'text-indigo-600',
    },
    {
      icon: ChatBubbleLeftRightIcon,
      label: 'Appeal Letter',
      action: healthcarePrompts.appealLetter.prompt,
      color: 'text-red-600',
    },
    {
      icon: ChartBarIcon,
      label: 'Clinical Notes',
      action: healthcarePrompts.clinicalNotes.prompt,
      color: 'text-teal-600',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-[#F5F5F1]">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-900">AI Agent Assistant</h3>
        </div>
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
      <div className="p-4 border-b bg-gray-50">
        <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.action)}
                disabled={isLoading}
                className={classNames(
                  buttonStyles.secondary,
                  'flex-1 justify-start'
                )}
              >
                <Icon className={`w-4 h-4 mr-2 ${action.color}`} />
                <span className="text-sm">{action.label}</span>
              </button>
            );
          })}
        </div>
        
        <p className="text-sm font-medium text-gray-700 mb-2">Healthcare Templates</p>
        <div className="flex flex-wrap gap-2">
          {healthcareActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.action)}
                disabled={isLoading}
                className={classNames(
                  buttonStyles.ghost,
                  'text-xs px-2 py-1'
                )}
              >
                <Icon className={`w-3 h-3 mr-1 ${action.color}`} />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">Start a conversation with the AI Agent</p>
            <p className="text-xs mt-2">Try asking it to help with your document</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                {message.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-[#8a7fae] flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#3a4943] flex items-center justify-center">
                    <span className="text-white text-sm font-medium">AI</span>
                  </div>
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-[#8a7fae] text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === 'assistant' && message.timestamp && (
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-xs">
              <div className="w-8 h-8 rounded-full bg-[#3a4943] flex items-center justify-center mr-2">
                <span className="text-white text-sm font-medium animate-pulse">AI</span>
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to help with your document..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={buttonStyles.primary}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tip: Type "/" in the editor for quick AI commands
        </p>
      </form>
    </div>
  );
}
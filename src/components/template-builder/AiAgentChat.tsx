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
  aiAgentProvider?: any; // The AI Agent provider instance
  availableVariables?: any[]; // Available variables from the variable panel
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AiAgentChat({ 
  onInsertText, 
  onClose, 
  selectedText, 
  aiAgentProvider,
  availableVariables = []
}: AiAgentChatProps) {
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

  // Subscribe to AI Agent state changes
  useEffect(() => {
    if (!aiAgentProvider) return;

    const handleStateChange = (newState: any) => {
      console.log('AI Agent state:', newState);
      
      // Update messages from AI Agent state
      if (newState.messages && newState.messages.length > 0) {
        const formattedMessages: ChatMessage[] = newState.messages.map((msg: any) => ({
          role: msg.type === 'user' ? 'user' : msg.type === 'ai' ? 'assistant' : 'system',
          content: msg.text || msg.content || ''
        }));
        setMessages(formattedMessages);
      }

      // Update loading state
      setIsLoading(newState.status === 'loading' || newState.status === 'running');
    };

    const handleError = (error: any) => {
      console.error('AI Agent error:', error);
      setIsLoading(false);
      // Add error message
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${error.message || 'Something went wrong. Please try again.'}`
      }]);
    };

    aiAgentProvider.on('stateChange', handleStateChange);
    aiAgentProvider.on('loadingError', handleError);

    // Get initial state
    if (aiAgentProvider.state && aiAgentProvider.state.messages) {
      handleStateChange(aiAgentProvider.state);
    }

    return () => {
      aiAgentProvider.off('stateChange', handleStateChange);
      aiAgentProvider.off('loadingError', handleError);
    };
  }, [aiAgentProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !aiAgentProvider) return;

    const userMessage = input.trim();
    setInput('');

    try {
      // Include variable context in the message if generating a letter
      let enhancedMessage = userMessage;
      if (userMessage.toLowerCase().includes('letter') || 
          userMessage.toLowerCase().includes('template') ||
          userMessage.toLowerCase().includes('draft')) {
        enhancedMessage += '\n\nPlease use the appropriate variables (like {{MemberName}}, {{ProviderName}}, etc.) in the generated content.';
      }

      // Add the user message to the AI Agent
      aiAgentProvider.addUserMessage(enhancedMessage);
      
      // Run the AI Agent
      await aiAgentProvider.run();
    } catch (error) {
      console.error('Error sending message to AI Agent:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Failed to send message. Please try again.'
      }]);
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (!aiAgentProvider) return;
    
    const fullPrompt = selectedText 
      ? prompt.replace('{selectedText}', selectedText)
      : prompt;
      
    setInput(fullPrompt);
    // Auto-submit for quick actions
    setTimeout(() => {
      const form = textareaRef.current?.form;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  // Enhanced template actions that mention using variables
  const templateActions = [
    {
      label: 'Prior Authorization',
      prompt: 'Generate a prior authorization approval letter using the appropriate variables for member name, provider, service date, and service code'
    },
    {
      label: 'Appeal Letter',
      prompt: 'Draft a professional appeal letter for the member regarding their service. Include all relevant variables like member name, service date, and provider name.'
    },
    {
      label: 'Denial Explanation',
      prompt: 'Create a clear and compliant denial explanation letter addressed to the member regarding their service'
    },
    {
      label: 'Benefit Summary',
      prompt: 'Write a patient-friendly benefit summary explanation for the member that includes their member ID'
    }
  ];

  if (!aiAgentProvider) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">AI Agent not available</p>
        </div>
      </div>
    );
  }

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
        <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
        <div className="flex flex-wrap gap-2">
          {healthcarePrompts.slice(0, 4).map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => handleQuickAction(prompt.prompt)}
              disabled={isLoading}
              className={classNames(
                buttonStyles.text,
                'text-xs px-2 py-1'
              )}
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Actions */}
      <div className="px-4 py-2 border-b border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Letter templates:</p>
        <div className="grid grid-cols-2 gap-2">
          {templateActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isLoading}
              className={classNames(
                'text-xs px-3 py-2 bg-[#8a7fae] text-white rounded hover:bg-[#7a6f9e] transition-colors disabled:opacity-50'
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Available Variables Info */}
      {availableVariables.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-xs text-gray-600">
            Available variables: 
            {availableVariables.flatMap(group => 
              group.variables.map((v: any) => ` {{${v.name}}}`)
            ).join(',')}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[#44474F] py-8">
            <p className="text-sm mb-4">I can help you create clinical letters with proper variables.</p>
            <ul className="text-xs text-left max-w-xs mx-auto space-y-1">
              <li>• Generate complete letter templates</li>
              <li>• Use variables like MemberName, ProviderName</li>
              <li>• Create prior authorizations & appeals</li>
              <li>• Ensure HIPAA compliance</li>
              <li>• Improve tone and clarity</li>
            </ul>
            {selectedText && (
              <p className="text-xs mt-4 text-gray-500">
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
                : message.role === 'assistant'
                ? 'mr-auto bg-gray-100 text-[#44474F]'
                : 'mx-auto bg-yellow-50 text-yellow-800 text-sm'
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask me to create a letter with variables..."
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
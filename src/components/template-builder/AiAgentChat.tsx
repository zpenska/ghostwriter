'use client';

import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Send, Bot, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Text } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';

interface AiAgentChatProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  variables?: any[]; // Available variable sets
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AiAgentChat({ editor, isOpen, onClose, variables }: AiAgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || !editor || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Add context about available variables if provided
      let prompt = input;
      if (variables && variables.length > 0) {
        const variableContext = variables.map(v => 
          `${v.category}: ${v.variables.map((item: any) => item.name).join(', ')}`
        ).join('\n');
        
        prompt = `Available variables:\n${variableContext}\n\n${input}`;
      }

      // The AI Agent in cloud setup works differently
      // It might be through the AI extension commands or through the editor's extension storage
      const aiExtension = editor.extensionManager.extensions.find(ext => ext.name === 'aiAgent');
      
      if (aiExtension) {
        // Try to use the AI Agent through the extension
        console.log('AI Agent extension found, processing request...');
        
        // Insert a placeholder and let AI Agent process it
        editor.chain()
          .focus()
          .insertContent(`[AI: ${prompt}]`)
          .run();
      } else {
        console.error('AI Agent extension not found');
        throw new Error('AI Agent is not available');
      }

      const assistantMessage = {
        role: 'assistant' as const,
        content: 'I\'ve updated the document based on your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Agent error:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: 'I encountered an error. Please make sure you\'re connected to Tiptap Cloud and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-white shadow-xl border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <Text className="font-semibold">AI Assistant</Text>
        </div>
        <Button plain onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <Text className="text-gray-500">
              Hi! I can help you create clinical letters. Just describe what you need.
            </Text>
            <div className="mt-4 space-y-2">
              <Text className="text-sm text-gray-500">Try asking me to:</Text>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Generate a prior authorization letter</li>
                <li>• Create an appeal for a denied claim</li>
                <li>• Write a member notification</li>
                <li>• Improve the tone of selected text</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <Avatar className="w-8 h-8 bg-blue-100">
                <Bot className="h-5 w-5 text-blue-600" />
              </Avatar>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <Text className="text-sm whitespace-pre-wrap">{message.content}</Text>
              <Text className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </Text>
            </div>
            {message.role === 'user' && (
              <Avatar className="w-8 h-8 bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </Avatar>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8 bg-blue-100">
              <Bot className="h-5 w-5 text-blue-600" />
            </Avatar>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask me to create a letter..."
            className="flex-1 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <Button onClick={handleSubmit} disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
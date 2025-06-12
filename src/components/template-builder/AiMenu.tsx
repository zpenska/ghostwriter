'use client';

import { Editor } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { 
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  UsersIcon,
  HeartIcon,
  ShieldCheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilIcon,
  BeakerIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';
import { healthcarePrompts } from '@/lib/tiptap/ai-config';

interface AiMenuProps {
  editor: Editor;
  onClose?: () => void;
}

const iconMap: { [key: string]: any } = {
  FileTextIcon: DocumentTextIcon,
  UsersIcon,
  HeartIcon,
  ShieldCheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  FileIcon: DocumentTextIcon,
  MessageSquareIcon: DocumentTextIcon,
  PlusIcon,
  EditIcon: PencilIcon,
  ActivityIcon: BeakerIcon,
  HashIcon: HashtagIcon,
  SyringeIcon: BeakerIcon,
};

export default function AiMenu({ editor, onClose }: AiMenuProps) {
  const [showChat, setShowChat] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
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

  const categories = ['All', ...new Set(healthcarePrompts.map(p => p.category))];

  const filteredPrompts = selectedCategory === 'All' 
    ? healthcarePrompts 
    : healthcarePrompts.filter(p => p.category === selectedCategory);

  const callTiptapAI = async (prompt: string) => {
    const response = await fetch('https://api.tiptap.dev/v1/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TIPTAP_AI_SECRET}`,
      },
      body: JSON.stringify({
        appId: process.env.NEXT_PUBLIC_TIPTAP_AI_APP_ID,
        text: selectedText,
        instruction: prompt.replace('{selectedText}', selectedText),
      }),
    });

    if (!response.ok) {
      throw new Error('AI request failed');
    }

    const result = await response.json();
    return result.text || selectedText;
  };

  const handlePromptAction = async (prompt: any) => {
    if (!selectedText && !showChat) {
      alert('Please select some text first');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await callTiptapAI(prompt.prompt);
      editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
      onClose?.();
    } catch (error) {
      console.error('AI action failed:', error);
      alert('Failed to process request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatHistory([...chatHistory, userMessage]);
    setChatInput('');
    setIsProcessing(true);

    try {
      const result = await callTiptapAI(chatInput);
      const aiMessage = { role: 'assistant', content: result };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={menuRef} className="w-[800px] max-h-[600px] bg-white rounded-lg shadow-xl">
        {showChat ? (
          <div className="flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-6 w-6 text-[#8a7fae]" />
                <h2 className="text-lg font-semibold text-gray-900">AI Chat</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowChat(false)}
                  className={buttonStyles.text}
                >
                  Back
                </button>
                <button
                  onClick={onClose}
                  className={buttonStyles.icon}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {chatHistory.length === 0 && (
                <div className="text-center text-gray-500">
                  Start a conversation with the AI assistant
                </div>
              )}
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={classNames(
                    'mb-4 p-3 rounded-lg',
                    message.role === 'user' 
                      ? 'bg-purple-50 ml-auto max-w-[80%]' 
                      : 'bg-gray-50 mr-auto max-w-[80%]'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSubmit()}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8a7fae]"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={isProcessing || !chatInput.trim()}
                  className={classNames(
                    buttonStyles.purple,
                    'px-4',
                    (isProcessing || !chatInput.trim()) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
              {selectedText && (
                <button
                  onClick={() => handleInsertText(chatHistory[chatHistory.length - 1]?.content || '')}
                  disabled={!chatHistory.length || chatHistory[chatHistory.length - 1]?.role !== 'assistant'}
                  className={classNames(
                    buttonStyles.text,
                    'mt-2 text-sm',
                    (!chatHistory.length || chatHistory[chatHistory.length - 1]?.role !== 'assistant') && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Insert last response into editor
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-6 w-6 text-[#8a7fae]" />
                <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
              </div>
              <button
                onClick={onClose}
                className={buttonStyles.icon}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="px-6 py-3 border-b border-gray-200">
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={classNames(
                      'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                      selectedCategory === category
                        ? 'bg-[#8a7fae] text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {selectedText ? (
                <>
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Selected text:</span> "{selectedText.substring(0, 100)}
                      {selectedText.length > 100 ? '...' : ''}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {filteredPrompts.map((prompt) => {
                      const Icon = iconMap[prompt.icon] || DocumentTextIcon;
                      return (
                        <button
                          key={prompt.label}
                          onClick={() => handlePromptAction(prompt)}
                          disabled={isProcessing}
                          className={classNames(
                            'flex items-start p-3 rounded-lg border border-gray-200',
                            'hover:border-[#8a7fae] hover:bg-purple-50 transition-colors',
                            'text-left group',
                            isProcessing && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <Icon className="h-5 w-5 text-[#8a7fae] mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-gray-900 group-hover:text-[#8a7fae]">
                              {prompt.label}
                            </h4>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {prompt.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowChat(true)}
                      className={classNames(
                        buttonStyles.purple,
                        'w-full flex items-center justify-center'
                      )}
                    >
                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      Open AI Chat for Custom Requests
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Text Selected
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Select some text in the editor to use AI actions, or open the chat for custom requests.
                  </p>
                  <button
                    onClick={() => setShowChat(true)}
                    className={classNames(
                      buttonStyles.purple,
                      'inline-flex items-center'
                    )}
                  >
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Open AI Chat
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
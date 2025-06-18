// src/components/CasperAIBlockWidget.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send, AlertCircle, Loader2, Bot } from 'lucide-react';
import { PuzzlePieceIcon } from '@heroicons/react/24/outline';
import { removeDuplicates } from '@/lib/utils/blockUtils';

interface BlockForm {
  name: string;
  description: string;
  category: string;
  defaultLocation: string;
  tags: string[];
  isActive: boolean;
  usedVariables: string[];
}

interface Variable {
  key: string;
  name: string;
  description: string;
}

interface VariableGroup {
  name: string;
  icon: string;
  variables: Variable[];
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  error?: boolean;
}

interface CasperAIBlockWidgetProps {
  editor?: any;
  variables?: VariableGroup[];
  blockForm?: BlockForm;
  onContentInserted?: () => void;
  onVariableDetected?: (variables: string[]) => void;
}

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function CasperAIBlockWidget({ 
  editor, 
  variables = [],
  blockForm,
  onContentInserted,
  onVariableDetected
}: CasperAIBlockWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      content: 'Hi! I\'m Casper, your AI assistant for creating content blocks. I can help you:\n\n• Draft block content with appropriate variables\n• Create headers, footers, addresses, and signatures\n• Insert healthcare variables automatically\n• Generate compliant block content\n• Suggest optimal block placement\n\nWhat type of block would you like to create?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get variable context for AI specific to blocks
  const getBlockVariableContext = () => {
    if (!variables.length) return '';
    
    const variableList = variables.flatMap((group: VariableGroup) => 
      group.variables.map((v: Variable) => `{{${v.key}}}: ${v.name} - ${v.description}`)
    ).join('\n');
    
    return `Available healthcare variables for blocks:\n${variableList}`;
  };

  // Get block-specific context
  const getBlockContext = () => {
    if (!blockForm) return '';
    
    const blockInfo: string[] = [
      `Block Type: ${blockForm.category}`,
      `Default Location: ${blockForm.defaultLocation}`,
      blockForm.name ? `Block Name: ${blockForm.name}` : '',
      blockForm.description ? `Description: ${blockForm.description}` : '',
      blockForm.usedVariables?.length ? `Currently using variables: ${blockForm.usedVariables.join(', ')}` : ''
    ].filter(Boolean);
    
    return `Block Context:\n${blockInfo.join('\n')}`;
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get current editor state
      const editorHtml = editor?.getHTML() || '';
      const selectedText = editor?.state?.selection 
        ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
        : '';

      console.log('🚀 Casper Block AI: Preparing request...');
      console.log('Block Category:', blockForm?.category);
      console.log('Block Location:', blockForm?.defaultLocation);
      console.log('Editor HTML length:', editorHtml.length);

      // Build block-specific context for AI
      const variableContext = getBlockVariableContext();
      const blockContext = getBlockContext();
      
      const fullContext = [
        'You are creating content for a REUSABLE CONTENT BLOCK, not a full letter.',
        blockContext,
        variableContext,
        `Current block content: ${editorHtml || 'Empty block'}`,
        selectedText ? `Selected text: "${selectedText}"` : 'No text selected',
        'IMPORTANT GUIDELINES:',
        '- Create block content that can be reused across multiple letters',
        '- Use appropriate healthcare variables in double curly braces like {{member_name}}',
        '- Keep content focused on the block\'s specific purpose (header, footer, address, etc.)',
        '- Consider the block\'s default location when creating content',
        '- For headers: Include logos, addresses, contact info',
        '- For footers: Include disclaimers, appeal rights, contact information',
        '- For addresses: Use proper mailing address format with variables',
        '- For signatures: Include titles, contact info, professional formatting',
        '- Ensure HIPAA compliance and professional medical tone',
        'Provide your response in HTML format that can be inserted into the block editor.'
      ].filter(Boolean).join('\n\n');

      // Prepare the request
      const requestBody = {
        messages: [
          { role: 'system', content: fullContext },
          ...messages.filter(m => !m.error), // Remove previous error messages
          userMessage
        ],
        editorHtml: editorHtml,
        selectionMemory: selectedText,
        blockContext: {
          category: blockForm?.category,
          defaultLocation: blockForm?.defaultLocation,
          name: blockForm?.name,
          description: blockForm?.description
        },
        clinicalContext: true,
        hipaaMode: true,
        isBlockMode: true
      };

      console.log('📤 Sending request to /api/casper-ai');

      const response = await fetch('/api/casper-ai', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('❌ Non-JSON response:', errorText);
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        throw new Error(`Server returned invalid JSON response (${response.status})`);
      }

      if (!response.ok) {
        console.error('❌ API Error Response:', data);
        throw new Error(`API Error: ${data.reply || data.error || response.status}`);
      }
      
      console.log('✅ Block AI Response:', data);
      
      if (data.error) {
        console.warn('⚠️ API returned error:', data);
        setMessages((prev) => [...prev, { 
          role: 'ai', 
          content: data.reply || 'Sorry, I encountered an error creating your block content.',
          error: true 
        }]);
      } else {
        setMessages((prev) => [...prev, { 
          role: 'ai', 
          content: data.reply || 'Block content generated and inserted!'
        }]);

        // Insert HTML content if provided
        if (editor && data.insertHtml) {
          console.log('📋 Inserting block content into editor...');
          try {
            // Focus the editor first
            editor.commands.focus();
            
            // If there's selected text, replace it, otherwise insert at cursor
            if (selectedText) {
              editor.commands.deleteSelection();
            }
            
            // Insert the new content
            editor.commands.insertContent(data.insertHtml);
            
            // Detect variables in the inserted content
            const variableMatches = data.insertHtml.match(/\{\{([^}]+)\}\}/g) || [];
            const detectedVariables: string[] = variableMatches.map((match: string) => 
              match.replace(/[{}]/g, '').trim()
            );
            
            // Remove duplicates from detected variables
            const uniqueDetectedVariables = removeDuplicates(detectedVariables);
            
            if (uniqueDetectedVariables.length > 0 && onVariableDetected) {
              onVariableDetected(uniqueDetectedVariables);
            }
            
            console.log('✅ Block content inserted successfully');
            console.log('🏷️ Detected variables:', uniqueDetectedVariables);
            
            onContentInserted?.();
          } catch (insertError) {
            console.error('❌ Failed to insert block content:', insertError);
            setMessages((prev) => [...prev, { 
              role: 'ai', 
              content: 'Block content generated but failed to insert. Please copy from the response above.',
              error: true 
            }]);
          }
        }
      }

    } catch (err: any) {
      console.error('💥 Casper Block AI Error:', err);
      
      let errorMessage = 'I\'m having trouble creating your block content right now. ';
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (err.message.includes('500')) {
        errorMessage += 'There\'s a server issue. Please try again in a moment.';
      } else if (err.message.includes('404')) {
        errorMessage += 'The AI service endpoint is not available.';
      } else {
        errorMessage += `Error: ${err.message}`;
      }
      
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        content: errorMessage,
        error: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([
      { 
        role: 'ai', 
        content: 'Chat cleared! What type of block content would you like me to help you create?' 
      }
    ]);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div 
      className={classNames(
        "fixed right-0 top-0 h-screen w-[450px] bg-white border-l border-zinc-200 shadow-xl z-50",
        "transition-transform duration-300 transform",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Toggle Button */}
      <button
        className={classNames(
          "absolute left-[-120px] bottom-16 min-w-[120px] shadow-lg",
          "flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? (
          <X className="w-4 h-4" />
        ) : (
          <>
            <PuzzlePieceIcon className="w-4 h-4" />
            <span className="whitespace-nowrap">Block AI</span>
          </>
        )}
      </button>

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PuzzlePieceIcon className="w-5 h-5 text-zinc-700" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Casper Block AI</h2>
              {blockForm?.category && (
                <p className="text-xs text-zinc-600">
                  Creating {blockForm.category} block • {blockForm.defaultLocation || 'body'} placement
                </p>
              )}
            </div>
          </div>
          <button
            onClick={clearChat}
            className="text-xs px-3 py-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            Clear Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={classNames(
                'rounded-lg p-3 text-sm max-w-[90%] shadow-sm border',
                msg.role === 'user' 
                  ? 'bg-zinc-100 text-zinc-900 ml-auto border-zinc-200' 
                  : msg.error
                    ? 'bg-red-50 text-red-900 border-red-200'
                    : 'bg-white text-zinc-900 border-zinc-200'
              )}
            >
              {msg.error && (
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  <span className="text-xs font-medium text-red-600">Error</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
          
          {loading && (
            <div className="bg-zinc-50 text-zinc-800 rounded-lg p-3 text-sm max-w-[90%] flex items-center gap-2 border border-zinc-200">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
              <span>Creating your block content...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 resize-none min-h-[80px] max-h-[120px] bg-white"
              placeholder={`Ask me to create ${blockForm?.category || 'block'} content, add variables, or format for ${blockForm?.defaultLocation || 'body'} placement...`}
              rows={3}
              disabled={loading}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 p-3 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 rounded-lg transition-colors focus:outline-none"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>
              💡 I can use {variables.reduce((acc: number, group: VariableGroup) => acc + group.variables.length, 0)} healthcare variables
            </span>
            <span className={classNames(
              "px-2 py-1 rounded-full text-xs",
              editor ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            )}>
              {editor ? "Block editor connected" : "Editor not connected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
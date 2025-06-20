'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send, AlertCircle, Loader2, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  error?: boolean;
}

interface CasperAIWidgetProps {
  editor?: any;
  variables?: any[];
  onContentInserted?: () => void;
}

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function CasperAIWidget({ 
  editor, 
  variables = [],
  onContentInserted 
}: CasperAIWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      content: 'Hi! I\'m Casper, your AI assistant for writing clinical letters. I can help you:\n\n• Draft complete letters from scratch\n• Rewrite text for tone and compliance\n• Insert patient variables automatically\n• Generate denial, approval, or appeal letters\n• Check for HIPAA compliance\n\nJust tell me what you need!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get variable context for AI
  const getVariableContext = () => {
    if (!variables.length) return '';
    
    const variableList = variables.flatMap(group => 
      group.variables.map((v: any) => `{{${v.key}}}: ${v.name} - ${v.description}`)
    ).join('\n');
    
    return `Available variables you can use:\n${variableList}`;
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

      console.log('🚀 Casper: Preparing request...');
      console.log('Editor available:', !!editor);
      console.log('Editor HTML length:', editorHtml.length);
      console.log('Selected text:', selectedText || 'none');
      console.log('Variables available:', variables.length);

      // Build the full context for AI
      const variableContext = getVariableContext();
      const fullContext = [
        variableContext,
        `Current document content: ${editorHtml || 'Empty document'}`,
        selectedText ? `Selected text: "${selectedText}"` : 'No text selected',
        'Please provide your response in HTML format that can be inserted into the editor.',
        'Use the available variables by wrapping them in double curly braces like {{member_name}}.'
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
        clinicalContext: true,
        hipaaMode: true
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
      console.log('📡 Response ok:', response.ok);

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
      console.log('✅ Response data:', data);
      
      if (data.error) {
        console.warn('⚠️ API returned error:', data);
        setMessages((prev) => [...prev, { 
          role: 'ai', 
          content: data.reply || 'Sorry, I encountered an error.',
          error: true 
        }]);
      } else {
        setMessages((prev) => [...prev, { 
          role: 'ai', 
          content: data.reply || 'Content generated and inserted!'
        }]);

        // Insert HTML content if provided
        if (editor && data.insertHtml) {
          console.log('📋 Inserting content into editor...');
          try {
            // Focus the editor first
            editor.commands.focus();
            
            // If there's selected text, replace it, otherwise insert at cursor
            if (selectedText) {
              editor.commands.deleteSelection();
            }
            
            // Insert the new content
            editor.commands.insertContent(data.insertHtml);
            
            console.log('✅ Content inserted successfully');
            onContentInserted?.();
          } catch (insertError) {
            console.error('❌ Failed to insert content:', insertError);
            setMessages((prev) => [...prev, { 
              role: 'ai', 
              content: 'Content generated but failed to insert. Please copy from the response above.',
              error: true 
            }]);
          }
        }
      }

    } catch (err: any) {
      console.error('💥 Casper Widget Error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        type: typeof err
      });
      
      let errorMessage = 'I\'m having trouble connecting right now. ';
      
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
      void handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([
      { 
        role: 'ai', 
        content: 'Chat cleared! How can I help you with your letter?' 
      }
    ]);
  };

  // Quick action buttons
  const quickActions = [
    {
      label: 'Draft Denial Letter',
      prompt: 'Create a professional healthcare coverage denial letter template with appropriate variables like {{member_name}}, {{service_date}}, {{diagnosis_code}} and compliant language.'
    },
    {
      label: 'Draft Approval Letter', 
      prompt: 'Create a prior authorization approval letter template with proper healthcare variables like {{member_name}}, {{provider_name}}, {{procedure_code}} and professional formatting.'
    },
    {
      label: 'Add Variables',
      prompt: 'Insert appropriate healthcare variables like {{member_name}}, {{provider_name}}, {{service_date}}, and {{diagnosis_code}} into the current text where they would make sense.'
    },
    {
      label: 'Make Professional',
      prompt: 'Rewrite the selected text or entire document in a professional clinical tone suitable for healthcare correspondence.'
    }
  ];

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
          "absolute left-[-100px] bottom-16 min-w-[100px] shadow-lg",
          "flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
        )}
        onClick={() => { setOpen((prev) => !prev); }}
      >
        {open ? (
          <X className="w-4 h-4" />
        ) : (
          <>
            <Bot className="w-4 h-4" />
            <span className="whitespace-nowrap">Casper</span>
          </>
        )}
      </button>

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-zinc-700" />
            <h2 className="text-lg font-semibold text-zinc-900">Casper AI</h2>
          </div>
          <button
            onClick={clearChat}
            className="text-xs px-3 py-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            Clear Chat
          </button>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="p-4 border-b border-zinc-200 bg-zinc-50">
            <p className="text-xs text-zinc-600 mb-2">Quick actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => { handleQuickAction(action.prompt); }}
                  className="text-left text-xs p-2 h-auto whitespace-normal text-zinc-700 hover:bg-white border border-zinc-300 rounded hover:border-zinc-400 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
              <span>Casper is crafting your content...</span>
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
              placeholder="Ask Casper to draft a letter, add variables, or rewrite content..."
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
          
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              💡 I can use {variables.reduce((acc, group) => acc + group.variables.length, 0)} variables
            </span>
            <span className={classNames(
              "px-2 py-1 rounded-full text-xs",
              editor ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            )}>
              {editor ? "Editor connected" : "Editor not connected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
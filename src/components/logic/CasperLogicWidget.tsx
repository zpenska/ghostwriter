'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Send, X, Loader2, AlertCircle, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  error?: boolean;
}

interface VariableGroup {
  name: string;
  variables: {
    key: string;
    name: string;
    description: string;
  }[];
}

interface CasperLogicWidgetProps {
  variables: VariableGroup[];
  onLogicInserted?: () => void;
}

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function CasperLogicWidget({ variables = [], onLogicInserted }: CasperLogicWidgetProps) {
  // 🔥 Better templateId detection
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Try multiple ways to get templateId
  const templateId = 
    params?.id || 
    searchParams?.get('id') || 
    searchParams?.get('templateId') ||
    (typeof window !== 'undefined' ? 
      window.location.pathname.split('/templates/')[1]?.split('/')[0] : null);

  const [open, setOpen] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'Hi! I\'m Casper, your AI logic assistant. I can help you:\n\n• Create rules from natural language\n• Suggest variable conditions\n• Insert reusable blocks\n• Automatically update the visual logic builder'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debug templateId
  useEffect(() => {
    if (!templateId) {
      console.warn('⚠️ Casper: No templateId found. Params:', { params, searchParams: searchParams?.toString() });
    } else {
      console.log('✅ Casper: Using templateId:', templateId);
    }
  }, [templateId, params, searchParams]);

  const getVariableContext = () => {
    if (!variables.length) return '';
    return variables.flatMap(group =>
      group.variables.map((v) => `{{${v.key}}}: ${v.name} - ${v.description}`)
    ).join('\n');
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    
    if (!templateId) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '❌ Template ID not found. Please make sure you\'re on a template page.',
        error: true
      }]);
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      console.log('🤖 Casper: Sending request with templateId:', templateId);
      
      const response = await fetch('/api/casper-logic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userInput, 
          templateId 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Unexpected AI response.');
      }

      if (!result.success || !result.nodes || !result.edges) {
        throw new Error('AI response missing required data.');
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: `✅ Logic created: "${userInput}"\n\n${result.message || `Added ${result.nodes.length} nodes and ${result.edges.length} edges to your flow.`}`
        }
      ]);

      // 🔥 Trigger canvas refresh - the API now handles Firestore saving
      console.log('🔄 Casper: Logic saved to Firestore, triggering refresh');
      onLogicInserted?.();

    } catch (err: any) {
      console.error('❌ Casper error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: `❌ ${err.message || 'An unknown error occurred.'}`,
          error: true
        }
      ]);
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
        content: 'Chat cleared! What logic rule would you like to create next?'
      }
    ]);
  };

  const quickActions = [
    {
      label: 'Spanish Rule',
      prompt: 'If member.language is "es", insert the Spanish footer block.'
    },
    {
      label: 'Age Check',
      prompt: 'If member.age is under 18, insert pediatric notice block.'
    },
    {
      label: 'Denial Notice',
      prompt: 'If claim.status is denied, insert Appeal Rights Notice.'
    },
    {
      label: 'Loop Lines',
      prompt: 'Repeat service line block for each item in claim.lines array.'
    }
  ];

  const isDisabled = loading || !templateId || !input.trim();

  return (
    <div
      className={classNames(
        'fixed right-0 top-0 h-screen w-[450px] bg-white border-l border-zinc-200 shadow-xl z-50',
        'transition-transform duration-300 transform',
        open ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Toggle Button */}
      <button
        className="absolute left-[-100px] bottom-16 min-w-[100px] bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 flex items-center gap-2 shadow-lg focus:outline-none"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X className="w-4 h-4" /> : <><Bot className="w-4 h-4" /><span>Casper</span></>}
      </button>

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-zinc-700" />
            <h2 className="text-lg font-semibold text-zinc-900">Casper AI</h2>
          </div>
          <button
            onClick={clearChat}
            className="text-xs px-3 py-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded"
          >
            Clear Chat
          </button>
        </div>

        {/* Template ID Status */}
        <div className={classNames(
          "px-4 py-2 text-xs border-b",
          templateId 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-red-50 text-red-700 border-red-200"
        )}>
          {templateId ? `✅ Connected to template: ${templateId}` : '❌ Template ID not found'}
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && templateId && (
          <div className="p-4 border-b border-zinc-200 bg-zinc-50">
            <p className="text-xs text-zinc-600 mb-2">Quick actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInput(action.prompt)}
                  className="text-left text-xs p-2 border border-zinc-300 rounded hover:border-zinc-400 hover:bg-white transition-colors"
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
            <div className="flex items-center gap-2 bg-zinc-50 text-zinc-800 border border-zinc-200 rounded-lg p-3 text-sm max-w-[90%]">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
              <span>Generating logic...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={templateId ? "Describe the logic you want to add..." : "Template ID required to generate logic"}
              className="flex-1 text-sm px-3 py-2 border border-zinc-300 rounded-lg shadow-sm bg-white resize-none min-h-[80px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-zinc-500"
              rows={3}
              disabled={loading || !templateId}
            />
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              className="flex-shrink-0 p-3 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          <div className="text-xs text-zinc-500 flex items-center justify-between">
            <span>🧠 Casper can access {variables.reduce((acc, g) => acc + g.variables.length, 0)} logic variables</span>
            <span className={classNames(
              "px-2 py-1 rounded-full",
              templateId 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-red-100 text-red-700"
            )}>
              {templateId ? 'Ready' : 'No Template'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
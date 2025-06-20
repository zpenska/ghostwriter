'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send, Loader2, Bot, AlertCircle } from 'lucide-react';
import classNames from 'classnames';
import { saveLogicNode } from '@/lib/firebase/saveLogicNodes';

interface Message {
  role: 'user' | 'ai';
  content: string;
  error?: boolean;
}

interface CasperLogicWidgetProps {
  templateId: string;
  blockList?: { id: string; label: string }[];
}

export default function CasperLogicWidget({
  templateId,
  blockList = [],
}: CasperLogicWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        'Hi! I’m Casper. I can help you create rules like:\n\n• Show this only if member is over 65\n• Insert a loop for every claim line\n• Add CMS compliance blocks\n\nJust describe what you want!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const context = [
        `Blocks available: ${blockList.map((b) => b.label).join(', ')}`,
        'Output must be valid JSON with nodeType and logic fields only.',
      ].join('\n\n');

      const response = await fetch('/api/casper-logic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          prompt: input,
          system: context,
        }),
      });

      if (!response.ok) throw new Error('AI request failed.');
      const { nodeType, logic, experimental } = await response.json();

      await saveLogicNode({
        templateId,
        nodeType,
        logic,
        experimental,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `✅ Logic saved as ${nodeType}.`,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: err.message || 'Something went wrong.',
          error: true,
        },
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
        className={classNames(
          'absolute left-[-100px] bottom-16 min-w-[100px] shadow-lg',
          'flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-lg transition-colors'
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X className="w-4 h-4" /> : <>
          <Bot className="w-4 h-4" />
          <span>Casper</span>
        </>}
      </button>

      {/* Main Panel */}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-zinc-700" />
            <h2 className="text-lg font-semibold text-zinc-900">Casper Logic AI</h2>
          </div>
          <button
            onClick={() =>
              setMessages([
                {
                  role: 'ai',
                  content: 'Chat reset! Ready to help again.',
                },
              ])
            }
            className="text-xs px-3 py-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded"
          >
            Clear
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
              <span>Casper is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your rule logic here..."
            rows={3}
            disabled={loading}
            className="flex-1 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-white"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 p-3 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 rounded-lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

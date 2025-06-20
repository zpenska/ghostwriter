'use client';

import { useState } from 'react';
import { saveLogicNode } from '@/lib/firebase/saveLogicNodes';
import { getLogicNodes } from '@/lib/firebase/getLogicNodes';
import { Loader2, Send } from 'lucide-react';

const TEMPLATE_ID = 'your-template-id'; // ⬅️ replace with a real templateId

export default function TestLogicPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [allNodes, setAllNodes] = useState<any[]>([]);

  const runLogicTest = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/casper-logic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, templateId: TEMPLATE_ID }),
      });

      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();

      await saveLogicNode({
        templateId: TEMPLATE_ID,
        logic: json.logic,
        nodeType: json.nodeType,
      });

      setResult(json);
      const nodes = await getLogicNodes(TEMPLATE_ID);
      setAllNodes(nodes);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Casper Logic Test
      </h1>

      <textarea
        rows={4}
        placeholder="Type a natural language logic prompt..."
        className="w-full border border-gray-300 rounded p-3 shadow-sm focus:ring-2 focus:ring-indigo-500"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={runLogicTest}
        disabled={loading}
        className="bg-indigo-600 text-white rounded px-4 py-2 flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Submit to Casper
      </button>

      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm">
          <h2 className="font-semibold mb-2">AI Response:</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {allNodes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded p-4 text-sm">
          <h2 className="font-semibold mb-2">All Logic Nodes:</h2>
          <ul className="space-y-2">
            {allNodes.map((node) => (
              <li key={node.id} className="p-2 rounded border border-gray-100 bg-gray-50">
                <strong>{node.type}</strong>: {node.data?.condition || node.data?.label || 'No label'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

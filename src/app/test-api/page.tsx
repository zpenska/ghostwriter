// src/app/test-api/page.tsx
'use client';

import { useState } from 'react';

export default function TestApiPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGetEndpoint = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/casper-ai');
      const data = await response.json();
      setTestResult({
        type: 'GET Test',
        status: response.status,
        data
      });
    } catch (error: any) {
      setTestResult({
        type: 'GET Test',
        error: error.message
      });
    }
    setLoading(false);
  };

  const testPostEndpoint = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/casper-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello, can you help me draft a simple letter?' }
          ],
          editorHtml: '',
          selectionMemory: '',
          clinicalContext: true,
          hipaaMode: true
        }),
      });
      
      const data = await response.json();
      setTestResult({
        type: 'POST Test',
        status: response.status,
        data
      });
    } catch (error: any) {
      setTestResult({
        type: 'POST Test',
        error: error.message
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Casper AI API Test</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testGetEndpoint}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test GET Endpoint'}
        </button>
        
        <button
          onClick={testPostEndpoint}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test POST Endpoint'}
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">{testResult.type} Result:</h2>
          <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>First, test the GET endpoint to see if the API is responding</li>
          <li>Then test the POST endpoint to see if AI generation works</li>
          <li>Check your browser console for detailed logs</li>
          <li>Check your terminal/server logs for backend errors</li>
        </ol>
      </div>
    </div>
  );
}
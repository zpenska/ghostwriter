'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import html2pdf from 'html2pdf.js';
import { PaperAirplaneIcon, PrinterIcon } from '@heroicons/react/24/outline';

export default function ClientSimulatorPage() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'templates'), (snapshot) => {
      const loaded = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTemplates(loaded);
    });
    return () => unsubscribe();
  }, []);

  const sendLetter = async (template) => {
    const docRef = await addDoc(collection(db, 'deliveries'), {
      templateId: template.id,
      method: 'mail',
      status: 'pending',
      timestamp: new Date(),
    });
    setStatusMap((prev) => ({ ...prev, [docRef.id]: 'pending' }));
    // Call Lob API here
  };

  const sendFax = async (template) => {
    const docRef = await addDoc(collection(db, 'deliveries'), {
      templateId: template.id,
      method: 'fax',
      status: 'pending',
      timestamp: new Date(),
    });
    setStatusMap((prev) => ({ ...prev, [docRef.id]: 'pending' }));
    // Call InterFAX API here
  };

  const downloadPDF = (html) => {
    html2pdf().from(html).save();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-zinc-800">Client Simulator</h1>
      <p className="text-zinc-500">Preview and send templates as letters or faxes</p>

      <div className="rounded-2xl border bg-white shadow p-4 space-y-4">
        <label className="text-sm text-zinc-700 font-medium">Select Template</label>
        <select
          className="w-full p-2 border border-zinc-300 rounded-xl"
          onChange={(e) => {
            const selected = templates.find(t => t.id === e.target.value);
            setSelectedTemplate(selected || null);
          }}
        >
          <option value="">Choose a template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {selectedTemplate && (
          <div className="border rounded-xl p-4 bg-zinc-50 space-y-4">
            <div id="template-preview" className="prose max-w-none bg-white p-4 rounded-xl shadow">
              <div dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => sendLetter(selectedTemplate)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8a7fae] text-white hover:opacity-90"
              >
                <PaperAirplaneIcon className="h-4 w-4" /> Send Letter
              </button>
              <button
                onClick={() => sendFax(selectedTemplate)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3a4943] text-white hover:opacity-90"
              >
                <PrinterIcon className="h-4 w-4" /> Send Fax
              </button>
              <button
                onClick={() => downloadPDF(document.getElementById('template-preview'))}
                className="ml-auto text-sm underline text-zinc-600 hover:text-zinc-800"
              >
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

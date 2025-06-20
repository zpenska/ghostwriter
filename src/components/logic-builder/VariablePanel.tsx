'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function VariablePanel({ templateId }: { templateId: string }) {
  const [variables, setVariables] = useState<any[]>([]);

  useEffect(() => {
    const loadVariables = async () => {
      const ref = collection(db, 'casper-variables', templateId, 'items');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVariables(data);
    };

    loadVariables();
  }, [templateId]);

  return (
    <div className="p-3 text-sm">
      <div className="font-medium text-zinc-800 mb-2">Available Variables</div>
      <ul className="space-y-1 text-sm text-zinc-600">
        {variables.map((v) => (
          <li key={v.id}>
            <code className="bg-zinc-100 px-1 py-0.5 rounded">{`{{${v.id}}}`}</code> — {v.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

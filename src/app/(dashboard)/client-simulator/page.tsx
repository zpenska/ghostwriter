'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Template {
  id: string;
  name: string;
  content: string;
}

interface Member {
  id: string;
  firstName?: string;
  lastName?: string;
  memberId?: string;
  dob?: string;
}

export default function ClientSimulatorPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    const unsubTemplates = onSnapshot(collection(db, 'templates'), (snap) => {
      const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Template));
      setTemplates(rows);
    });

    const unsubMembers = onSnapshot(collection(db, 'variable-test-data'), (snap) => {
      const rows = snap.docs.map((doc) => {
        const raw = doc.data();
        const data = raw.data || {};

        const member: Member = {
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          memberId: data.memberId,
          dob: data.birthDate,
        };

        console.log('[📥 Firestore Member]', member);
        return member;
      });

      setMembers(rows);
    });

    return () => {
      unsubTemplates();
      unsubMembers();
    };
  }, []);

  const fillTemplate = (template: string, member: Member) => {
    return template
      .replace(/{{member_name}}/g, `${member.firstName ?? ''} ${member.lastName ?? ''}`)
      .replace(/{{dob}}/g, member.dob ?? '')
      .replace(/{{member_id}}/g, member.memberId ?? '')
      .replace(/{{diagnosis_code}}/g, 'D123.4')
      .replace(/{{provider_name}}/g, 'Dr. Smith')
      .replace(/{{facility_name}}/g, 'HealthCare Clinic')
      .replace(/{{service_date}}/g, '06/14/2025')
      .replace(/{{procedure_code}}/g, 'PROC-001');
  };

  const sendLetter = async () => {
    if (!selectedTemplate || !selectedMember) return;

    console.log('✅ Sending letter to:', selectedMember.memberId);

    const filled = fillTemplate(selectedTemplate.content, selectedMember);

    const docRef = await addDoc(collection(db, 'deliveries'), {
      templateId: selectedTemplate.id,
      memberId: selectedMember.id,
      method: 'mail',
      status: 'pending',
      timestamp: new Date(),
    });

    await fetch('/api/lob-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: filled,
        deliveryId: docRef.id,
      }),
    });

    setStatus('success');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-950">Client Simulator</h1>
        <p className="text-zinc-600 mt-2">Select a member and a letter template to send.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-6">
        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-950">
              Select Member
            </label>
            <select
              value={selectedMember?.id || ''}
              onChange={(e) => {
                const member = members.find((m) => m.id === e.target.value) || null;
                setSelectedMember(member);
              }}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            >
              <option value="">Choose a member</option>
              {members
                .filter((m) => m.firstName && m.lastName && m.memberId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.memberId})
                  </option>
                ))}
            </select>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-950">
              Select Template
            </label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find((t) => t.id === e.target.value) || null;
                setSelectedTemplate(template);
              }}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            >
              <option value="">Choose a template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Information Display */}
        {(selectedMember || selectedTemplate) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-200">
            {selectedMember && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-950">Selected Member</h3>
                <div className="bg-zinc-50 rounded-md p-3 text-sm">
                  <div><strong>Name:</strong> {selectedMember.firstName} {selectedMember.lastName}</div>
                  <div><strong>Member ID:</strong> {selectedMember.memberId}</div>
                  {selectedMember.dob && <div><strong>DOB:</strong> {selectedMember.dob}</div>}
                </div>
              </div>
            )}

            {selectedTemplate && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-950">Selected Template</h3>
                <div className="bg-zinc-50 rounded-md p-3 text-sm">
                  <div><strong>Template:</strong> {selectedTemplate.name}</div>
                  <div className="text-zinc-600 mt-1 line-clamp-2">
                    {selectedTemplate.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Area */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
          <div className="flex items-center gap-4">
            <Button
              onClick={sendLetter}
              disabled={!selectedTemplate || !selectedMember}
              className="flex items-center gap-2"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Send Letter
            </Button>

            {status === 'success' && (
              <Badge className="bg-green-100 text-green-800">
                Letter sent successfully!
              </Badge>
            )}
          </div>

          {selectedTemplate && selectedMember && (
            <div className="text-sm text-zinc-500">
              Ready to send to {selectedMember.firstName} {selectedMember.lastName}
            </div>
          )}
        </div>
      </div>

      {/* Preview Area */}
      {selectedTemplate && selectedMember && (
        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-zinc-950 mb-4">Letter Preview</h3>
          <div className="bg-zinc-50 rounded-md p-4 max-h-96 overflow-y-auto">
            <div 
              className="prose prose-sm max-w-none prose-zinc"
              dangerouslySetInnerHTML={{ 
                __html: fillTemplate(selectedTemplate.content, selectedMember) 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
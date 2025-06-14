'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const [memberOpen, setMemberOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

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
    <div className="max-w-5xl mx-auto p-6 space-y-6 font-sans">
      <h1 className="text-3xl font-bold text-zinc-800">Client Simulator</h1>
      <p className="text-zinc-500">Select a member and a letter template to send.</p>

      <div className="space-y-4 bg-white border rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block">Select Member</label>
            <Select
              open={memberOpen}
              onOpenChange={setMemberOpen}
              onValueChange={(id: string) => {
                setSelectedMember(members.find((m) => m.id === id) || null);
                setMemberOpen(false);
              }}
            >
              <SelectTrigger className="w-full border border-zinc-300 bg-white shadow-sm rounded-md px-3 py-2 text-sm text-zinc-800">
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {members
                  .filter((m) => m.firstName && m.lastName && m.memberId)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.memberId})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block">Select Template</label>
            <Select
              open={templateOpen}
              onOpenChange={setTemplateOpen}
              onValueChange={(id: string) => {
                setSelectedTemplate(templates.find((t) => t.id === id) || null);
                setTemplateOpen(false);
              }}
            >
              <SelectTrigger className="w-full border border-zinc-300 bg-white shadow-sm rounded-md px-3 py-2 text-sm text-zinc-800">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={sendLetter}
            disabled={!selectedTemplate || !selectedMember}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8a7fae] text-white hover:opacity-90 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-4 w-4" /> Send Letter
          </button>

          {status === 'success' && (
            <Badge color="green" className="ml-4">
              Letter sent successfully!
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}


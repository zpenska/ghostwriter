'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PaperAirplaneIcon, PhoneIcon, CloudIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, DocumentIcon } from '@heroicons/react/20/solid';
import { classNames } from '@/lib/utils/cn';

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

type DeliveryMethod = 'mail' | 'fax' | 'vault';

export default function ClientSimulatorPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('mail');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [lastVaultUrl, setLastVaultUrl] = useState<string | null>(null);

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

  const sendLetter = async (method: DeliveryMethod = deliveryMethod) => {
    if (!selectedTemplate || !selectedMember) return;

    setStatus('sending');
    setLastVaultUrl(null);
    console.log(`✅ Sending letter via ${method} to:`, selectedMember.memberId);

    const filled = fillTemplate(selectedTemplate.content, selectedMember);

    try {
      const docRef = await addDoc(collection(db, 'deliveries'), {
        templateId: selectedTemplate.id,
        memberId: selectedMember.id,
        method: method,
        status: 'pending',
        timestamp: new Date(),
      });

      let apiEndpoint: string;
      switch (method) {
        case 'fax':
          apiEndpoint = '/api/fax-send';
          break;
        case 'vault':
          apiEndpoint = '/api/vault-send';
          break;
        default:
          apiEndpoint = '/api/lob-send';
      }
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: filled,
          deliveryId: docRef.id,
          memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
          memberId: selectedMember.memberId,
          templateName: selectedTemplate.name,
        }),
      });

      if (method === 'vault' && response.ok) {
        const result = await response.json();
        if (result.vaultUrl) {
          setLastVaultUrl(result.vaultUrl);
        }
      }

      setStatus('success');
      
      // Reset success status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setLastVaultUrl(null);
      }, 5000);
    } catch (error) {
      console.error('Error sending letter:', error);
      setStatus('idle');
    }
  };

  const openVaultDocument = () => {
    if (lastVaultUrl) {
      window.open(lastVaultUrl, '_blank');
    }
  };

  const isReadyToSend = selectedTemplate && selectedMember;

  const getDeliveryMethodIcon = (method: DeliveryMethod) => {
    switch (method) {
      case 'fax':
        return PhoneIcon;
      case 'vault':
        return CloudIcon;
      default:
        return PaperAirplaneIcon;
    }
  };

  const getDeliveryMethodLabel = (method: DeliveryMethod) => {
    switch (method) {
      case 'fax':
        return 'Fax Delivery';
      case 'vault':
        return 'Document Vault';
      default:
        return 'Mail Delivery';
    }
  };

  const getDeliveryMethodDescription = (method: DeliveryMethod) => {
    switch (method) {
      case 'fax':
        return 'Send via fax transmission';
      case 'vault':
        return 'Store securely in cloud vault';
      default:
        return 'Send via postal mail';
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Client Simulator
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Select a member and a letter template to send via mail, fax, or store in Document Vault
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Selection Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Member Selection */}
              <div className="space-y-3">
                <label htmlFor="member-select" className="block text-sm font-medium leading-6 text-gray-900">
                  Select Member
                </label>
                <select
                  id="member-select"
                  value={selectedMember?.id || ''}
                  onChange={(e) => {
                    const member = members.find((m) => m.id === e.target.value) || null;
                    setSelectedMember(member);
                    setStatus('idle');
                    setLastVaultUrl(null);
                  }}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                >
                  <option value="">Choose a member...</option>
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
              <div className="space-y-3">
                <label htmlFor="template-select" className="block text-sm font-medium leading-6 text-gray-900">
                  Select Template
                </label>
                <select
                  id="template-select"
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find((t) => t.id === e.target.value) || null;
                    setSelectedTemplate(template);
                    setStatus('idle');
                    setLastVaultUrl(null);
                  }}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                >
                  <option value="">Choose a template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delivery Method Selection */}
            {isReadyToSend && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <fieldset>
                  <legend className="text-sm font-medium leading-6 text-gray-900">Delivery Method</legend>
                  <div className="mt-3 space-y-3">
                    {(['mail', 'fax', 'vault'] as DeliveryMethod[]).map((method) => {
                      const Icon = getDeliveryMethodIcon(method);
                      return (
                        <div key={method} className="flex items-center">
                          <input
                            id={`delivery-${method}`}
                            name="delivery-method"
                            type="radio"
                            checked={deliveryMethod === method}
                            onChange={() => setDeliveryMethod(method)}
                            className="h-4 w-4 border-gray-300 text-zinc-600 focus:ring-zinc-600"
                          />
                          <label htmlFor={`delivery-${method}`} className="ml-3 flex items-center">
                            <Icon className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium leading-6 text-gray-900">
                                {getDeliveryMethodLabel(method)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {getDeliveryMethodDescription(method)}
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}
          </div>

          {/* Selected Information Display */}
          {isReadyToSend && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Information</h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Member Details</h4>
                  <div className="bg-gray-50 rounded-md p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Name:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Member ID:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedMember.memberId}</span>
                    </div>
                    {selectedMember.dob && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">DOB:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedMember.dob}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Template Details</h4>
                  <div className="bg-gray-50 rounded-md p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Template:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedTemplate.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Delivery:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{getDeliveryMethodLabel(deliveryMethod)}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Preview:</span>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                        {selectedTemplate.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => sendLetter('mail')}
                    disabled={!isReadyToSend || status === 'sending'}
                    className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    {status === 'sending' && deliveryMethod === 'mail' ? 'Sending...' : 'Send by Mail'}
                  </button>

                  <button
                    onClick={() => sendLetter('fax')}
                    disabled={!isReadyToSend || status === 'sending'}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PhoneIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    {status === 'sending' && deliveryMethod === 'fax' ? 'Sending...' : 'Send by Fax'}
                  </button>

                  <button
                    onClick={() => sendLetter('vault')}
                    disabled={!isReadyToSend || status === 'sending'}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CloudIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    {status === 'sending' && deliveryMethod === 'vault' ? 'Storing...' : 'Store in Vault'}
                  </button>

                  {status === 'success' && (
                    <div className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-800 ring-1 ring-inset ring-green-600/20">
                      <CheckCircleIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                      {deliveryMethod === 'vault' ? 'Stored in vault!' : 'Letter sent successfully!'}
                    </div>
                  )}

                  {lastVaultUrl && (
                    <button
                      onClick={openVaultDocument}
                      className="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900 shadow-sm ring-1 ring-inset ring-blue-300 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                    >
                      <DocumentIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                      View in Vault
                    </button>
                  )}
                </div>

                {isReadyToSend && status === 'idle' && (
                  <div className="text-sm text-gray-500">
                    Ready to send to {selectedMember.firstName} {selectedMember.lastName}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Letter Preview */}
          {isReadyToSend && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Letter Preview</h3>
                <div className="text-sm text-gray-500">
                  Delivery method: <span className="font-medium">{getDeliveryMethodLabel(deliveryMethod)}</span>
                </div>
              </div>
              
              {/* Letter Preview Content */}
              <div className="bg-white border border-gray-200 rounded-md">
                {/* Letter Paper Simulation */}
                <div className="mx-auto max-w-2xl">
                  <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-8 py-12 space-y-4">
                      <div 
                        className="prose prose-sm max-w-none text-gray-900"
                        style={{ 
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          lineHeight: '1.6'
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: fillTemplate(selectedTemplate.content, selectedMember) 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isReadyToSend && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <PaperAirplaneIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Send Letters</h3>
              <p className="text-gray-600 mb-6">
                Select both a member and a template to preview and send letters
              </p>
              <div className="text-sm text-gray-500">
                {!selectedMember && !selectedTemplate && "Choose a member and template to get started"}
                {selectedMember && !selectedTemplate && "Now select a template to use"}
                {!selectedMember && selectedTemplate && "Now select a member to send to"}
              </div>
            </div>
          )}

          {/* Vault Status Panel */}
          {lastVaultUrl && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex items-start">
                <CloudIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900">Document Vault</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Your letter has been securely stored in the Document Vault. Click "View in Vault" to access the PDF.
                  </p>
                  <div className="mt-2 text-xs text-blue-600 font-mono break-all">
                    {lastVaultUrl}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
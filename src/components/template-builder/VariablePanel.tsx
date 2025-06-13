'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { useDraggable } from '@dnd-kit/core';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ReusableComponent } from '@/types/component';

type Variable = {
  id: string;
  name: string;
  type: string;
  description: string;
};

const variableGroups: { name: string; variables: Variable[] }[] = [
  {
    name: 'Member',
    variables: [
      { id: 'member-name', name: 'MemberName', type: 'Text', description: 'Full name of the member' },
      { id: 'member-id', name: 'MemberID', type: 'ID', description: 'Unique member identifier' },
      { id: 'member-dob', name: 'DateOfBirth', type: 'Date', description: 'Member date of birth' },
    ],
  },
  {
    name: 'Provider',
    variables: [
      { id: 'provider-name', name: 'ProviderName', type: 'Text', description: 'Healthcare provider name' },
      { id: 'provider-npi', name: 'ProviderNPI', type: 'ID', description: 'National Provider Identifier' },
      { id: 'provider-specialty', name: 'Specialty', type: 'Text', description: 'Provider specialty' },
    ],
  },
];

function DraggableItem({ item }: { item: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center justify-between py-2 px-3 bg-white rounded-md shadow-sm hover:bg-gray-50 cursor-grab active:cursor-grabbing border"
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-700 font-mono truncate">
          {item.type === 'Text' || item.type === 'ID' || item.type === 'Date'
            ? `{{${item.name}}}`
            : item.name}
        </span>
      </div>
      <span className="text-xs text-gray-500 ml-2">{item.type}</span>
    </div>
  );
}

export default function VariablePanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'variables' | 'components'>('variables');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(variableGroups.map(g => g.name)));
  const [components, setComponents] = useState<ReusableComponent[]>([]);

  useEffect(() => {
    const loadComponents = async () => {
      const snapshot = await getDocs(collection(db, 'reusableComponents'));
      const items: ReusableComponent[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<ReusableComponent, 'id'>),
      }));
      setComponents(items);
    };

    loadComponents();
  }, []);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) newExpanded.delete(groupName);
    else newExpanded.add(groupName);
    setExpandedGroups(newExpanded);
  };

  const filteredVariables = variableGroups
    .map(group => ({
      ...group,
      variables: group.variables.filter(
        variable =>
          variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          variable.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter(group => group.variables.length > 0);

  const filteredComponents = components.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-4 border-b px-4 py-3">
        <button
          onClick={() => setActiveTab('variables')}
          className={`text-sm font-medium ${
            activeTab === 'variables' ? 'text-[#8a7fae] border-b-2 border-[#8a7fae]' : 'text-zinc-500'
          }`}
        >
          Variables
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={`text-sm font-medium ${
            activeTab === 'components' ? 'text-[#8a7fae] border-b-2 border-[#8a7fae]' : 'text-zinc-500'
          }`}
        >
          Components
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="search"
            className="block w-full rounded-md border border-zinc-300 py-1.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#8a7fae] text-sm"
            placeholder={`Search ${activeTab === 'variables' ? 'variables' : 'components'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'variables' &&
          filteredVariables.map(group => (
            <div key={group.name} className="border-b pb-2">
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex justify-between items-center text-sm font-medium text-gray-900"
              >
                {group.name}
                {expandedGroups.has(group.name) ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {expandedGroups.has(group.name) && (
                <div className="mt-2 space-y-2">
                  {group.variables.map(variable => (
                    <DraggableItem key={variable.id} item={variable} />
                  ))}
                </div>
              )}
            </div>
          ))}

        {activeTab === 'components' && (
          <div className="space-y-2">
            {filteredComponents.length === 0 ? (
              <p className="text-sm text-gray-500">No components found.</p>
            ) : (
              filteredComponents.map((comp) => (
                <DraggableItem key={comp.id} item={{ ...comp, type: comp.type }} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t text-xs text-gray-500 text-center">
        Drag {activeTab === 'variables' ? 'variables' : 'components'} into your template
      </div>
    </div>
  );
}

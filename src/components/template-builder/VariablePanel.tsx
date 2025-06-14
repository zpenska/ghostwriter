'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { useDraggable } from '@dnd-kit/core';

// Sample variable data - replace with your actual data
const variableGroups = [
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
  {
    name: 'Service',
    variables: [
      { id: 'service-date', name: 'ServiceDate', type: 'Date', description: 'Date of service' },
      { id: 'service-code', name: 'ServiceCode', type: 'Code', description: 'Service procedure code' },
      { id: 'diagnosis-code', name: 'DiagnosisCode', type: 'Code', description: 'Diagnosis code' },
    ],
  },
];

function DraggableVariable({ variable }: { variable: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: variable.id,
    data: variable,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md shadow-sm hover:bg-white hover:shadow cursor-grab active:cursor-grabbing group"
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-700 font-mono">
          {`{{${variable.name}}}`}
        </span>
      </div>
      <span className="text-xs text-gray-500 ml-2">
        {variable.type}
      </span>
    </div>
  );
}

export default function VariablePanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(variableGroups.map(g => g.name))
  );

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const filteredGroups = variableGroups.map(group => ({
    ...group,
    variables: group.variables.filter(
      variable =>
        variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(group => group.variables.length > 0);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Variables</h2>
        
        {/* Search */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="search"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Variable Groups */}
      <div className="flex-1 overflow-y-auto">
        {filteredGroups.map((group) => (
          <div key={group.name} className="border-b">
            <button
              onClick={() => toggleGroup(group.name)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-900">{group.name}</span>
              {expandedGroups.has(group.name) ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedGroups.has(group.name) && (
              <div className="px-4 pb-3 space-y-2">
                {group.variables.map((variable) => (
                  <DraggableVariable key={variable.id} variable={variable} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 border-t">
        <p className="text-xs text-gray-600">
          Drag variables into your template to create dynamic content
        </p>
      </div>
    </div>
  );
}
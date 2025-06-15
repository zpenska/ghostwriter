'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { useDraggable } from '@dnd-kit/core';

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

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

// Sample component data
const componentGroups = [
  {
    name: 'Headers',
    components: [
      { id: 'letterhead', name: 'Letterhead', type: 'Header', description: 'Company letterhead with logo' },
      { id: 'date-header', name: 'Date Header', type: 'Header', description: 'Current date header' },
    ],
  },
  {
    name: 'Footers',
    components: [
      { id: 'signature', name: 'Signature Block', type: 'Footer', description: 'Standard signature block' },
      { id: 'contact-info', name: 'Contact Info', type: 'Footer', description: 'Company contact information' },
    ],
  },
  {
    name: 'Content Blocks',
    components: [
      { id: 'approval-paragraph', name: 'Approval Paragraph', type: 'Content', description: 'Standard approval language' },
      { id: 'denial-paragraph', name: 'Denial Paragraph', type: 'Content', description: 'Standard denial language' },
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
      className="flex items-center justify-between py-2 px-3 bg-white rounded-md border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 cursor-grab active:cursor-grabbing group transition-colors"
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm text-zinc-900 font-mono">
          {`{{${variable.name}}}`}
        </span>
      </div>
      <span className="text-xs text-zinc-500 ml-2">
        {variable.type}
      </span>
    </div>
  );
}

function DraggableComponent({ component }: { component: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: component.id,
    data: component,
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
      className="flex items-center justify-between py-2 px-3 bg-white rounded-md border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 cursor-grab active:cursor-grabbing group transition-colors"
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm text-zinc-900 font-medium">
          {component.name}
        </span>
        <p className="text-xs text-zinc-500 truncate">{component.description}</p>
      </div>
      <span className="text-xs text-zinc-500 ml-2">
        {component.type}
      </span>
    </div>
  );
}

export default function VariablePanel() {
  const [activeTab, setActiveTab] = useState('Variables');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set([...variableGroups.map(g => g.name), ...componentGroups.map(g => g.name)])
  );

  const tabs = ['Variables', 'Components'];

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const filteredVariableGroups = variableGroups.map(group => ({
    ...group,
    variables: group.variables.filter(
      variable =>
        variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(group => group.variables.length > 0);

  const filteredComponentGroups = componentGroups.map(group => ({
    ...group,
    components: group.components.filter(
      component =>
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(group => group.components.length > 0);

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={classNames(
                tab === activeTab
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300',
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors'
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-2 border-b border-zinc-200">
        <h2 className="text-base font-semibold text-zinc-900 mb-2">{activeTab}</h2>
        
        {/* Search */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400" aria-hidden="true" />
          </div>
          <input
            type="search"
            className="block w-full rounded-md border border-zinc-300 py-1.5 pl-10 pr-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 sm:text-sm sm:leading-6"
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'Variables' && (
          <>
            {filteredVariableGroups.map((group) => (
              <div key={group.name} className="border-b border-zinc-200">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full px-2 py-2 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-sm font-medium text-zinc-900">{group.name}</span>
                  {expandedGroups.has(group.name) ? (
                    <ChevronDownIcon className="h-5 w-5 text-zinc-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-zinc-400" />
                  )}
                </button>
                
                {expandedGroups.has(group.name) && (
                  <div className="px-2 pb-2 space-y-2">
                    {group.variables.map((variable) => (
                      <DraggableVariable key={variable.id} variable={variable} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {activeTab === 'Components' && (
          <>
            {filteredComponentGroups.map((group) => (
              <div key={group.name} className="border-b border-zinc-200">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full px-2 py-2 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-sm font-medium text-zinc-900">{group.name}</span>
                  {expandedGroups.has(group.name) ? (
                    <ChevronDownIcon className="h-5 w-5 text-zinc-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-zinc-400" />
                  )}
                </button>
                
                {expandedGroups.has(group.name) && (
                  <div className="px-2 pb-2 space-y-2">
                    {group.components.map((component) => (
                      <DraggableComponent key={component.id} component={component} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="p-2 bg-zinc-50 border-t border-zinc-200">
        <p className="text-xs text-zinc-600">
          Drag {activeTab.toLowerCase()} into your template to create dynamic content
        </p>
      </div>
    </div>
  );
}
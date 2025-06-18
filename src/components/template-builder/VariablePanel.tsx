'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { 
  DocumentTextIcon,
  ArchiveBoxIcon, 
  PencilIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useDraggable } from '@dnd-kit/core';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { classNames } from '@/lib/utils/cn';

// Component interface
interface Component {
  id?: string;
  name: string;
  description?: string;
  content: string;
  category: string;
  tags?: string[];
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// Keep existing variable data structure
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

// Keep existing DraggableVariable component with consistent width
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
      className="flex items-center justify-between py-2 px-3 mx-2 bg-white rounded-md border border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow cursor-grab active:cursor-grabbing group transition-all"
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm text-zinc-700 font-mono">
          {`{{${variable.name}}}`}
        </span>
      </div>
      <span className="text-xs text-zinc-500 ml-2">
        {variable.type}
      </span>
    </div>
  );
}

// Updated DraggableBlock component - removed icon and made narrower
function DraggableBlock({ block }: { block: Component }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `component-${block.id}`,
    data: {
      id: block.id,
      name: block.name,
      content: block.content,
      type: 'component', // This is crucial for your template builder
    },
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
      className="flex items-center justify-between py-2 px-3 mx-2 bg-white rounded-md border border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow cursor-grab active:cursor-grabbing group transition-all"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">{block.name}</p>
        {block.description && (
          <p className="text-xs text-zinc-600 truncate">{block.description}</p>
        )}
      </div>
      <div className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
        Drag
      </div>
    </div>
  );
}

export default function VariablePanel() {
  const [activeTab, setActiveTab] = useState<'variables' | 'blocks'>('variables');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(variableGroups.map(g => g.name))
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['header', 'footer', 'signature', 'address', 'contact', 'disclaimer', 'custom'])
  );
  const [blocks, setBlocks] = useState<Component[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Updated block categories with Heroicons
  const blockCategories = [
    { 
      id: 'header', 
      name: 'Headers', 
      icon: <DocumentTextIcon className="h-4 w-4 text-zinc-600" />
    },
    { 
      id: 'footer', 
      name: 'Footers', 
      icon: <ArchiveBoxIcon className="h-4 w-4 text-zinc-600" />
    },
    { 
      id: 'signature', 
      name: 'Signatures', 
      icon: <PencilIcon className="h-4 w-4 text-zinc-600" />
    },
    { 
      id: 'address', 
      name: 'Address Blocks', 
      icon: <MapPinIcon className="h-4 w-4 text-zinc-600" />
    },
    { 
      id: 'contact', 
      name: 'Contact Info', 
      icon: <MapPinIcon className="h-4 w-4 text-zinc-600" />
    },
    { 
      id: 'disclaimer', 
      name: 'Disclaimers', 
      icon: <ExclamationTriangleIcon className="h-4 w-4 text-zinc-600" />
    },
    { 
      id: 'custom', 
      name: 'Custom Blocks', 
      icon: <WrenchScrewdriverIcon className="h-4 w-4 text-zinc-600" />
    },
  ];

  // Load blocks when switching to blocks tab
  useEffect(() => {
    if (activeTab === 'blocks') {
      loadBlocks();
    }
  }, [activeTab]);

  const loadBlocks = async () => {
    try {
      setLoadingBlocks(true);
      console.log('🔍 Loading blocks...');
      
      const blocksRef = collection(db, 'blocks');
      const querySnapshot = await getDocs(blocksRef);
      
      const blocksData: Component[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        blocksData.push({
          id: doc.id,
          ...data
        } as Component);
      });
      
      console.log('✅ Blocks loaded:', blocksData.length);
      setBlocks(blocksData);
      
    } catch (error) {
      console.error('❌ Error loading blocks:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Filter variables based on search
  const filteredGroups = variableGroups.map(group => ({
    ...group,
    variables: group.variables.filter(
      variable =>
        variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(group => group.variables.length > 0);

  // Group blocks by category and filter
  const groupedBlocks = blockCategories.map(category => {
    const categoryBlocks = blocks.filter(block => 
      block.category === category.id &&
      (block.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       block.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return {
      ...category,
      blocks: categoryBlocks
    };
  }).filter(category => category.blocks.length > 0);

  return (
    <div className="h-full flex flex-col min-w-80 w-80">
      {/* Compact Header - Removed main heading and reduced padding */}
      <div className="p-3 border-b border-zinc-200">
        {/* Tabs - Fixed for better visual centering */}
        <div className="flex border-b border-zinc-200 -mb-3 justify-center">
          <div className="flex space-x-12">
            <button
              onClick={() => setActiveTab('variables')}
              className={classNames(
                'py-2 text-sm font-medium transition-colors',
                activeTab === 'variables'
                  ? 'text-zinc-900 border-b-2 border-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900'
              )}
            >
              Variables
            </button>
            <button
              onClick={() => setActiveTab('blocks')}
              className={classNames(
                'py-2 text-sm font-medium transition-colors',
                activeTab === 'blocks'
                  ? 'text-zinc-900 border-b-2 border-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900'
              )}
            >
              Blocks
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mt-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-4 w-4 text-zinc-400" aria-hidden="true" />
          </div>
          <input
            type="search"
            className="block w-full rounded-md border-zinc-300 py-1.5 pl-9 pr-3 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'variables' ? (
          /* Variables Tab - Keep existing functionality */
          <>
            {filteredGroups.map((group) => (
              <div key={group.name} className="border-b border-zinc-200">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-sm font-medium text-zinc-900">{group.name}</span>
                  {expandedGroups.has(group.name) ? (
                    <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
                  )}
                </button>
                
                {expandedGroups.has(group.name) && (
                  <div className="px-3 pb-3 space-y-2">
                    {group.variables.map((variable) => (
                      <DraggableVariable key={variable.id} variable={variable} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          /* Blocks Tab - Nested category view with smaller collapse buttons */
          <div className="py-1">
            {loadingBlocks ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 mx-auto"></div>
                <p className="text-sm text-zinc-500 mt-2">Loading blocks...</p>
              </div>
            ) : groupedBlocks.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-500 mb-2">
                  {blocks.length === 0 ? 'No blocks found' : 'No matching blocks'}
                </p>
                <p className="text-xs text-zinc-400">
                  {blocks.length === 0 ? 'Create blocks to see them here' : 'Try a different search term'}
                </p>
              </div>
            ) : (
              <>
                {groupedBlocks.map((category) => (
                  <div key={category.id} className="border-b border-zinc-200">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        {category.icon}
                        <span className="text-sm font-medium text-zinc-900">{category.name}</span>
                        <span className="text-xs text-zinc-500">({category.blocks.length})</span>
                      </div>
                      {expandedCategories.has(category.id) ? (
                        <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
                      )}
                    </button>
                    
                    {expandedCategories.has(category.id) && (
                      <div className="pb-3 space-y-2">
                        {category.blocks.map((block) => (
                          <DraggableBlock key={block.id} block={block} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-3 bg-zinc-50 border-t border-zinc-200">
        <p className="text-xs text-zinc-600">
          Drag {activeTab === 'variables' ? 'variables' : 'blocks'} into your template to {activeTab === 'variables' ? 'create dynamic content' : 'insert reusable blocks'}
        </p>
      </div>
    </div>
  );
}
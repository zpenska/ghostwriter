'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { 
  DocumentTextIcon,
  ArchiveBoxIcon, 
  PencilIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon
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

// Variable interface for Firestore variables
interface Variable {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  type: string;
  category: string;
  group: string;
  path?: string;
  required?: boolean;
  format?: string;
  example?: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// Variable group interface
interface VariableGroup {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  variables: Variable[];
}

// DraggableVariable component with enhanced styling
function DraggableVariable({ variable }: { variable: Variable }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: variable.id,
    data: {
      id: variable.id,
      name: variable.name,
      displayName: variable.displayName || variable.name,
      type: variable.type,
      description: variable.description,
      category: variable.category,
      group: variable.group,
      format: variable.format,
      example: variable.example,
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
      className="flex items-center justify-between py-2 px-3 mx-2 bg-white rounded-md border border-zinc-200 shadow-sm hover:border-blue-300 hover:shadow-md cursor-grab active:cursor-grabbing group transition-all duration-200"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-700 font-mono">
            {`{{${variable.displayName || variable.name}}}`}
          </span>
          {variable.required && (
            <span className="text-red-500 text-xs">*</span>
          )}
        </div>
        {variable.description && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{variable.description}</p>
        )}
        {variable.example && (
          <p className="text-xs text-blue-600 mt-0.5 truncate">
            Example: {variable.example}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end space-y-1">
        {variable.type && variable.type.toLowerCase() !== 'text' && (
          <span className="text-xs text-zinc-500 uppercase tracking-wide">
            {variable.type}
          </span>
        )}
        <div className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Drag
        </div>
      </div>
    </div>
  );
}

// DraggableBlock component with cleaner styling
function DraggableBlock({ block }: { block: Component }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `component-${block.id}`,
    data: {
      id: block.id,
      name: block.name,
      // Clean up the content by removing any img tags or unwanted HTML
      content: block.content?.replace(/<img[^>]*>/gi, '').trim() || '',
      type: 'component',
      description: block.description,
      category: block.category,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  console.log('🎯 Block drag data:', {
    id: block.id,
    name: block.name,
    content: block.content?.replace(/<img[^>]*>/gi, '').trim() || '',
    type: 'component',
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center justify-between py-2 px-3 mx-2 bg-white rounded-md border border-zinc-200 shadow-sm hover:border-emerald-300 hover:shadow-md cursor-grab active:cursor-grabbing group transition-all duration-200"
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['header', 'footer', 'signature', 'address', 'contact', 'disclaimer', 'custom'])
  );
  const [blocks, setBlocks] = useState<Component[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingVariables, setLoadingVariables] = useState(false);
  const [variableGroups, setVariableGroups] = useState<VariableGroup[]>([]);

  // Enhanced block categories with better icons
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

  // Load variables from Firestore on component mount
  useEffect(() => {
    loadVariables();
  }, []);

  // Load blocks when switching to blocks tab
  useEffect(() => {
    if (activeTab === 'blocks') {
      loadBlocks();
    }
  }, [activeTab]);

  // Group variables when variables data changes
  useEffect(() => {
    if (variables.length > 0) {
      groupVariables();
    }
  }, [variables]);

  const loadVariables = async () => {
    try {
      setLoadingVariables(true);
      console.log('🔍 Loading variables from Firestore...');
      
      const variablesRef = collection(db, 'casper-variables');
      const querySnapshot = await getDocs(variablesRef);
      
      const variablesData: Variable[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive !== false) { // Include active variables and those without isActive field
          variablesData.push({
            id: doc.id,
            name: data.name || doc.id,
            displayName: data.displayName || data.name || doc.id,
            description: data.description || '',
            type: data.type || 'text',
            category: data.category || 'general',
            group: data.group || 'general',
            path: data.path,
            required: data.required || false,
            format: data.format,
            example: data.example,
            isActive: data.isActive !== false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Variable);
        }
      });
      
      console.log('✅ Variables loaded:', variablesData.length);
      setVariables(variablesData);
      
    } catch (error) {
      console.error('❌ Error loading variables:', error);
      // Fallback to sample data if Firestore fails
      setVariables([
        {
          id: 'member-name',
          name: 'memberName',
          displayName: 'Member Name',
          description: 'Full name of the member',
          type: 'text',
          category: 'member',
          group: 'member',
          required: true,
          example: 'John Doe',
          isActive: true,
        },
        {
          id: 'member-id',
          name: 'memberId',
          displayName: 'Member ID',
          description: 'Unique member identifier',
          type: 'id',
          category: 'member',
          group: 'member',
          required: true,
          example: 'M123456789',
          isActive: true,
        },
      ]);
    } finally {
      setLoadingVariables(false);
    }
  };

  const groupVariables = () => {
    // Group variables by their group field
    const groupedData: { [key: string]: Variable[] } = {};
    
    variables.forEach(variable => {
      const groupKey = variable.group || 'general';
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = [];
      }
      groupedData[groupKey].push(variable);
    });

    // Create VariableGroup objects with appropriate icons
    const groups: VariableGroup[] = Object.keys(groupedData).map(groupKey => {
      let icon = <WrenchScrewdriverIcon className="h-4 w-4 text-zinc-600" />; // default
      let displayName = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);

      // Assign icons based on group type
      switch (groupKey.toLowerCase()) {
        case 'member':
        case 'patient':
          icon = <UserIcon className="h-4 w-4 text-zinc-600" />;
          displayName = 'Member Information';
          break;
        case 'provider':
        case 'physician':
        case 'doctor':
          icon = <BuildingOfficeIcon className="h-4 w-4 text-zinc-600" />;
          displayName = 'Provider Information';
          break;
        case 'service':
        case 'claim':
        case 'request':
          icon = <ClipboardDocumentListIcon className="h-4 w-4 text-zinc-600" />;
          displayName = 'Service Information';
          break;
        case 'enrollment':
          icon = <DocumentTextIcon className="h-4 w-4 text-zinc-600" />;
          displayName = 'Enrollment Details';
          break;
        case 'general':
        default:
          displayName = 'General Variables';
          break;
      }

      return {
        name: groupKey,
        displayName,
        icon,
        variables: groupedData[groupKey].sort((a, b) => 
          (a.displayName || a.name).localeCompare(b.displayName || b.name)
        ),
      };
    });

    setVariableGroups(groups.sort((a, b) => a.displayName.localeCompare(b.displayName)));
    
    // Auto-expand all groups initially
    setExpandedGroups(new Set(groups.map(g => g.name)));
  };

  const loadBlocks = async () => {
    try {
      setLoadingBlocks(true);
      console.log('🔍 Loading blocks...');
      
      const blocksRef = collection(db, 'blocks');
      const querySnapshot = await getDocs(blocksRef);
      
      const blocksData: Component[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive !== false) { // Include active blocks
          blocksData.push({
            id: doc.id,
            name: data.name || doc.id,
            description: data.description || '',
            // Clean up content - remove images and extra whitespace
            content: data.content?.replace(/<img[^>]*>/gi, '').replace(/\s+/g, ' ').trim() || '',
            category: data.category || 'custom',
            tags: data.tags || [],
            isActive: data.isActive !== false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Component);
        }
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
        (variable.displayName || variable.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.type.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Header */}
      <div className="p-3 border-b border-zinc-200">
        {/* Tabs */}
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
              {variables.length > 0 && (
                <span className="ml-1 text-xs text-zinc-500">({variables.length})</span>
              )}
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
              {blocks.length > 0 && (
                <span className="ml-1 text-xs text-zinc-500">({blocks.length})</span>
              )}
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
          <>
            {loadingVariables ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 mx-auto"></div>
                <p className="text-sm text-zinc-500 mt-2">Loading variables...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <UserIcon className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-500 mb-2">
                  {variables.length === 0 ? 'No variables found' : 'No matching variables'}
                </p>
                <p className="text-xs text-zinc-400">
                  {variables.length === 0 
                    ? 'Check your Firestore casper-variables collection' 
                    : 'Try a different search term'
                  }
                </p>
              </div>
            ) : (
              <>
                {filteredGroups.map((group) => (
                  <div key={group.name} className="border-b border-zinc-200">
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        {group.icon}
                        <span className="text-sm font-medium text-zinc-900">{group.displayName}</span>
                        <span className="text-xs text-zinc-500">({group.variables.length})</span>
                      </div>
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
            )}
          </>
        ) : (
          /* Blocks Tab */
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
        {activeTab === 'variables' && (
          <p className="text-xs text-zinc-500 mt-1">
            Variables marked with * are required fields
          </p>
        )}
      </div>
    </div>
  );
}
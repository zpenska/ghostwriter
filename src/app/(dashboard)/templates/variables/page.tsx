// src/app/(dashboard)/templates/variables/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  VariableIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { 
  VariableIcon as VariableIconSolid,
  CheckCircleIcon,
  XCircleIcon,
  FolderIcon as FolderIconSolid,
} from '@heroicons/react/24/solid';
import { classNames } from '@/lib/utils/cn';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface Variable {
  id?: string;
  name: string;
  description?: string;
  variable: string; // The actual variable syntax like {{addressLine2}}
  dataType: string;
  group: string; // Group name that this variable belongs to
  defaultValue?: string;
  formatOptions?: {
    dateFormat?: string;
    currencyCode?: string;
    addressFormat?: string;
    phoneFormat?: string;
    numberFormat?: string;
    textCase?: string;
  };
  tags?: string[];
  isActive: boolean;
  isRequired?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface VariableGroup {
  id?: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export default function VariablesPage() {
  const router = useRouter();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [variableGroups, setVariableGroups] = useState<VariableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importJson, setImportJson] = useState('');

  // Variable form state
  const [variableForm, setVariableForm] = useState({
    name: '',
    description: '',
    variable: '',
    dataType: 'string',
    group: '',
    defaultValue: '',
    formatOptions: {
      dateFormat: 'MM/DD/YYYY',
      currencyCode: 'USD',
      addressFormat: 'standard',
      phoneFormat: '(XXX) XXX-XXXX',
      numberFormat: '0,0',
      textCase: 'default'
    } as {
      dateFormat?: string;
      currencyCode?: string;
      addressFormat?: string;
      phoneFormat?: string;
      numberFormat?: string;
      textCase?: string;
    },
    tags: [] as string[],
    isActive: true,
    isRequired: false
  });

  const dataTypes = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'currency', label: 'Currency' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'email', label: 'Email' },
    { value: 'address', label: 'Address' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'list', label: 'List/Array' }
  ];

  const groupColors = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-50 text-blue-800 ring-blue-600/20' },
    { value: 'green', label: 'Green', class: 'bg-green-50 text-green-800 ring-green-600/20' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-50 text-purple-800 ring-purple-600/20' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-50 text-indigo-800 ring-indigo-600/20' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-50 text-pink-800 ring-pink-600/20' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-50 text-orange-800 ring-orange-600/20' },
    { value: 'gray', label: 'Gray', class: 'bg-gray-50 text-gray-800 ring-gray-600/20' }
  ];

  // Get groups with variable counts
  const groupsWithCounts = [
    { 
      id: 'all', 
      name: 'All', 
      count: variables.length, 
      color: 'gray',
      isActive: true 
    },
    ...variableGroups.map(group => ({
      ...group,
      count: variables.filter(v => v.group === group.name).length
    }))
  ];

  useEffect(() => {
    loadVariables();
  }, []);

  useEffect(() => {
    if (editingVariable) {
      setVariableForm({
        name: editingVariable.name,
        description: editingVariable.description || '',
        variable: editingVariable.variable,
        dataType: editingVariable.dataType,
        group: editingVariable.group,
        defaultValue: editingVariable.defaultValue || '',
        formatOptions: {
          dateFormat: editingVariable.formatOptions?.dateFormat || 'MM/DD/YYYY',
          currencyCode: editingVariable.formatOptions?.currencyCode || 'USD',
          addressFormat: editingVariable.formatOptions?.addressFormat || 'standard',
          phoneFormat: editingVariable.formatOptions?.phoneFormat || '(XXX) XXX-XXXX',
          numberFormat: editingVariable.formatOptions?.numberFormat || '0,0',
          textCase: editingVariable.formatOptions?.textCase || 'default'
        },
        tags: editingVariable.tags || [],
        isActive: editingVariable.isActive,
        isRequired: editingVariable.isRequired || false
      });
    } else {
      setVariableForm({
        name: '',
        description: '',
        variable: '',
        dataType: 'string',
        group: variableGroups.length > 0 ? variableGroups[0].name || '' : '',
        defaultValue: '',
        formatOptions: {
          dateFormat: 'MM/DD/YYYY',
          currencyCode: 'USD',
          addressFormat: 'standard',
          phoneFormat: '(XXX) XXX-XXXX',
          numberFormat: '0,0',
          textCase: 'default'
        },
        tags: [],
        isActive: true,
        isRequired: false
      });
    }
  }, [editingVariable, variableGroups]);

  // Auto-generate variable syntax when name changes
  useEffect(() => {
    if (variableForm.name && !editingVariable) {
      const variableSyntax = `{{${variableForm.name.replace(/\s+/g, '')}}}`;
      setVariableForm(prev => ({ ...prev, variable: variableSyntax }));
    }
  }, [variableForm.name, editingVariable]);

  const loadVariables = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'casper-variables'));
      
      const variablesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: doc.id, // Use document ID as name
          description: data.description || '',
          variable: data.variable || `{{${doc.id}}}`,
          dataType: 'string', // Default since not in existing data
          group: data.group || 'Uncategorized',
          defaultValue: '',
          formatOptions: {},
          tags: [],
          isActive: true,
          isRequired: false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Variable;
      });
      
      setVariables(variablesData);
      
      // Auto-create variable groups from existing group names
      const uniqueGroups = Array.from(new Set(variablesData.map(v => v.group)));
      const autoGroups = uniqueGroups.map((groupName, index) => ({
        id: groupName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: groupName,
        description: `Auto-generated group for ${groupName}`,
        color: groupColors[index % groupColors.length].value,
        isActive: true
      }));
      
      setVariableGroups(autoGroups);
    } catch (error) {
      console.error('Error loading variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVariable = async () => {
    if (!variableForm.name.trim() || !variableForm.variable.trim()) return;

    setIsSubmitting(true);
    try {
      const variableData = {
        description: variableForm.description,
        variable: variableForm.variable,
        group: variableForm.group,
        // Store additional metadata that doesn't exist in current structure
        dataType: variableForm.dataType,
        defaultValue: variableForm.defaultValue,
        formatOptions: variableForm.formatOptions,
        tags: variableForm.tags,
        isActive: variableForm.isActive,
        isRequired: variableForm.isRequired,
        updatedAt: serverTimestamp()
      };

      if (editingVariable?.id) {
        await updateDoc(doc(db, 'casper-variables', editingVariable.id), variableData);
      } else {
        // Use the variable name as the document ID to match existing pattern
        const docId = variableForm.name.replace(/[^a-zA-Z0-9]/g, '');
        await setDoc(doc(db, 'casper-variables', docId), {
          ...variableData,
          createdAt: serverTimestamp()
        });
      }

      await loadVariables();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving variable:', error);
      alert('Failed to save variable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportVariables = async () => {
    if (!importJson.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedData = JSON.parse(importJson);
      const variablesToImport = Array.isArray(parsedData) ? parsedData : [parsedData];

      for (const variable of variablesToImport) {
        const docId = variable.name || variable.id || `imported-${Date.now()}`;
        await setDoc(doc(db, 'casper-variables', docId), {
          description: variable.description || '',
          variable: variable.variable || `{{${docId}}}`,
          group: variable.group || 'Uncategorized',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      await loadVariables();
      setShowImportModal(false);
      setImportJson('');
    } catch (error) {
      console.error('Error importing variables:', error);
      alert('Failed to import variables. Please check your JSON format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingVariable(null);
  };

  const handleEditVariable = (variable: Variable) => {
    setEditingVariable(variable);
    setShowCreateModal(true);
  };

  const handleDeleteVariable = async (variableId: string) => {
    if (confirm('Are you sure you want to delete this variable?')) {
      try {
        await deleteDoc(doc(db, 'casper-variables', variableId));
        await loadVariables();
      } catch (error) {
        console.error('Error deleting variable:', error);
        alert('Failed to delete variable');
      }
    }
  };

  const handleDuplicateVariable = async (variable: Variable) => {
    try {
      const duplicatedVariable = {
        description: variable.description,
        variable: `{{${variable.name}Copy}}`,
        group: variable.group,
        dataType: variable.dataType,
        defaultValue: variable.defaultValue,
        formatOptions: variable.formatOptions,
        tags: variable.tags,
        isActive: variable.isActive,
        isRequired: variable.isRequired,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const newDocId = `${variable.id}Copy`;
      await setDoc(doc(db, 'casper-variables', newDocId), duplicatedVariable);
      
      await loadVariables();
    } catch (error) {
      console.error('Error duplicating variable:', error);
      alert('Failed to duplicate variable');
    }
  };

  // Filter variables based on search and group
  const filteredVariables = variables.filter(variable => {
    const matchesSearch = variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variable.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variable.variable.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variable.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGroup = selectedGroup === 'all' || variable.group === selectedGroup || 
                        variable.group === variableGroups.find(g => g.id === selectedGroup)?.name;
    
    return matchesSearch && matchesGroup;
  });

  const getGroupColor = (groupName: string) => {
    if (groupName === 'all') return 'bg-gray-50 text-gray-800 ring-gray-600/20';
    
    const group = variableGroups.find(g => g.name === groupName);
    const colorConfig = groupColors.find(c => c.value === group?.color);
    return colorConfig?.class || 'bg-gray-50 text-gray-800 ring-gray-600/20';
  };

  const getGroupName = (groupId: string) => {
    if (groupId === 'all') return 'All';
    // For existing data, group is stored as the name itself
    return groupId;
  };

  const getDataTypeIcon = (dataType: string) => {
    const icons = {
      'string': DocumentTextIcon,
      'number': VariableIcon,
      'currency': CurrencyDollarIcon,
      'date': CalendarIcon,
      'datetime': ClockIcon,
      'phone': PhoneIcon,
      'email': DocumentTextIcon,
      'address': MapPinIcon,
      'boolean': CheckCircleIcon,
      'list': DocumentTextIcon
    };
    return icons[dataType as keyof typeof icons] || DocumentTextIcon;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return 'Unknown';
    }
  };

  const getFormatDisplay = (variable: Variable) => {
    const { dataType, formatOptions } = variable;
    
    switch (dataType) {
      case 'date':
        return formatOptions?.dateFormat || 'MM/DD/YYYY';
      case 'currency':
        return formatOptions?.currencyCode || 'USD';
      case 'phone':
        return formatOptions?.phoneFormat || '(XXX) XXX-XXXX';
      case 'address':
        return formatOptions?.addressFormat || 'Standard';
      case 'number':
        return formatOptions?.numberFormat || '0,0';
      case 'string':
        return formatOptions?.textCase || 'Default';
      default:
        return 'Default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading variables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <button
                onClick={() => router.push('/templates')}
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Templates
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Variables</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Variables & Formatting
            </h1>
            <p className="mt-2 text-base text-gray-600">
              Manage template variables organized by groups with formatting options for consistent data presentation
            </p>
          </div>
          <div className="mt-6 flex items-center gap-3 md:ml-4 md:mt-0">
            {/* Search */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-64 rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 sm:leading-6"
                placeholder="Search variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors"
            >
              <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
              Import JSON
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              New Variable
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Groups Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-6">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">Variable Groups</h3>
              </div>
              <nav className="p-2">
                <div className="space-y-1">
                  {groupsWithCounts.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group.id === 'all' ? 'all' : group.name)}
                      className={classNames(
                        'group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        (selectedGroup === group.id || (selectedGroup === group.name && group.id !== 'all'))
                          ? 'bg-zinc-100 text-zinc-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <span className="truncate">{group.name}</span>
                      <span className={classNames(
                        'ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                        (selectedGroup === group.id || (selectedGroup === group.name && group.id !== 'all'))
                          ? 'bg-zinc-200 text-zinc-700' 
                          : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                      )}>
                        {group.count}
                      </span>
                    </button>
                  ))}
                </div>
              </nav>
            </div>
          </div>

          {/* Variables Grid */}
          <div className="lg:col-span-4">
            {filteredVariables.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto h-20 w-20 text-gray-300 mb-4">
                  <VariableIconSolid className="h-full w-full" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No variables found</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                  {searchTerm || selectedGroup !== 'all' 
                    ? 'Try adjusting your search or filter to see more results'
                    : 'Get started by creating your first template variable'
                  }
                </p>
                {(!searchTerm && selectedGroup === 'all') && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors"
                  >
                    <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                    Create your first variable
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVariables.map((variable) => {
                  const IconComponent = getDataTypeIcon(variable.dataType);
                  
                  return (
                    <div
                      key={variable.id}
                      className="group relative bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                    >
                      {/* Variable Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={classNames(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-xs font-medium',
                            getGroupColor(variable.group)
                          )}>
                            <IconComponent className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate leading-5">
                              {variable.name}
                            </h3>
                            <div className="mt-1">
                              <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                {variable.variable}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className={classNames(
                                'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                                getGroupColor(variable.group)
                              )}>
                                {getGroupName(variable.group)}
                              </span>
                              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100">
                                {variable.dataType}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status & Actions */}
                        <div className="flex items-center gap-2 ml-2">
                          <div className="flex items-center">
                            {variable.isActive ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" aria-hidden="true" />
                            ) : (
                              <XCircleIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            )}
                          </div>
                          
                          <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2">
                              <span className="sr-only">Open options</span>
                              <EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />
                            </Menu.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute right-0 z-10 mt-1 w-44 origin-top-right bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none rounded-md">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleEditVariable(variable)}
                                      className={classNames(
                                        active ? 'bg-gray-50' : '',
                                        'flex w-full items-center px-3 py-2 text-sm text-gray-700'
                                      )}
                                    >
                                      <PencilIcon className="mr-3 h-4 w-4" />
                                      Edit
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDuplicateVariable(variable)}
                                      className={classNames(
                                        active ? 'bg-gray-50' : '',
                                        'flex w-full items-center px-3 py-2 text-sm text-gray-700'
                                      )}
                                    >
                                      <DocumentDuplicateIcon className="mr-3 h-4 w-4" />
                                      Duplicate
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDeleteVariable(variable.id!)}
                                      className={classNames(
                                        active ? 'bg-red-50 text-red-700' : 'text-red-600',
                                        'flex w-full items-center px-3 py-2 text-sm'
                                      )}
                                    >
                                      <TrashIcon className="mr-3 h-4 w-4" />
                                      Delete
                                    </button>
                                  )}
                                </Menu.Item>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </div>
                      </div>

                      {/* Description */}
                      {variable.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          {variable.description}
                        </p>
                      )}

                      {/* Format Display */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Cog6ToothIcon className="h-3 w-3" />
                          <span>Format: {getFormatDisplay(variable)}</span>
                        </div>
                        {variable.isRequired && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-red-600">Required</span>
                          </div>
                        )}
                      </div>

                      {/* Default Value */}
                      {variable.defaultValue && (
                        <div className="mb-3">
                          <span className="text-xs text-gray-500">Default: </span>
                          <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            {variable.defaultValue}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {variable.tags && variable.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {variable.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 ring-1 ring-inset ring-blue-700/10"
                            >
                              #{tag}
                            </span>
                          ))}
                          {variable.tags.length > 3 && (
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100">
                              +{variable.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals would continue here... */}
    </div>
  );
}
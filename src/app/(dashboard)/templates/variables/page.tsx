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
  group: string; // Group ID that this variable belongs to
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
      name: 'All Variables', 
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
    // loadVariableGroups will be called from within loadVariables
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
      const uniqueGroups = [...new Set(variablesData.map(v => v.group))];
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

  const loadVariableGroups = async () => {
    // Groups are auto-generated from variable data, so this function
    // will be called after loadVariables() populates the groups
    return Promise.resolve();
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

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const groupData = {
        ...groupForm,
        updatedAt: serverTimestamp()
      };

      if (editingGroup?.id) {
        await updateDoc(doc(db, 'variableGroups', editingGroup.id), groupData);
      } else {
        await addDoc(collection(db, 'variableGroups'), {
          ...groupData,
          createdAt: serverTimestamp()
        });
      }

      await loadVariableGroups();
      handleCloseGroupModal();
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Failed to save group');
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

  const handleDeleteGroup = async (groupId: string) => {
    const variablesInGroup = variables.filter(v => v.group === groupId);
    if (variablesInGroup.length > 0) {
      alert('Cannot delete group that contains variables. Please move or delete variables first.');
      return;
    }

    if (confirm('Are you sure you want to delete this group?')) {
      try {
        await deleteDoc(doc(db, 'variableGroups', groupId));
        await loadVariableGroups();
        if (selectedGroup === groupId) {
          setSelectedGroup('all');
        }
      } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group');
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
    if (groupId === 'all') return 'All Variables';
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
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <button
                onClick={() => router.push('/templates')}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Templates
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2">Variables</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Variables & Formatting
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage template variables organized by groups with formatting options for consistent data presentation
            </p>
          </div>
          <div className="mt-6 flex items-center gap-3 md:ml-4 md:mt-0">
            {/* Search */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-72 rounded-lg border-0 bg-white py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 sm:text-sm sm:leading-6"
                placeholder="Search variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowUpTrayIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
              Import JSON
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors"
            >
              <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
              New Variable
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Groups Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-6 min-w-0 lg:min-w-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Variable Groups</h3>
                <div className="text-xs text-gray-500">Auto-generated from data</div>
              </div>
              <nav className="space-y-1">
                {groupsWithCounts.map((group) => (
                  <div key={group.id} className="group flex items-center">
                    <button
                      onClick={() => setSelectedGroup(group.id === 'all' ? 'all' : group.name)}
                      className={classNames(
                        (selectedGroup === group.id || (selectedGroup === group.name && group.id !== 'all'))
                          ? 'bg-white text-zinc-900 shadow-sm font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50',
                        'group flex w-full items-start justify-between rounded-lg px-3 py-3 text-sm transition-all duration-200 min-h-[44px]'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FolderIconSolid className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words leading-tight">{group.name}</span>
                      </div>
                      <span className={classNames(
                        selectedGroup === group.id ? 'text-zinc-600 bg-zinc-100' : 'text-gray-400 bg-gray-200',
                        'ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'
                      )}>
                        {group.count}
                      </span>
                    </button>
                    {group.id !== 'all' && (
                      <Menu as="div" className="relative ml-2">
                        <Menu.Button className="flex items-center rounded-full p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <EllipsisVerticalIcon className="h-4 w-4" />
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
                          <Menu.Items className="absolute right-0 z-10 mt-1 w-32 origin-top-right bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none rounded-lg">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleEditGroup(group as VariableGroup)}
                                  className={classNames(
                                    active ? 'bg-gray-50' : '',
                                    'flex w-full items-center px-3 py-2 text-sm text-gray-700'
                                  )}
                                >
                                  <PencilIcon className="mr-2 h-3 w-3" />
                                  Edit
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleDeleteGroup(group.id!)}
                                  className={classNames(
                                    active ? 'bg-red-50 text-red-700' : 'text-red-600',
                                    'flex w-full items-center px-3 py-2 text-sm'
                                  )}
                                >
                                  <TrashIcon className="mr-2 h-3 w-3" />
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Variables Grid */}
          <div className="lg:col-span-3">
            {filteredVariables.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-24 w-24 text-gray-300">
                  <VariableIconSolid className="h-full w-full" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No variables found</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                  {searchTerm || selectedGroup !== 'all' 
                    ? 'Try adjusting your search or filter criteria to see more results'
                    : 'Get started by creating your first template variable'
                  }
                </p>
                {(!searchTerm && selectedGroup === 'all') && (
                  <div className="mt-8">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors"
                    >
                      <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                      Create your first variable
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredVariables.map((variable) => {
                  const IconComponent = getDataTypeIcon(variable.dataType);
                  
                  return (
                    <div
                      key={variable.id}
                      className="group relative bg-white border border-gray-300 rounded-xl p-6 hover:shadow-lg hover:border-gray-400 transition-all duration-200"
                    >
                      {/* Variable Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={classNames(
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                            getGroupColor(variable.group)
                          )}>
                            <IconComponent className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {variable.name}
                            </h3>
                            <div className="mt-1">
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                {variable.variable}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className={classNames(
                                'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                                getGroupColor(variable.group)
                              )}>
                                {getGroupName(variable.group)}
                              </span>
                              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                {variable.dataType}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status & Actions */}
                        <div className="flex items-center gap-2 ml-2">
                          <div className="flex items-center">
                            {variable.isActive ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            )}
                          </div>
                          
                          <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2">
                              <span className="sr-only">Open options</span>
                              <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
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
                              <Menu.Items className="absolute right-0 z-10 mt-1 w-48 origin-top-right bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none rounded-lg">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleEditVariable(variable)}
                                      className={classNames(
                                        active ? 'bg-gray-50' : '',
                                        'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                                      )}
                                    >
                                      <PencilIcon className="mr-3 h-4 w-4" />
                                      Edit Variable
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDuplicateVariable(variable)}
                                      className={classNames(
                                        active ? 'bg-gray-50' : '',
                                        'flex w-full items-center px-4 py-2 text-sm text-gray-700'
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
                                        'flex w-full items-center px-4 py-2 text-sm'
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
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                          {variable.description}
                        </p>
                      )}

                      {/* Format Display */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Cog6ToothIcon className="h-4 w-4" />
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
                        <div className="mb-4">
                          <span className="text-xs text-gray-500">Default: </span>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {variable.defaultValue}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {variable.tags && variable.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {variable.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                            >
                              #{tag}
                            </span>
                          ))}
                          {variable.tags.length > 3 && (
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
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

      {/* Create/Edit Variable Modal */}
      {showCreateModal && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900">
                      {editingVariable ? 'Edit Variable' : 'Create New Variable'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {editingVariable ? 'Update variable formatting and options' : 'Create a new template variable with formatting options'}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="rounded-lg bg-white p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {variableGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-600">Loading variable groups...</p>
                  </div>
                ) : (
                  <>
                    {/* Modal Content */}
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                      {/* Basic Information */}
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="variable-name" className="block text-sm font-medium leading-6 text-gray-900">
                            Variable Name <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2">
                            <input
                              type="text"
                              id="variable-name"
                              value={variableForm.name}
                              onChange={(e) => setVariableForm(prev => ({ ...prev, name: e.target.value }))}
                              className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                              placeholder="e.g., addressLine2"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="variable-syntax" className="block text-sm font-medium leading-6 text-gray-900">
                            Variable Syntax <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-2">
                            <input
                              type="text"
                              id="variable-syntax"
                              value={variableForm.variable}
                              onChange={(e) => setVariableForm(prev => ({ ...prev, variable: e.target.value }))}
                              className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6 font-mono"
                              placeholder="e.g., {{addressLine2}}"
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            This is the exact syntax used in templates (auto-generated from name)
                          </p>
                        </div>

                        <div>
                          <label htmlFor="variable-description" className="block text-sm font-medium leading-6 text-gray-900">
                            Description
                          </label>
                          <div className="mt-2">
                            <textarea
                              id="variable-description"
                              rows={3}
                              value={variableForm.description}
                              onChange={(e) => setVariableForm(prev => ({ ...prev, description: e.target.value }))}
                              className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                              placeholder="Brief description of this variable..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="variable-datatype" className="block text-sm font-medium leading-6 text-gray-900">
                              Data Type
                            </label>
                            <div className="mt-2">
                              <select
                                id="variable-datatype"
                                value={variableForm.dataType}
                                onChange={(e) => setVariableForm(prev => ({ ...prev, dataType: e.target.value }))}
                                className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                              >
                                {dataTypes.map(type => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="variable-group" className="block text-sm font-medium leading-6 text-gray-900">
                              Variable Group <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                              <select
                                id="variable-group"
                                value={variableForm.group}
                                onChange={(e) => setVariableForm(prev => ({ ...prev, group: e.target.value }))}
                                className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                              >
                                {variableGroups.map(group => (
                                  <option key={group.id} value={group.name}>
                                    {group.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="variable-default" className="block text-sm font-medium leading-6 text-gray-900">
                            Default Value
                          </label>
                          <div className="mt-2">
                            <input
                              type="text"
                              id="variable-default"
                              value={variableForm.defaultValue}
                              onChange={(e) => setVariableForm(prev => ({ ...prev, defaultValue: e.target.value }))}
                              className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                              placeholder="Optional default value..."
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                              <input
                                id="variable-active"
                                type="checkbox"
                                checked={variableForm.isActive}
                                onChange={(e) => setVariableForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-zinc-600 focus:ring-zinc-600"
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <label htmlFor="variable-active" className="font-medium text-gray-900">
                                Active variable
                              </label>
                              <p className="text-gray-500">Variable will be available for use in templates.</p>
                            </div>
                          </div>

                          <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                              <input
                                id="variable-required"
                                type="checkbox"
                                checked={variableForm.isRequired}
                                onChange={(e) => setVariableForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-zinc-600 focus:ring-zinc-600"
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <label htmlFor="variable-required" className="font-medium text-gray-900">
                                Required variable
                              </label>
                              <p className="text-gray-500">This variable must have a value when generating letters.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Format Options */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-4">Format Options</h4>
                          
                          {/* Date Format */}
                          {(variableForm.dataType === 'date' || variableForm.dataType === 'datetime') && (
                            <div className="mb-4">
                              <label htmlFor="date-format" className="block text-sm font-medium leading-6 text-gray-900">
                                Date Format
                              </label>
                              <div className="mt-2">
                                <select
                                  id="date-format"
                                  value={variableForm.formatOptions.dateFormat || 'MM/DD/YYYY'}
                                  onChange={(e) => setVariableForm(prev => ({ 
                                    ...prev, 
                                    formatOptions: { ...prev.formatOptions, dateFormat: e.target.value }
                                  }))}
                                  className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                                >
                                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                  <option value="MMMM D, YYYY">January 1, 2024</option>
                                  <option value="MMM D, YYYY">Jan 1, 2024</option>
                                  <option value="D MMMM YYYY">1 January 2024</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Currency Format */}
                          {variableForm.dataType === 'currency' && (
                            <div className="mb-4">
                              <label htmlFor="currency-code" className="block text-sm font-medium leading-6 text-gray-900">
                                Currency
                              </label>
                              <div className="mt-2">
                                <select
                                  id="currency-code"
                                  value={variableForm.formatOptions.currencyCode || 'USD'}
                                  onChange={(e) => setVariableForm(prev => ({ 
                                    ...prev, 
                                    formatOptions: { ...prev.formatOptions, currencyCode: e.target.value }
                                  }))}
                                  className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                                >
                                  <option value="USD">USD ($)</option>
                                  <option value="EUR">EUR (€)</option>
                                  <option value="GBP">GBP (£)</option>
                                  <option value="CAD">CAD (C$)</option>
                                  <option value="JPY">JPY (¥)</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Phone Format */}
                          {variableForm.dataType === 'phone' && (
                            <div className="mb-4">
                              <label htmlFor="phone-format" className="block text-sm font-medium leading-6 text-gray-900">
                                Phone Format
                              </label>
                              <div className="mt-2">
                                <select
                                  id="phone-format"
                                  value={variableForm.formatOptions.phoneFormat || '(XXX) XXX-XXXX'}
                                  onChange={(e) => setVariableForm(prev => ({ 
                                    ...prev, 
                                    formatOptions: { ...prev.formatOptions, phoneFormat: e.target.value }
                                  }))}
                                  className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                                >
                                  <option value="(XXX) XXX-XXXX">(555) 123-4567</option>
                                  <option value="XXX-XXX-XXXX">555-123-4567</option>
                                  <option value="XXX.XXX.XXXX">555.123.4567</option>
                                  <option value="+1 XXX XXX XXXX">+1 555 123 4567</option>
                                  <option value="XXXXXXXXXX">5551234567</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Address Format */}
                          {variableForm.dataType === 'address' && (
                            <div className="mb-4">
                              <label htmlFor="address-format" className="block text-sm font-medium leading-6 text-gray-900">
                                Address Format
                              </label>
                              <div className="mt-2">
                                <select
                                  id="address-format"
                                  value={variableForm.formatOptions.addressFormat || 'standard'}
                                  onChange={(e) => setVariableForm(prev => ({ 
                                    ...prev, 
                                    formatOptions: { ...prev.formatOptions, addressFormat: e.target.value }
                                  }))}
                                  className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                                >
                                  <option value="standard">Standard (Multi-line)</option>
                                  <option value="single-line">Single Line</option>
                                  <option value="postal">Postal Format</option>
                                  <option value="international">International</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Text Case */}
                          {variableForm.dataType === 'string' && (
                            <div className="mb-4">
                              <label htmlFor="text-case" className="block text-sm font-medium leading-6 text-gray-900">
                                Text Case
                              </label>
                              <div className="mt-2">
                                <select
                                  id="text-case"
                                  value={variableForm.formatOptions.textCase || 'default'}
                                  onChange={(e) => setVariableForm(prev => ({ 
                                    ...prev, 
                                    formatOptions: { ...prev.formatOptions, textCase: e.target.value }
                                  }))}
                                  className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                                >
                                  <option value="default">Default</option>
                                  <option value="uppercase">UPPERCASE</option>
                                  <option value="lowercase">lowercase</option>
                                  <option value="title">Title Case</option>
                                  <option value="sentence">Sentence case</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Number Format */}
                          {variableForm.dataType === 'number' && (
                            <div className="mb-4">
                              <label htmlFor="number-format" className="block text-sm font-medium leading-6 text-gray-900">
                                Number Format
                              </label>
                              <div className="mt-2">
                                <select
                                  id="number-format"
                                  value={variableForm.formatOptions.numberFormat || '0,0'}
                                  onChange={(e) => setVariableForm(prev => ({ 
                                    ...prev, 
                                    formatOptions: { ...prev.formatOptions, numberFormat: e.target.value }
                                  }))}
                                  className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                                >
                                  <option value="0,0">1,234</option>
                                  <option value="0,0.00">1,234.56</option>
                                  <option value="0.00">1234.56</option>
                                  <option value="0">1234</option>
                                  <option value="0%">123%</option>
                                  <option value="0.0%">12.3%</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Format Preview */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-xs font-medium text-gray-900 mb-2">Format Preview</h5>
                            <div className="text-sm font-mono text-gray-600">
                              {getFormatDisplay({
                                dataType: variableForm.dataType,
                                formatOptions: variableForm.formatOptions
                              } as Variable)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="mt-8 flex items-center justify-end gap-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveVariable}
                        disabled={isSubmitting || !variableForm.name.trim() || !variableForm.variable.trim()}
                        className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          editingVariable ? 'Update Variable' : 'Create Variable'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900">
                      Import Variables from JSON
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Paste your JSON variable definitions to import multiple variables at once
                    </p>
                  </div>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="rounded-lg bg-white p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="import-json" className="block text-sm font-medium leading-6 text-gray-900">
                      JSON Data
                    </label>
                    <div className="mt-2">
                      <textarea
                        id="import-json"
                        rows={12}
                        value={importJson}
                        onChange={(e) => setImportJson(e.target.value)}
                        className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6 font-mono"
                        placeholder='[
  {
    "name": "addressLine2",
    "description": "Second line of the address (e.g., suite or unit number)",
    "variable": "{{addressLine2}}",
    "group": "Member"
  }
]'
                      />
                    </div>
                  </div>

                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          JSON Format Requirements
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            The JSON should be an array of variable objects. Each variable should have 
                            <code className="bg-blue-100 px-1 rounded">name</code>, 
                            <code className="bg-blue-100 px-1 rounded">description</code>, 
                            <code className="bg-blue-100 px-1 rounded">variable</code>, and 
                            <code className="bg-blue-100 px-1 rounded">group</code> properties.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImportVariables}
                    disabled={isSubmitting || !importJson.trim()}
                    className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Importing...
                      </>
                    ) : (
                      'Import Variables'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
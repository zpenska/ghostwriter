'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  VariableIcon,
  Square3Stack3DIcon,
  ChevronUpDownIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon,
  FolderIcon,
  EllipsisVerticalIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Timestamp } from 'firebase/firestore';
import { templateService, TemplateCollection, Template } from '@/lib/services/template-service';

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface FilterState {
  status: string[];
  tags: string[];
  dateRange: { start: string; end: string };
  collections: string[];
}

interface SortConfig {
  key: keyof Template | 'collectionName';
  direction: 'asc' | 'desc';
}

export default function TemplatesPage() {
  const [collections, setCollections] = useState<TemplateCollection[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showCollectionSettings, setShowCollectionSettings] = useState(false);
  const [editingCollection, setEditingCollection] = useState<TemplateCollection | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; collection: TemplateCollection } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'updatedAt', direction: 'desc' });
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    tags: [],
    dateRange: { start: '', end: '' },
    collections: []
  });

  const router = useRouter();
  const collectionNameInputRef = useRef<HTMLInputElement>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close context menu if clicking outside
      if (contextMenu) {
        setContextMenu(null);
      }

      // Close dropdown only if clicking outside of it
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          // Also check if we're clicking the dropdown button itself
          const dropdownButton = dropdownElement.parentElement?.querySelector('button[data-dropdown-button="true"]');
          if (!dropdownButton?.contains(event.target as Node)) {
            setOpenDropdown(null);
          }
        }
      }

      // Handle collection name editing
      if (editingCollectionName && collectionNameInputRef.current && 
          !collectionNameInputRef.current.contains(event.target as Node)) {
        setEditingCollectionName(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [editingCollectionName, contextMenu, openDropdown]);

  const loadData = async () => {
    try {
      const [collectionsData, templatesData] = await Promise.all([
        templateService.getCollections(),
        templateService.getTemplates()
      ]);
      setCollections(collectionsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Move helper functions BEFORE they're used
  const getCollectionName = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    return collection?.name || 'Unknown Collection';
  };

  const getAllTags = (): string[] => {
    const allTags = templates.flatMap(t => t.tags || []);
    return Array.from(new Set(allTags)).sort();
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCollection = selectedCollection === 'all' || template.collectionId === selectedCollection;
    const matchesSearch = template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply advanced filters
    const matchesStatus = filters.status.length === 0 || filters.status.includes(template.status);
    const matchesTags = filters.tags.length === 0 || 
                       (template.tags && filters.tags.some(tag => template.tags!.includes(tag)));
    
    // Safe date range filtering
    let matchesDateRange = true;
    if (filters.dateRange.start && filters.dateRange.end) {
      try {
        const templateDate = template.updatedAt || template.createdAt;
        if (templateDate) {
          let templateDateObj: Date;
          if (templateDate instanceof Timestamp || (typeof templateDate === 'object' && 'toDate' in templateDate)) {
            templateDateObj = templateDate.toDate();
          } else {
            templateDateObj = new Date(templateDate);
          }
          
          if (!isNaN(templateDateObj.getTime())) {
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            matchesDateRange = templateDateObj >= startDate && templateDateObj <= endDate;
          }
        }
      } catch (error) {
        console.warn('Error filtering by date range:', error);
      }
    }
    
    const matchesCollectionFilter = filters.collections.length === 0 || 
                                   filters.collections.includes(template.collectionId);

    return matchesCollection && matchesSearch && matchesStatus && matchesTags && 
           matchesDateRange && matchesCollectionFilter;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortConfig.key === 'collectionName') {
      aValue = getCollectionName(a.collectionId);
      bValue = getCollectionName(b.collectionId);
    } else {
      aValue = a[sortConfig.key as keyof Template];
      bValue = b[sortConfig.key as keyof Template];
    }

    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectTemplate = (templateId: string, checked: boolean) => {
    const newSelected = new Set(selectedTemplates);
    if (checked) {
      newSelected.add(templateId);
    } else {
      newSelected.delete(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  const handleSelectAllTemplates = (checked: boolean) => {
    if (checked) {
      setSelectedTemplates(new Set(sortedTemplates.map(t => t.id!)));
    } else {
      setSelectedTemplates(new Set());
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'move') => {
    const templateIds = Array.from(selectedTemplates);
    
    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${templateIds.length} templates?`)) return;
    }

    try {
      switch (action) {
        case 'activate':
          await Promise.all(templateIds.map(id => 
            templateService.updateTemplate(id, { isActive: true } as Partial<Template>)
          ));
          break;
        case 'deactivate':
          await Promise.all(templateIds.map(id => 
            templateService.updateTemplate(id, { isActive: false } as Partial<Template>)
          ));
          break;
        case 'delete':
          await Promise.all(templateIds.map(id => templateService.deleteTemplate(id)));
          break;
      }
      
      setSelectedTemplates(new Set());
      loadData();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      await templateService.updateTemplate(template.id!, { 
        isActive: !template.isActive 
      } as Partial<Template>);
      loadData();
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleEditTemplate = (template: Template) => {
    console.log('🔧 Editing template:', { id: template.id, name: template.name });
    router.push(`/template-builder?id=${template.id}`);
  };

  const handlePreviewTemplate = (template: Template) => {
    console.log('👁️ Previewing template:', { id: template.id, name: template.name });
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleDuplicateTemplate = async (template: Template) => {
    console.log('📋 Duplicating template:', { id: template.id, name: template.name });
    try {
      const { id, createdAt, updatedAt, ...templateData } = template;
      const duplicatedTemplate = {
        ...templateData,
        name: `${template.name} (Copy)`,
        status: 'draft' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await templateService.saveTemplate(duplicatedTemplate);
      loadData();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    console.log('🗑️ Deleting template:', { id: template.id, name: template.name });
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await templateService.deleteTemplate(template.id!);
        loadData();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleCollectionContextMenu = (e: React.MouseEvent, collection: TemplateCollection) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      collection
    });
  };

  const handleRenameCollection = (collection: TemplateCollection) => {
    setEditingCollectionName(collection.id!);
    setContextMenu(null);
  };

  const handleSaveCollectionName = async (collectionId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      await templateService.updateCollection(collectionId, { 
        name: newName.trim() 
      } as Partial<TemplateCollection>);
      setEditingCollectionName(null);
      loadData();
    } catch (error) {
      console.error('Error updating collection name:', error);
    }
  };

  const handleDeleteCollection = async (collection: TemplateCollection) => {
    const templatesInCollection = templates.filter(t => t.collectionId === collection.id);
    
    if (templatesInCollection.length > 0) {
      alert(`Cannot delete collection "${collection.name}" because it contains ${templatesInCollection.length} templates.`);
      return;
    }

    if (confirm(`Are you sure you want to delete the collection "${collection.name}"?`)) {
      try {
        await templateService.deleteCollection(collection.id!);
        setContextMenu(null);
        loadData();
      } catch (error) {
        console.error('Error deleting collection:', error);
      }
    }
  };

  const exportToPDF = async (template: Template) => {
    console.log('📄 Exporting template to PDF:', { id: template.id, name: template.name });
    // Mock PDF export - replace with actual implementation
    const blob = new Blob([`Template: ${template.name}\nContent: ${template.content || 'No content'}`], 
      { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date | string | Timestamp | any): string => {
    try {
      // Handle Firebase Timestamps and regular dates
      let dateObj: Date;
      
      if (!date) {
        return 'Unknown';
      }
      
      if (date instanceof Timestamp || (date && typeof date === 'object' && 'toDate' in date)) {
        // Firebase Timestamp
        dateObj = date.toDate();
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return 'Unknown';
      }

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Unknown';
      }

      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      tags: [],
      dateRange: { start: '', end: '' },
      collections: []
    });
  };

  const activeFiltersCount = filters.status.length + filters.tags.length + 
                           filters.collections.length + 
                           (filters.dateRange.start && filters.dateRange.end ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-2 text-zinc-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
                    <p className="mt-0.5 text-gray-600">
                      Manage your letter templates and collections
                    </p>
                  </div>
                </div>
                
                {selectedTemplates.size > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {selectedTemplates.size} template{selectedTemplates.size === 1 ? '' : 's'} selected
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBulkAction('activate')}
                          className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Activate
                        </button>
                        <button
                          onClick={() => handleBulkAction('deactivate')}
                          className="inline-flex items-center px-3 py-2 border border-amber-300 shadow-sm text-sm leading-4 font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                          Deactivate
                        </button>
                        <button
                          onClick={() => handleBulkAction('delete')}
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/templates/variables')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                >
                  <VariableIcon className="w-4 h-4 mr-2" />
                  Variables
                </button>
                <button
                  onClick={() => router.push('/templates/blocks')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                >
                  <Square3Stack3DIcon className="w-4 h-4 mr-2" />
                  Blocks
                </button>
                <button
                  onClick={() => router.push('/template-builder')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Collections Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Collections</h3>
                  <button
                    onClick={() => setShowCollectionSettings(true)}
                    className="inline-flex items-center p-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-2">
                <button
                  onClick={() => setSelectedCollection('all')}
                  className={classNames(
                    'w-full flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 text-left mb-1',
                    selectedCollection === 'all'
                      ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-400" />
                  All Templates
                  <span className={classNames(
                    "ml-auto text-xs px-1.5 py-0.5 rounded-full",
                    selectedCollection === 'all' 
                      ? "bg-gray-100 text-gray-700" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {templates.length}
                  </span>
                </button>
                
                {collections.map((collection) => {
                  const collectionTemplates = templates.filter(t => t.collectionId === collection.id);
                  const isEditing = editingCollectionName === collection.id;
                  const isSelected = selectedCollection === collection.id;
                  
                  return (
                    <div key={collection.id} className="mb-1">
                      {isEditing ? (
                        <input
                          ref={collectionNameInputRef}
                          type="text"
                          defaultValue={collection.name}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveCollectionName(collection.id!, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                              setEditingCollectionName(null);
                            }
                          }}
                          onBlur={(e) => handleSaveCollectionName(collection.id!, e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setSelectedCollection(collection.id!)}
                          onContextMenu={(e) => handleCollectionContextMenu(e, collection)}
                          className={classNames(
                            'w-full flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 text-left',
                            isSelected
                              ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <FolderIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="flex-1 truncate text-sm">{collection.name}</span>
                          <span className={classNames(
                            "text-xs px-1.5 py-0.5 rounded-full",
                            isSelected 
                              ? "bg-gray-100 text-gray-700" 
                              : "bg-gray-100 text-gray-600"
                          )}>
                            {collectionTemplates.length}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {/* Search and Filters */}
            <div className="mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(true)}
                  className={classNames(
                    "inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500",
                    activeFiltersCount > 0 ? "bg-gray-100 border-gray-400" : ""
                  )}
                >
                  <FunnelIcon className="w-4 h-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-900 text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Templates Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="relative w-12 px-4 sm:w-16 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-zinc-600 focus:ring-zinc-500"
                          checked={selectedTemplates.size === sortedTemplates.length && sortedTemplates.length > 0}
                          ref={(el) => {
                            if (el) el.indeterminate = selectedTemplates.size > 0 && selectedTemplates.size < sortedTemplates.length;
                          }}
                          onChange={(e) => handleSelectAllTemplates(e.target.checked)}
                        />
                      </th>
                      <th scope="col" className="min-w-[320px] py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                        <button
                          className="group inline-flex items-center"
                          onClick={() => handleSort('name')}
                        >
                          Template
                          <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                            <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="w-44 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <button
                          className="group inline-flex items-center"
                          onClick={() => handleSort('collectionName')}
                        >
                          Collection
                          <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                            <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="w-28 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <button
                          className="group inline-flex items-center"
                          onClick={() => handleSort('status')}
                        >
                          Status
                          <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                            <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="w-32 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <button
                          className="group inline-flex items-center"
                          onClick={() => handleSort('updatedAt')}
                        >
                          Updated
                          <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                            <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="w-20 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Active
                      </th>
                      <th scope="col" className="w-16 relative py-3.5 pl-3 pr-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {templates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-14 text-center">
                          <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-300" />
                          <h3 className="mt-4 text-lg font-semibold text-gray-900">No templates found</h3>
                          <p className="mt-2 text-gray-600 max-w-sm mx-auto">
                            {searchQuery || activeFiltersCount > 0 
                              ? 'No templates match your search criteria. Try adjusting your filters.' 
                              : 'Get started by creating your first template.'}
                          </p>
                          {(!searchQuery && activeFiltersCount === 0) && (
                            <div className="mt-6">
                              <button
                                onClick={() => router.push('/template-builder')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                              >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Create Your First Template
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      sortedTemplates.map((template, templateIdx) => (
                        <tr
                          key={template.id}
                          className={classNames(
                            selectedTemplates.has(template.id!) ? 'bg-gray-50' : 'bg-white',
                            'hover:bg-gray-50'
                          )}
                        >
                          <td className="relative w-12 px-4 sm:w-16 sm:px-6">
                            <input
                              type="checkbox"
                              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-zinc-600 focus:ring-zinc-500"
                              checked={selectedTemplates.has(template.id!)}
                              onChange={(e) => handleSelectTemplate(template.id!, e.target.checked)}
                            />
                          </td>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm max-w-[320px]">
                            <div>
                              <div className="font-medium text-gray-900 truncate">
                                {template.name}
                              </div>
                              {template.description && (
                                <div className="text-gray-500 truncate mt-1">
                                  {template.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 w-44">
                            <span className="text-gray-900 font-medium truncate">
                              {getCollectionName(template.collectionId)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 w-28">
                            <span
                              className={classNames(
                                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                template.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              )}
                            >
                              {template.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 w-32">
                            <div className="text-gray-900">
                              {formatDate(template.updatedAt || template.createdAt)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 w-20">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(template)}
                              className={classNames(
                                template.isActive !== false
                                  ? 'bg-zinc-600'
                                  : 'bg-gray-200',
                                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2'
                              )}
                              role="switch"
                              aria-checked={template.isActive !== false}
                            >
                              <span className="sr-only">Toggle active status</span>
                              <span
                                aria-hidden="true"
                                className={classNames(
                                  template.isActive !== false ? 'translate-x-5' : 'translate-x-0',
                                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                )}
                              />
                            </button>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium w-16">
                            <div className="relative">
                              <button
                                type="button"
                                data-dropdown-button="true"
                                className="inline-flex items-center rounded-full bg-white p-2 text-gray-400 shadow-sm hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 border border-gray-200 hover:border-gray-300"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🔄 Dropdown button clicked for template:', { id: template.id, name: template.name });
                                  setOpenDropdown(openDropdown === template.id ? null : template.id!);
                                }}
                              >
                                <span className="sr-only">Open options</span>
                                <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                              
                              {openDropdown === template.id && (
                                <div 
                                  ref={(el) => { dropdownRefs.current[template.id!] = el; }}
                                  className="absolute right-0 z-50 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenDropdown(null);
                                        handleEditTemplate(template);
                                      }}
                                      className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                      <PencilIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                      Edit Template
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenDropdown(null);
                                        handlePreviewTemplate(template);
                                      }}
                                      className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                      <EyeIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                      Preview
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenDropdown(null);
                                        handleDuplicateTemplate(template);
                                      }}
                                      className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                      <DocumentDuplicateIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                      Duplicate
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenDropdown(null);
                                        exportToPDF(template);
                                      }}
                                      className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                      <DocumentArrowDownIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                      Export PDF
                                    </button>
                                  </div>
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenDropdown(null);
                                        handleDeleteTemplate(template);
                                      }}
                                      className="group flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900"
                                    >
                                      <TrashIcon className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu for Collections */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-40"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleRenameCollection(contextMenu.collection)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-gray-700"
          >
            <PencilIcon className="w-4 h-4 mr-3" />
            Rename
          </button>
          <button
            onClick={() => setEditingCollection(contextMenu.collection)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-gray-700"
          >
            <Cog6ToothIcon className="w-4 h-4 mr-3" />
            Settings
          </button>
          <div className="my-1 h-px bg-gray-200"></div>
          <button
            onClick={() => handleDeleteCollection(contextMenu.collection)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
          >
            <TrashIcon className="w-4 h-4 mr-3" />
            Delete
          </button>
        </div>
      )}

      {/* Simple Modal for Filters */}
      {showFilters && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowFilters(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  onClick={() => setShowFilters(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Advanced Filters
                  </h3>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Filter functionality will be implemented here.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-zinc-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-500 sm:ml-3 sm:w-auto"
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setShowFilters(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Modal for Preview */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPreview(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  onClick={() => setShowPreview(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Preview: {previewTemplate.name}
                  </h3>
                  <div className="mt-4">
                    <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: previewTemplate.content || '<p class="text-gray-500 italic">No content available for this template.</p>' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-zinc-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-500 sm:ml-3 sm:w-auto"
                  onClick={() => handleEditTemplate(previewTemplate)}
                >
                  Edit Template
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
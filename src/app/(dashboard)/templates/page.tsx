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
  ChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  TagIcon,
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
  key: keyof Template | 'collectionName' | 'analytics';
  direction: 'asc' | 'desc';
}

interface TemplateAnalytics {
  templateId: string;
  usageCount: number;
  lastUsed: Date | null;
  avgProcessingTime: number;
  successRate: number;
}

export default function TemplatesPage() {
  const [collections, setCollections] = useState<TemplateCollection[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [analytics, setAnalytics] = useState<TemplateAnalytics[]>([]);
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setContextMenu(null);
      setOpenDropdown(null);
      if (editingCollectionName && collectionNameInputRef.current && 
          !collectionNameInputRef.current.contains(event.target as Node)) {
        setEditingCollectionName(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [editingCollectionName]);

  const loadData = async () => {
    try {
      const [collectionsData, templatesData, analyticsData] = await Promise.all([
        templateService.getCollections(),
        templateService.getTemplates(),
        loadAnalytics()
      ]);
      setCollections(collectionsData);
      setTemplates(templatesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (): Promise<TemplateAnalytics[]> => {
    // Mock analytics data - replace with actual API call
    return [
      { templateId: 'template1', usageCount: 45, lastUsed: new Date('2024-06-10'), avgProcessingTime: 2.3, successRate: 98.5 },
      { templateId: 'template2', usageCount: 23, lastUsed: new Date('2024-06-08'), avgProcessingTime: 1.8, successRate: 95.2 },
    ];
  };

  // Move helper functions BEFORE they're used
  const getCollectionName = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    return collection?.name || 'Unknown Collection';
  };

  const getCollectionColor = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    return collection?.color || '#71717a';
  };

  const getTemplateAnalytics = (templateId: string): TemplateAnalytics | null => {
    return analytics.find(a => a.templateId === templateId) || null;
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
    } else if (sortConfig.key === 'analytics') {
      const aAnalytics = getTemplateAnalytics(a.id!);
      const bAnalytics = getTemplateAnalytics(b.id!);
      aValue = aAnalytics?.usageCount || 0;
      bValue = bAnalytics?.usageCount || 0;
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
    router.push(`/template-builder?id=${template.id}`);
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleDuplicateTemplate = async (template: Template) => {
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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-2 text-zinc-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-zinc-400 mr-3" />
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900">Templates</h1>
                    <p className="mt-2 text-zinc-600">
                      Manage your letter templates and collections
                    </p>
                  </div>
                </div>
                
                {selectedTemplates.size > 0 && (
                  <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-900">
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
                  className="inline-flex items-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                >
                  <VariableIcon className="w-4 h-4 mr-2" />
                  Variables
                </button>
                <button
                  onClick={() => router.push('/templates/components')}
                  className="inline-flex items-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                >
                  <Square3Stack3DIcon className="w-4 h-4 mr-2" />
                  Components
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

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Collections Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-zinc-900">Collections</h3>
                  <button
                    onClick={() => setShowCollectionSettings(true)}
                    className="inline-flex items-center p-1 border border-zinc-300 shadow-sm text-xs font-medium rounded text-zinc-600 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
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
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-700 hover:bg-zinc-50'
                  )}
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2 text-current opacity-70" />
                  All Templates
                  <span className={classNames(
                    "ml-auto text-xs px-1.5 py-0.5 rounded-full",
                    selectedCollection === 'all' 
                      ? "bg-white/20 text-white" 
                      : "bg-zinc-100 text-zinc-600"
                  )}>
                    {templates.length}
                  </span>
                </button>
                
                {collections.map((collection) => {
                  const collectionTemplates = templates.filter(t => t.collectionId === collection.id);
                  const isEditing = editingCollectionName === collection.id;
                  
                  return (
                    <div key={collection.id} className="mb-1">
                      {isEditing ? (
                        <input
                          ref={collectionNameInputRef}
                          type="text"
                          defaultValue={collection.name}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
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
                            selectedCollection === collection.id
                              ? 'bg-zinc-900 text-white shadow-sm'
                              : 'text-zinc-700 hover:bg-zinc-50'
                          )}
                        >
                          <div 
                            className="w-2.5 h-2.5 rounded-full mr-2"
                            style={{ backgroundColor: collection.color }}
                          />
                          <span className="flex-1 truncate text-sm">{collection.name}</span>
                          <span className={classNames(
                            "text-xs px-1.5 py-0.5 rounded-full",
                            selectedCollection === collection.id 
                              ? "bg-white/20 text-white" 
                              : "bg-zinc-100 text-zinc-600"
                          )}>
                            {collectionTemplates.length}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Analytics Summary */}
              <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50">
                <h4 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center">
                  <ChartBarIcon className="w-4 h-4 mr-1" />
                  Analytics
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-white rounded-lg p-2 border border-zinc-200">
                    <div className="text-lg font-bold text-zinc-900">
                      {analytics.reduce((sum, a) => sum + a.usageCount, 0)}
                    </div>
                    <div className="text-xs text-zinc-600">Total Usage</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-zinc-200">
                    <div className="text-lg font-bold text-green-600">
                      {templates.filter(t => t.isActive !== false).length}
                    </div>
                    <div className="text-xs text-zinc-600">Active Templates</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-zinc-200">
                    <div className="text-lg font-bold text-blue-600">
                      {analytics.length > 0 
                        ? (analytics.reduce((sum, a) => sum + a.successRate, 0) / analytics.length).toFixed(1)
                        : '0'}%
                    </div>
                    <div className="text-xs text-zinc-600">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {/* Search and Filters */}
            <div className="mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-lg leading-5 bg-white placeholder-zinc-500 focus:outline-none focus:placeholder-zinc-400 focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(true)}
                  className={classNames(
                    "inline-flex items-center px-4 py-2.5 border border-zinc-300 shadow-sm text-sm font-medium rounded-lg text-zinc-600 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500",
                    activeFiltersCount > 0 ? "bg-zinc-100 border-zinc-400" : ""
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
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th scope="col" className="relative w-12 px-4 sm:w-16 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500"
                          checked={selectedTemplates.size === sortedTemplates.length && sortedTemplates.length > 0}
                          ref={(el) => {
                            if (el) el.indeterminate = selectedTemplates.size > 0 && selectedTemplates.size < sortedTemplates.length;
                          }}
                          onChange={(e) => handleSelectAllTemplates(e.target.checked)}
                        />
                      </th>
                      <th scope="col" className="min-w-[280px] py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900">
                        <button
                          className="group inline-flex items-center"
                          onClick={() => handleSort('name')}
                        >
                          Template
                          <span className="ml-2 flex-none rounded text-zinc-400 group-hover:text-zinc-600">
                            <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="w-44 px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">
                        <button
                          className="group inline-flex items-center"
                          onClick={() => handleSort('collectionName')}
                        >
                          Collection
                          <span className="ml-2 flex-none rounded text-zinc-400 group-hover:text-zinc-600">
                            <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="w-28 px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">
                        <button
                          className="group inline-flex items-center"
                          onClick={() => handleSort('status')}
                        >
                          Status
                          <span className="ml-2 flex-none rounded text-zinc-400 group-hover:text-zinc-600">
                            <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="w-28 px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">
                        <button
                          className="group inline-flex items-center"
                          onClick={() => handleSort('analytics')}
                        >
                          Usage
                          <span className="ml-2 flex-none rounded text-zinc-400 group-hover:text-zinc-600">
                            <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="w-32 px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">
                        <button
                          className="group inline-flex items-center"
                          onClick={() => handleSort('updatedAt')}
                        >
                          Updated
                          <span className="ml-2 flex-none rounded text-zinc-400 group-hover:text-zinc-600">
                            <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="w-20 px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">
                        Active
                      </th>
                      <th scope="col" className="w-16 relative py-3.5 pl-3 pr-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">{templates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-14 text-center">
                        <DocumentTextIcon className="mx-auto h-16 w-16 text-zinc-300" />
                        <h3 className="mt-4 text-lg font-semibold text-zinc-900">No templates found</h3>
                        <p className="mt-2 text-zinc-600 max-w-sm mx-auto">
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
                    sortedTemplates.map((template, templateIdx) => {
                      const templateAnalytics = getTemplateAnalytics(template.id!);
                      return (
                        <tr
                          key={template.id}
                          className={classNames(
                            selectedTemplates.has(template.id!) ? 'bg-zinc-50' : 'bg-white',
                            'hover:bg-zinc-50'
                          )}
                        >
                          <td className="relative w-12 px-4 sm:w-16 sm:px-6">
                            <input
                              type="checkbox"
                              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500"
                              checked={selectedTemplates.has(template.id!)}
                              onChange={(e) => handleSelectTemplate(template.id!, e.target.checked)}
                            />
                          </td>
                          <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm max-w-[280px]">
                            <div>
                              <div className="font-medium text-zinc-900 truncate">
                                {template.name}
                              </div>
                              {template.description && (
                                <div className="text-zinc-500 truncate">
                                  {template.description}
                                </div>
                              )}
                              {template.tags && template.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {template.tags.slice(0, 2).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {template.tags.length > 2 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                                      +{template.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-500 w-44">
                            <div className="flex items-center">
                              <div 
                                className="w-2 h-2 rounded-full mr-2"
                                style={{ backgroundColor: getCollectionColor(template.collectionId) }}
                              />
                              <span className="text-zinc-900 font-medium truncate">
                                {getCollectionName(template.collectionId)}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-500 w-28">
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
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-500 w-28">
                            {templateAnalytics ? (
                              <div>
                                <div className="text-zinc-900 font-medium">
                                  {templateAnalytics.usageCount} uses
                                </div>
                                <div className="text-zinc-500">
                                  {templateAnalytics.successRate}% success
                                </div>
                              </div>
                            ) : (
                              <span className="text-zinc-400">No data</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-500 w-32">
                            <div className="text-zinc-900">
                              {formatDate(template.updatedAt || template.createdAt)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-500 w-20">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(template)}
                              className={classNames(
                                template.isActive !== false
                                  ? 'bg-zinc-600'
                                  : 'bg-zinc-200',
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
                          <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium w-16">
                            <div className="relative">
                              <button
                                type="button"
                                className="inline-flex items-center rounded-full bg-white p-2 text-zinc-400 shadow-sm hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 border border-zinc-200 hover:border-zinc-300"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Dropdown button clicked for template:', template.id);
                                  setOpenDropdown(openDropdown === template.id ? null : template.id!);
                                }}
                              >
                                <span className="sr-only">Open options</span>
                                <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                              
                              {openDropdown === template.id && (
                                <div 
                                  className="absolute right-0 z-[9999] mt-2 w-48 origin-top-right divide-y divide-zinc-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                  style={{ position: 'absolute', top: '100%', right: '0', zIndex: 9999 }}
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Edit clicked for template:', template.name);
                                        setOpenDropdown(null);
                                        handleEditTemplate(template);
                                      }}
                                      className="group flex w-full items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                                    >
                                      <PencilIcon className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-zinc-500" />
                                      Edit Template
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Preview clicked for template:', template.name);
                                        setOpenDropdown(null);
                                        handlePreviewTemplate(template);
                                      }}
                                      className="group flex w-full items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                                    >
                                      <EyeIcon className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-zinc-500" />
                                      Preview
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Duplicate clicked for template:', template.name);
                                        setOpenDropdown(null);
                                        handleDuplicateTemplate(template);
                                      }}
                                      className="group flex w-full items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                                    >
                                      <DocumentDuplicateIcon className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-zinc-500" />
                                      Duplicate
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Export clicked for template:', template.name);
                                        setOpenDropdown(null);
                                        exportToPDF(template);
                                      }}
                                      className="group flex w-full items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                                    >
                                      <DocumentArrowDownIcon className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-zinc-500" />
                                      Export PDF
                                    </button>
                                  </div>
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Delete clicked for template:', template.name);
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
                      );
                    })
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
          className="fixed z-50 bg-white border border-zinc-200 rounded-lg shadow-lg py-2 min-w-40"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleRenameCollection(contextMenu.collection)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 flex items-center text-zinc-700"
          >
            <PencilIcon className="w-4 h-4 mr-3" />
            Rename
          </button>
          <button
            onClick={() => setEditingCollection(contextMenu.collection)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 flex items-center text-zinc-700"
          >
            <Cog6ToothIcon className="w-4 h-4 mr-3" />
            Settings
          </button>
          <div className="my-1 h-px bg-zinc-200"></div>
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
            <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity" onClick={() => setShowFilters(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-zinc-400 hover:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  onClick={() => setShowFilters(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-zinc-900">
                    Advanced Filters
                  </h3>
                  <div className="mt-4">
                    <p className="text-sm text-zinc-500">
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
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 sm:mt-0 sm:w-auto"
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
            <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity" onClick={() => setShowPreview(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-zinc-400 hover:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  onClick={() => setShowPreview(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-zinc-900">
                    Preview: {previewTemplate.name}
                  </h3>
                  <div className="mt-4">
                    <div className="border rounded-lg p-4 bg-zinc-50 max-h-96 overflow-y-auto">
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: previewTemplate.content || '<p class="text-zinc-500 italic">No content available for this template.</p>' 
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
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 sm:mt-0 sm:w-auto"
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
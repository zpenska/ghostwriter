// src/app/(dashboard)/templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Timestamp } from 'firebase/firestore';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FolderIcon, 
  DocumentTextIcon, 
  EllipsisVerticalIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import { templateService, Template, TemplateCollection } from '@/lib/services/template-service';
import { buttonStyles } from '@/lib/utils/button-styles';
import { cn } from '@/lib/utils/cn';

export default function TemplatesPage() {
  const router = useRouter();
  
  // State management
  const [templates, setTemplates] = useState<Template[]>([]);
  const [collections, setCollections] = useState<TemplateCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<TemplateCollection | undefined>();

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, collectionsData] = await Promise.all([
        templateService.getTemplates(),
        templateService.getCollections()
      ]);
      setTemplates(templatesData);
      setCollections(collectionsData);
      
      // Expand all collections by default
      const collectionIds = new Set(collectionsData.map(c => c.id!));
      setExpandedCollections(collectionIds);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter templates based on search
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group templates by collection
  const groupedTemplates = collections.map(collection => ({
    collection,
    templates: filteredTemplates.filter(template => template.collectionId === collection.id)
  }));

  // Handle template actions
  const handleToggleTemplateActive = async (template: Template) => {
    try {
      await templateService.updateTemplate(template.id!, {
        isActive: !template.isActive
      });
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error toggling template active state:', error);
      alert('Failed to update template status');
    }
  };

  const handleEditTemplate = (template: Template) => {
    router.push(`/template-builder?id=${template.id}`);
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const duplicatedTemplate: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> = {
        name: `${template.name} (Copy)`,
        description: template.description,
        content: template.content,
        collectionId: template.collectionId,
        category: template.category,
        status: 'draft', // New copy starts as draft
        tags: template.tags,
        variables: template.variables,
        isActive: true,
        version: 1,
        createdBy: template.createdBy
      };
      
      await templateService.createTemplate(duplicatedTemplate);
      await loadData();
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template');
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await templateService.deleteTemplate(template.id!);
        await loadData();
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      }
    }
  };

  // Handle collection actions
  const handleToggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const handleEditCollection = (collection?: TemplateCollection) => {
    setEditingCollection(collection);
    setShowEditModal(true);
  };

  const handleDeleteCollection = async (collection: TemplateCollection) => {
    if (confirm(`Are you sure you want to delete "${collection.name}"? Templates in this collection will be moved to "Uncategorized".`)) {
      try {
        await templateService.deleteCollection(collection.id!);
        await loadData();
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Failed to delete collection');
      }
    }
  };

  // Handle drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const templateId = active.id as string;
    const targetCollectionId = over.id as string;

    try {
      await templateService.updateTemplate(templateId, {
        collectionId: targetCollectionId
      });
      await loadData();
    } catch (error) {
      console.error('Error moving template:', error);
      alert('Failed to move template');
    }
  };

  // Get category badge color using brand colors
  const getCategoryColor = (category: string) => {
    const colors = {
      'denial': 'bg-[#BAE5D6] text-[#3a4943]',        // Scrub badge color
      'approval': 'bg-[#DFFC95] text-[#3d3d3c]',      // Swift badge color  
      'appeal': 'bg-[#D3C5E8] text-[#3d3d3c]',        // Neural badge color
      'prior-auth': 'bg-[#d4c57f] text-[#3d3d3c]',    // Muted yellow
      'general': 'bg-[#F5F5F1] text-[#3d3d3c]'        // Nimbus background
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  // Get status badge color using brand colors
  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-[#F5F5F1] text-[#3d3d3c]',         // Nimbus
      'published': 'bg-[#DFFC95] text-[#3a4943]',     // Swift
      'archived': 'bg-[#BAE5D6] text-[#3a4943]'       // Scrub
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8a7fae]"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F1]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your letter templates and collections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleEditCollection()}
              className={cn(buttonStyles.secondary, "flex items-center gap-2")}
            >
              <FolderIcon className="h-4 w-4" />
              New Collection
            </button>
            <button
              onClick={() => router.push('/template-builder')}
              className={cn(buttonStyles.primary, "flex items-center gap-2")}
            >
              <PlusIcon className="h-4 w-4" />
              New Template
            </button>
          </div>
        </div>
      </div>

      {/* Top Navigation Cards */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Templates Card */}
          <div className="bg-gradient-to-r from-[#8a7fae] to-[#3d3d3c] rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Templates</h3>
                <p className="text-sm opacity-90">{templates.length} total</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 opacity-80" />
            </div>
          </div>

          {/* Collections Card */}
          <div className="bg-gradient-to-r from-[#b9cab3] to-[#3a4943] rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Collections</h3>
                <p className="text-sm opacity-90">{collections.length} folders</p>
              </div>
              <FolderIcon className="h-8 w-8 opacity-80" />
            </div>
          </div>

          {/* Components Card */}
          <div 
            className="bg-gradient-to-r from-[#d4c57f] to-[#a88868] rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/templates/components')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Components</h3>
                <p className="text-sm opacity-90">Reusable blocks</p>
              </div>
              <Cog6ToothIcon className="h-8 w-8 opacity-80" />
            </div>
          </div>

          {/* Variables Card */}
          <div 
            className="bg-gradient-to-r from-[#3a4943] to-[#8a7fae] rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/templates/variables')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Variables</h3>
                <p className="text-sm opacity-90">Dynamic content</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8a7fae] focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <DndContext onDragEnd={handleDragEnd}>
          <div className="p-6 space-y-6">
            {groupedTemplates.map(({ collection, templates: collectionTemplates }) => (
              <div key={collection.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Collection Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleCollection(collection.id!)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedCollections.has(collection.id!) ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: collection.color }}
                      />
                      <span className="text-lg font-medium text-gray-900">
                        {collection.icon} {collection.name}
                      </span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {collectionTemplates.length} templates
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCollection(collection)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <PencilIcon className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(collection)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <TrashIcon className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  {collection.description && (
                    <p className="text-sm text-gray-600 mt-2 ml-8">
                      {collection.description}
                    </p>
                  )}
                </div>

                {/* Templates List */}
                {expandedCollections.has(collection.id!) && (
                  <div className="divide-y divide-gray-200">
                    {collectionTemplates.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-500">
                        <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No templates in this collection</p>
                        <button
                          onClick={() => router.push('/template-builder')}
                          className="mt-2 text-[#8a7fae] hover:text-[#3d3d3c] text-sm font-medium"
                        >
                          Create your first template
                        </button>
                      </div>
                    ) : (
                      collectionTemplates.map((template) => (
                        <div key={template.id} className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {template.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                    getCategoryColor(template.category || 'general')
                                  )}>
                                    {template.category || 'general'}
                                  </span>
                                  <span className={cn(
                                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                    getStatusColor(template.status || 'draft')
                                  )}>
                                    {template.status || 'draft'}
                                  </span>
                                  {template.tags?.map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#D3C5E8] text-[#3d3d3c]"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {template.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {template.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Created: {template.createdAt ? (template.createdAt instanceof Date ? template.createdAt : template.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</span>
                                <span>Updated: {template.updatedAt ? (template.updatedAt instanceof Date ? template.updatedAt : template.updatedAt.toDate()).toLocaleDateString() : 'Unknown'}</span>
                                <span>Version: {template.version || 1}</span>
                                {template.variables && template.variables.length > 0 && (
                                  <span>{template.variables.length} variables</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Active</span>
                                <Switch
                                  checked={template.isActive}
                                  onChange={() => handleToggleTemplateActive(template)}
                                  className={cn(
                                    template.isActive ? 'bg-purple-600' : 'bg-gray-200',
                                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      template.isActive ? 'translate-x-5' : 'translate-x-1',
                                      'inline-block h-3 w-3 transform rounded-full bg-white transition-transform'
                                    )}
                                  />
                                </Switch>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditTemplate(template)}
                                  className="p-2 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                                  title="Edit Template"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDuplicateTemplate(template)}
                                  className="p-2 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                                  title="Duplicate Template"
                                >
                                  <DocumentDuplicateIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(template)}
                                  className="p-2 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600"
                                  title="Delete Template"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            {collections.length === 0 && (
              <div className="text-center py-12">
                <FolderIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
                <p className="text-gray-500 mb-4">Create your first collection to organize templates</p>
                <button
                  onClick={() => handleEditCollection()}
                  className={buttonStyles.primary}
                >
                  Create Collection
                </button>
              </div>
            )}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
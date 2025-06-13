// src/app/(dashboard)/templates/page.tsx - Fixed filtering
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FolderIcon, 
  DocumentTextIcon, 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { templateService, Template, TemplateCollection } from '@/lib/services/template-service';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [collections, setCollections] = useState<TemplateCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<TemplateCollection | undefined>();

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

  // SAFE filtering - handle undefined/null values
  const filteredTemplates = templates.filter(template => {
    // Ensure required properties exist and are strings
    const name = template.name || '';
    const description = template.description || '';
    const category = template.category || '';
    const content = template.content || '';
    const tags = template.tags || [];
    
    // If no search term, show all templates
    if (!searchTerm) return true;
    
    // Search in various fields safely
    const searchLower = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      description.toLowerCase().includes(searchLower) ||
      category.toLowerCase().includes(searchLower) ||
      content.toLowerCase().includes(searchLower) ||
      tags.some(tag => (tag || '').toLowerCase().includes(searchLower))
    );
  });

  const filteredCollections = collections.filter(collection => {
    if (!selectedCollection) return true;
    return collection.id === selectedCollection;
  });

  const getTemplatesForCollection = (collectionId: string) => {
    return filteredTemplates.filter(template => template.collectionId === collectionId);
  };

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const handleEditTemplate = (template: Template) => {
    router.push(`/template-builder?id=${template.id}`);
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      await templateService.createTemplate({
        ...template,
        name: `${template.name} (Copy)`,
        version: 1,
        createdBy: 'user', // You might want to get this from auth context
      });
      await loadData();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await templateService.deleteTemplate(template.id!);
        await loadData();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleToggleTemplateActive = async (template: Template) => {
    try {
      await templateService.updateTemplate(template.id!, {
        isActive: !template.isActive
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling template active state:', error);
    }
  };

  const handleCreateCollection = () => {
    setEditingCollection(undefined);
    setShowEditModal(true);
  };

  const handleEditCollection = (collection: TemplateCollection) => {
    setEditingCollection(collection);
    setShowEditModal(true);
  };

  const handleDeleteCollection = async (collection: TemplateCollection) => {
    if (confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      try {
        await templateService.deleteCollection(collection.id!);
        await loadData();
      } catch (error) {
        console.error('Error deleting collection:', error);
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const templateId = active.id as string;
    const targetCollectionId = over.id as string;
    
    // Find the template and update its collection
    const template = templates.find(t => t.id === templateId);
    if (template && template.collectionId !== targetCollectionId) {
      templateService.updateTemplate(templateId, {
        collectionId: targetCollectionId
      }).then(() => loadData());
    }
    
    setActiveId(null);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getCategoryBadge = (category: string) => {
    const badges = {
      denial: 'bg-red-100 text-red-800',
      approval: 'bg-green-100 text-green-800',
      appeal: 'bg-blue-100 text-blue-800',
      'prior-auth': 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return badges[category as keyof typeof badges] || badges.general;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates</h1>
          <p className="text-gray-600">Manage your letter templates and collections</p>
        </div>

        {/* Top Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/template-builder')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">New Template</h3>
                <p className="text-sm opacity-90">Create a new template</p>
              </div>
              <PlusIcon className="h-8 w-8" />
            </div>
          </div>

          <div 
            className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/components')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Components</h3>
                <p className="text-sm opacity-90">Reusable content blocks</p>
              </div>
              <DocumentTextIcon className="h-8 w-8" />
            </div>
          </div>

          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/variables')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Variables</h3>
                <p className="text-sm opacity-90">Dynamic content fields</p>
              </div>
              <FolderIcon className="h-8 w-8" />
            </div>
          </div>

          <div 
            className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/settings')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Settings</h3>
                <p className="text-sm opacity-90">Configure preferences</p>
              </div>
              <EllipsisVerticalIcon className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Collections</option>
              {collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleCreateCollection}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              New Collection
            </button>
          </div>
        </div>

        {/* Collections and Templates */}
        <div className="space-y-6">
          {filteredCollections.map(collection => {
            const collectionTemplates = getTemplatesForCollection(collection.id!);
            const isExpanded = expandedCollections.has(collection.id!);
            
            return (
              <div key={collection.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Collection Header */}
                <div 
                  className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCollection(collection.id!)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      )}
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: collection.color }}
                      />
                      <span className="text-2xl">{collection.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                        <p className="text-sm text-gray-500">{collection.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {collectionTemplates.length} templates
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCollection(collection);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCollection(collection);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Templates */}
                {isExpanded && (
                  <div className="p-4">
                    {collectionTemplates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No templates in this collection</p>
                        <button
                          onClick={() => router.push('/template-builder')}
                          className="mt-2 text-purple-600 hover:text-purple-800"
                        >
                          Create your first template
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {collectionTemplates.map(template => (
                          <div
                            key={template.id}
                            className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 line-clamp-1">
                                {template.name || 'Untitled Template'}
                              </h4>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditTemplate(template)}
                                  className="p-1 text-gray-400 hover:text-purple-600"
                                  title="Edit template"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDuplicateTemplate(template)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Duplicate template"
                                >
                                  <DocumentDuplicateIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(template)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="Delete template"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {template.description || 'No description provided'}
                            </p>
                            
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(template.status)}`}>
                                  {template.status}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(template.category)}`}>
                                  {template.category}
                                </span>
                              </div>
                              
                              <button
                                onClick={() => handleToggleTemplateActive(template)}
                                className={`w-8 h-4 rounded-full transition-colors ${
                                  template.isActive ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              >
                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                                  template.isActive ? 'translate-x-4' : 'translate-x-0.5'
                                }`} />
                              </button>
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              <p>Created: {template.createdAt?.toDate().toLocaleDateString()}</p>
                              <p>Updated: {template.updatedAt?.toDate().toLocaleDateString()}</p>
                              <p>Version: {template.version}</p>
                              {template.variables && template.variables.length > 0 && (
                                <p>Variables: {template.variables.join(', ')}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="bg-white rounded-lg shadow-lg p-4 opacity-75">
              <div className="font-medium">
                {templates.find(t => t.id === activeId)?.name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
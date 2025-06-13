// src/app/(dashboard)/templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
  ChevronRightIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  CubeIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';
import { 
  FolderIcon as FolderSolidIcon,
  DocumentTextIcon as DocumentSolidIcon
} from '@heroicons/react/24/solid';
import { templateService, Template, TemplateCollection } from '@/lib/services/template-service';
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';

// Draggable Template Item Component
function DraggableTemplate({ template, onEdit, onDuplicate, onDelete, onToggleActive }: {
  template: Template;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'denial': 'bg-red-100 text-red-800 border-red-200',
      'approval': 'bg-green-100 text-green-800 border-green-200',
      'appeal': 'bg-blue-100 text-blue-800 border-blue-200',
      'prior-auth': 'bg-purple-100 text-purple-800 border-purple-200',
      'general': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'published': 'bg-green-100 text-green-800 border-green-200',
      'archived': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  return (
    <div className="template-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <DocumentSolidIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
            )}
          </div>
        </div>
        
        {/* Actions Menu */}
        <div className="flex items-center gap-2 ml-4">
          {/* Active/Inactive Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
            className={classNames(
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2",
              template.isActive ? "bg-purple-600" : "bg-gray-200"
            )}
          >
            <span
              className={classNames(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                template.isActive ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>

          {/* More Actions */}
          <div className="relative">
            <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {/* Dropdown would be implemented here */}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={classNames(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
          getCategoryColor(template.category)
        )}>
          {template.category}
        </span>
        <span className={classNames(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
          getStatusColor(template.status)
        )}>
          {template.status}
        </span>
        {template.tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-3">
        <div>
          <span className="font-medium">Created:</span>
          <div>{formatDate(template.createdAt)}</div>
        </div>
        <div>
          <span className="font-medium">Updated:</span>
          <div>{formatDate(template.updatedAt)}</div>
        </div>
      </div>

      {/* Variables */}
      {template.variables && template.variables.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-700">Variables:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {template.variables.slice(0, 3).map((variable, index) => (
              <span
                key={index}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-purple-50 text-purple-700 border border-purple-200"
              >
                {{{variable}}}
              </span>
            ))}
            {template.variables.length > 3 && (
              <span className="text-xs text-gray-500">
                +{template.variables.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
          >
            <PencilIcon className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={onDuplicate}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
          >
            <DocumentDuplicateIcon className="w-3 h-3" />
            Duplicate
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">v{template.version}</span>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Collection Section Component
function CollectionSection({ 
  collection, 
  templates, 
  isExpanded, 
  onToggleExpanded, 
  onEditCollection,
  onDeleteCollection,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onToggleTemplateActive
}: {
  collection: TemplateCollection;
  templates: Template[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEditCollection: () => void;
  onDeleteCollection: () => void;
  onEditTemplate: (template: Template) => void;
  onDuplicateTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template) => void;
  onToggleTemplateActive: (template: Template) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Collection Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: collection.color }}
          />
          <span className="text-lg mr-2">{collection.icon}</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{collection.name}</h2>
            {collection.description && (
              <p className="text-sm text-gray-600">{collection.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </span>
          
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onEditCollection}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              title="Edit Collection"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onDeleteCollection}
              className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
              title="Delete Collection"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-500 mb-4">This collection is empty. Start by creating your first template.</p>
              <button
                onClick={() => window.location.href = '/template-builder'}
                className={classNames(buttonStyles.primary, "inline-flex items-center gap-2")}
              >
                <PlusIcon className="w-4 h-4" />
                Create Template
              </button>
            </div>
          ) : (
            <SortableContext items={templates.map(t => t.id!)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <DraggableTemplate
                    key={template.id}
                    template={template}
                    onEdit={() => onEditTemplate(template)}
                    onDuplicate={() => onDuplicateTemplate(template)}
                    onDelete={() => onDeleteTemplate(template)}
                    onToggleActive={() => onToggleTemplateActive(template)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

import EditCollectionModal from '@/components/templates/EditCollectionModal';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [collections, setCollections] = useState<TemplateCollection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<TemplateCollection | undefined>();
  
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [collectionsData, templatesData] = await Promise.all([
        templateService.getCollections(),
        templateService.getAllTemplates()
      ]);
      
      setCollections(collectionsData);
      setTemplates(templatesData);
      
      // Expand all collections by default
      const collectionIds = new Set(collectionsData.map(c => c.id!));
      setExpandedCollections(collectionIds);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = searchTerm.trim()
    ? templates.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : templates;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Handle moving template to different collection
      const templateId = active.id as string;
      const newCollectionId = over.id as string;
      
      try {
        await templateService.updateTemplate(templateId, {
          collectionId: newCollectionId,
          collectionName: collections.find(c => c.id === newCollectionId)?.name || 'Unknown'
        });
        
        await loadData();
      } catch (error) {
        console.error('Error moving template:', error);
        alert('Failed to move template. Please try again.');
      }
    }
    
    setActiveId(null);
  };

  const toggleCollectionExpanded = (collectionId: string) => {
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
      const newName = prompt('Enter name for duplicated template:', `${template.name} (Copy)`);
      if (newName && newName.trim()) {
        await templateService.duplicateTemplate(template.id!, newName.trim());
        await loadData();
        alert('Template duplicated successfully!');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await templateService.deleteTemplate(template.id!);
        await loadData();
        alert('Template deleted successfully!');
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template. Please try again.');
      }
    }
  };

  const handleEditCollection = (collection?: TemplateCollection) => {
    setEditingCollection(collection);
    setShowEditModal(true);
  };

  const handleDeleteCollection = async (collection: TemplateCollection) => {
    if (confirm(`Are you sure you want to delete the "${collection.name}" collection? This will not delete the templates inside it.`)) {
      try {
        await templateService.deleteCollection(collection.id!);
        await loadData();
        alert('Collection deleted successfully!');
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Failed to delete collection. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your template collections and documents
              </p>
            </div>
            <button
              onClick={() => router.push('/template-builder')}
              className={classNames(buttonStyles.primary, "flex items-center gap-2")}
            >
              <PlusIcon className="w-5 h-5" />
              New Template
            </button>
          </div>
        </div>

        {/* Top Cards */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Templates Card */}
            <div className="nav-card bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <DocumentTextIcon className="w-8 h-8 mb-2" />
                  <h3 className="font-semibold">Templates</h3>
                  <p className="text-sm opacity-90">{templates.length} Templates</p>
                </div>
                <span className="text-3xl font-bold opacity-75">T</span>
              </div>
            </div>

            {/* Components Card */}
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/components')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CubeIcon className="w-8 h-8 mb-2" />
                  <h3 className="font-semibold">Components</h3>
                  <p className="text-sm opacity-90">Reusable Elements</p>
                </div>
                <span className="text-3xl font-bold opacity-75">C</span>
              </div>
            </div>

            {/* Variables Card */}
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/variables')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <HashtagIcon className="w-8 h-8 mb-2" />
                  <h3 className="font-semibold">Variables</h3>
                  <p className="text-sm opacity-90">Dynamic Content</p>
                </div>
                <span className="text-3xl font-bold opacity-75">V</span>
              </div>
            </div>

            {/* Settings Card */}
            <div className="nav-card bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <Cog6ToothIcon className="w-8 h-8 mb-2" />
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-sm opacity-90">Configuration</p>
                </div>
                <span className="text-3xl font-bold opacity-75">S</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="template-search pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            {/* Create Collection Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleCreateCollection}
                className={classNames(buttonStyles.secondary, "flex items-center gap-2")}
              >
                <FolderIcon className="w-4 h-4" />
                New Collection
              </button>
            </div>

            {collections.map((collection) => {
              const collectionTemplates = filteredTemplates.filter(
                template => template.collectionId === collection.id
              );
              
              return (
                <CollectionSection
                  key={collection.id}
                  collection={collection}
                  templates={collectionTemplates}
                  isExpanded={expandedCollections.has(collection.id!)}
                  onToggleExpanded={() => toggleCollectionExpanded(collection.id!)}
                  onEditCollection={() => handleEditCollection(collection)}
                  onDeleteCollection={() => handleDeleteCollection(collection)}
                  onEditTemplate={handleEditTemplate}
                  onDuplicateTemplate={handleDuplicateTemplate}
                  onDeleteTemplate={handleDeleteTemplate}
                  onToggleTemplateActive={handleToggleTemplateActive}
                />
              );
            })}
          </div>
        </div>

        {/* Edit Collection Modal */}
        <EditCollectionModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={loadData}
          collection={editingCollection}
        />

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg opacity-90">
              <div className="flex items-center gap-2">
                <DocumentSolidIcon className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Moving template...</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
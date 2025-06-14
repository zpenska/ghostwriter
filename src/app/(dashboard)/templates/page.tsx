'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { templateService, Template, TemplateCollection } from '@/lib/services/template-service';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [collections, setCollections] = useState<TemplateCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, collectionsData] = await Promise.all([
        templateService.getTemplates(),
        templateService.getCollections(),
      ]);
      setTemplates(templatesData);
      setCollections(collectionsData);
      setExpandedCollections(new Set(collectionsData.map(c => c.id!)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const search = searchTerm.toLowerCase();
    return (
      template.name?.toLowerCase().includes(search) ||
      template.description?.toLowerCase().includes(search) ||
      template.category?.toLowerCase().includes(search) ||
      template.content?.toLowerCase().includes(search) ||
      template.tags?.some(tag => tag.toLowerCase().includes(search))
    );
  });

  const getTemplatesForCollection = (collectionId: string) => {
    return filteredTemplates.filter(t => t.collectionId === collectionId);
  };

  const handleEditTemplate = (template: Template) => router.push(`/template-builder?id=${template.id}`);
  const handleDuplicateTemplate = async (template: Template) => {
    await templateService.createTemplate({ ...template, name: `${template.name} (Copy)` });
    await loadData();
  };
  const handleDeleteTemplate = async (template: Template) => {
    if (confirm(`Delete "${template.name}"?`)) {
      await templateService.deleteTemplate(template.id!);
      await loadData();
    }
  };
  const handleToggleTemplateActive = async (template: Template) => {
    await templateService.updateTemplate(template.id!, { isActive: !template.isActive });
    await loadData();
  };

  const toggleCollection = (id: string) => {
    const updated = new Set(expandedCollections);
    updated.has(id) ? updated.delete(id) : updated.add(id);
    setExpandedCollections(updated);
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const templateId = active.id as string;
    const targetCollectionId = over.id as string;
    await templateService.updateTemplate(templateId, { collectionId: targetCollectionId });
    await loadData();
    setActiveId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-2">Manage your letter templates and collections</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => router.push('/template-builder')}
            color="indigo"
            className="h-24 flex flex-col items-center justify-center text-center p-4"
          >
            <PlusIcon className="h-6 w-6 mb-2" />
            <div className="font-semibold">New Template</div>
            <div className="text-xs opacity-90">Create a new letter template</div>
          </Button>
          
          <Button
            onClick={() => router.push('/templates/components')}
            color="zinc"
            className="h-24 flex flex-col items-center justify-center text-center p-4"
          >
            <div className="font-semibold">Components</div>
            <div className="text-xs opacity-90">Reusable content blocks</div>
          </Button>
          
          <Button
            onClick={() => router.push('/templates/variables')}
            color="emerald"
            className="h-24 flex flex-col items-center justify-center text-center p-4"
          >
            <div className="font-semibold">Variables</div>
            <div className="text-xs opacity-90">Dynamic fields & tokens</div>
          </Button>
          
          <Button
            onClick={() => router.push('/settings')}
            outline
            className="h-24 flex flex-col items-center justify-center text-center p-4"
          >
            <div className="font-semibold">Settings</div>
            <div className="text-xs opacity-90">Configure preferences</div>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Collections */}
        <div className="space-y-4">
          {collections.map((collection) => {
            const templatesInCollection = getTemplatesForCollection(collection.id!);
            const isExpanded = expandedCollections.has(collection.id!);

            return (
              <div key={collection.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <button
                  onClick={() => toggleCollection(collection.id!)}
                  className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 rounded-t-lg"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    )}
                    <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                    <span className="text-sm text-gray-500">
                      ({templatesInCollection.length} template{templatesInCollection.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </button>
                
                {isExpanded && templatesInCollection.length > 0 && (
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <SortableContext items={templatesInCollection.map(t => t.id!)}>
                            {templatesInCollection.map((template) => (
                              <tr key={template.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{template.name}</div>
                                  {template.tags && template.tags.length > 0 && (
                                    <div className="text-sm text-gray-500">{template.tags.join(', ')}</div>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-900">{template.description}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {template.createdAt?.toDate().toLocaleDateString()}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {template.updatedAt?.toDate().toLocaleDateString()}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {template.status || 'Draft'}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() => handleToggleTemplateActive(template)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                      template.isActive ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                                        template.isActive ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      plain
                                      onClick={() => handleEditTemplate(template)}
                                      className="p-1"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      plain
                                      onClick={() => handleDuplicateTemplate(template)}
                                      className="p-1"
                                    >
                                      <DocumentDuplicateIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      plain
                                      onClick={() => handleDeleteTemplate(template)}
                                      className="p-1 text-red-600 hover:text-red-700"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </SortableContext>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {isExpanded && templatesInCollection.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-500 border-t border-gray-200">
                    No templates in this collection
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white p-4 rounded-lg shadow-lg border text-sm text-gray-900">
              {templates.find(t => t.id === activeId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
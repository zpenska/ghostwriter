// FULL FILE REPLACEMENT FOR templates/page.tsx
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

  if (loading) return <div className="text-center py-16">Loading...</div>;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-zinc-800">Templates</h1>
        <p className="text-zinc-500">Manage your letter templates and collections</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => router.push('/template-builder')} className="bg-[#8a7fae] text-white rounded-2xl p-4 transition-transform duration-200 hover:scale-[1.03] shadow-md">
            <div className="font-semibold text-lg">New Template</div>
            <div className="text-sm">Create a new letter template</div>
          </button>
          <button onClick={() => router.push('/components')} className="bg-[#3a4943] text-white rounded-2xl p-4 transition-transform duration-200 hover:scale-[1.03] shadow-md">
            <div className="font-semibold text-lg">Components</div>
            <div className="text-sm">Reusable content blocks</div>
          </button>
          <button onClick={() => router.push('/variables')} className="bg-[#b9cab3] text-[#3d3d3c] rounded-2xl p-4 transition-transform duration-200 hover:scale-[1.03] shadow-md">
            <div className="font-semibold text-lg">Variables</div>
            <div className="text-sm">Dynamic fields & tokens</div>
          </button>
          <button onClick={() => router.push('/settings')} className="bg-[#a88868] text-white rounded-2xl p-4 transition-transform duration-200 hover:scale-[1.03] shadow-md">
            <div className="font-semibold text-lg">Settings</div>
            <div className="text-sm">Configure preferences</div>
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="pl-10 pr-4 py-2 w-full border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {collections.map((collection) => {
          const templatesInCollection = getTemplatesForCollection(collection.id!);
          const isExpanded = expandedCollections.has(collection.id!);

          return (
            <div key={collection.id} className="bg-white shadow border rounded-2xl">
              <div onClick={() => toggleCollection(collection.id!)} className="flex justify-between items-center p-4 cursor-pointer hover:bg-zinc-50">
                <div className="flex gap-3 items-center">
                  {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                  <div className="font-semibold text-zinc-800 text-lg">{collection.name}</div>
                  <span className="text-sm text-zinc-400">({templatesInCollection.length} templates)</span>
                </div>
              </div>
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-zinc-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-left">Created</th>
                        <th className="px-4 py-2 text-left">Updated</th>
                        <th className="px-4 py-2 text-left">Tags</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Active</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <SortableContext items={templatesInCollection.map(t => t.id!)}>
                        {templatesInCollection.map(template => (
                          <tr key={template.id} className="border-t hover:bg-zinc-50">
                            <td className="px-4 py-2 font-medium text-zinc-800">{template.name}</td>
                            <td className="px-4 py-2 text-zinc-600">{template.description}</td>
                            <td className="px-4 py-2 text-zinc-500">{template.createdAt?.toDate().toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-zinc-500">{template.updatedAt?.toDate().toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-zinc-500">{template.tags?.join(', ')}</td>
                            <td className="px-4 py-2">
                              <span className="inline-block rounded-full px-2 py-1 text-xs bg-purple-100 text-purple-800">
                                {template.status}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <button onClick={() => handleToggleTemplateActive(template)} className={`w-10 h-5 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-zinc-300'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transform ${template.isActive ? 'translate-x-5' : 'translate-x-1'} transition-transform`} />
                              </button>
                            </td>
                            <td className="px-4 py-2 space-x-2">
                              <button onClick={() => handleEditTemplate(template)} title="Edit">
                                <PencilIcon className="w-4 h-4 text-zinc-500 hover:text-purple-600" />
                              </button>
                              <button onClick={() => handleDuplicateTemplate(template)} title="Duplicate">
                                <DocumentDuplicateIcon className="w-4 h-4 text-zinc-500 hover:text-blue-600" />
                              </button>
                              <button onClick={() => handleDeleteTemplate(template)} title="Delete">
                                <TrashIcon className="w-4 h-4 text-zinc-500 hover:text-red-600" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </SortableContext>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        <DragOverlay>
          {activeId ? (
            <div className="bg-white p-4 rounded-lg shadow text-sm text-zinc-800">
              {templates.find(t => t.id === activeId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

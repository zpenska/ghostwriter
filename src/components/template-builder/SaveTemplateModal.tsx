'use client';

import { useState, useEffect } from 'react';
import { X, FolderPlus, Save, Plus } from 'lucide-react';
import { templateService, TemplateCollection } from '@/lib/services/template-service';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: {
    name: string;
    description: string;
    collectionId: string;
    collectionName: string;
    category: string;
    status: string;
    tags: string[];
    closeAfterSave?: boolean;
  }) => void;
  currentContent: string;
  existingTemplate?: {
    id: string;
    name: string;
    description?: string;
    collectionId: string;
    category: string;
    status: string;
    tags: string[];
  };
  saveType?: 'draft' | 'publish'; // Indicates which button was clicked
}

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function SaveTemplateModal({
  isOpen,
  onClose,
  onSave,
  currentContent,
  existingTemplate,
  saveType = 'draft'
}: SaveTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collectionId: '',
    category: 'general',
    status: saveType === 'publish' ? 'published' : 'draft',
    tags: [] as string[]
  });
  
  const [collections, setCollections] = useState<TemplateCollection[]>([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionData, setNewCollectionData] = useState({
    name: '',
    description: '',
    color: '#71717a'
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const categories = [
    { value: 'denial', label: 'Denial Letters' },
    { value: 'approval', label: 'Approval Letters' },
    { value: 'appeal', label: 'Appeal Responses' },
    { value: 'prior-auth', label: 'Prior Authorization' },
    { value: 'general', label: 'General' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' }
  ];

  const colorOptions = [
    '#71717a', '#3b82f6', '#10b981', '#f59e0b', 
    '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
  ];

  useEffect(() => {
    if (isOpen) {
      loadCollections();
      
      // Pre-fill form if editing existing template
      if (existingTemplate) {
        setFormData({
          name: existingTemplate.name,
          description: existingTemplate.description || '',
          collectionId: existingTemplate.collectionId,
          category: existingTemplate.category,
          status: existingTemplate.status,
          tags: existingTemplate.tags
        });
      } else {
        // Reset form for new template
        setFormData({
          name: '',
          description: '',
          collectionId: '',
          category: 'general',
          status: 'draft',
          tags: []
        });
      }
    }
  }, [isOpen, existingTemplate]);

  const loadCollections = async () => {
    try {
      const collectionsData = await templateService.getCollections();
      setCollections(collectionsData);
      
      // Auto-select first collection if none selected
      if (!formData.collectionId && collectionsData.length > 0) {
        setFormData(prev => ({ ...prev, collectionId: collectionsData[0].id! }));
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionData.name.trim()) return;
    
    setLoading(true);
    try {
      const collectionId = await templateService.createCollection({
        ...newCollectionData,
        createdBy: 'current-user', // Replace with actual user ID
        isActive: true,
        icon: 'folder' // Adding required icon property
      });
      
      setFormData(prev => ({ ...prev, collectionId }));
      setShowNewCollection(false);
      setNewCollectionData({ name: '', description: '', color: '#71717a' });
      await loadCollections();
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.collectionId) {
      alert('Please fill in all required fields.');
      return;
    }

    const selectedCollection = collections.find(c => c.id === formData.collectionId);
    
    onSave({
      ...formData,
      collectionName: selectedCollection?.name || 'Unknown Collection',
      closeAfterSave: saveType === 'publish'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <h2 className="text-xl font-semibold text-zinc-900">
            {existingTemplate ? 'Update Template' : 'Save Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 bg-white"
              placeholder="Enter template name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 bg-white"
              rows={3}
              placeholder="Describe this template..."
            />
          </div>

          {/* Collection Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Collection *
            </label>
            <div className="flex gap-2">
              <select
                value={formData.collectionId}
                onChange={(e) => setFormData(prev => ({ ...prev, collectionId: e.target.value }))}
                className="flex-1 border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 bg-white"
                required
              >
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCollection(true)}
                className="inline-flex items-center gap-1 px-3 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
              >
                <FolderPlus className="w-4 h-4" />
                New
              </button>
            </div>
          </div>

          {/* New Collection Form */}
          {showNewCollection && (
            <div className="bg-zinc-50 p-4 rounded-lg space-y-4 border border-zinc-200">
              <h3 className="text-sm font-medium text-zinc-900">Create New Collection</h3>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newCollectionData.name}
                  onChange={(e) => setNewCollectionData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-zinc-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 bg-white"
                  placeholder="Collection name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Color</label>
                <div className="flex gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCollectionData(prev => ({ ...prev, color }))}
                      className={classNames(
                        "w-6 h-6 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2",
                        newCollectionData.color === color ? "border-zinc-800" : "border-zinc-300"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateCollection}
                  disabled={loading || !newCollectionData.name.trim()}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                >
                  {loading ? 'Creating...' : 'Create Collection'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCollection(false)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 bg-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 bg-white"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 bg-white"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="inline-flex items-center gap-1 px-3 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-zinc-800 text-xs rounded-full border border-zinc-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-600 hover:text-zinc-800 p-0 ml-1 rounded-full focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
            <button 
              type="button" 
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            {saveType === 'publish' && (
              <button
                type="button"
                onClick={() => {
                  const selectedCollection = collections.find(c => c.id === formData.collectionId);
                  onSave({
                    ...formData,
                    status: 'draft',
                    collectionName: selectedCollection?.name || 'Unknown Collection'
                  });
                }}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 
                saveType === 'publish' ? 'Save & Close' : 
                existingTemplate ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { X, FolderPlus, Save, Plus } from 'lucide-react';
import { templateService, TemplateCollection } from '@/lib/services/template-service';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

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
    color: '#8a7fae',
    icon: '📄'
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
    '#8a7fae', '#3b82f6', '#10b981', '#f59e0b', 
    '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
  ];

  const iconOptions = ['📄', '📋', '📝', '🏥', '💊', '🩺', '📊', '📑'];

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
        isActive: true
      });
      
      setFormData(prev => ({ ...prev, collectionId }));
      setShowNewCollection(false);
      setNewCollectionData({ name: '', description: '', color: '#8a7fae', icon: '📄' });
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
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {existingTemplate ? 'Update Template' : 'Save Template'}
          </h2>
          <Button
            plain
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter template name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Describe this template..."
            />
          </div>

          {/* Collection Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection *
            </label>
            <div className="flex gap-2">
              <select
                value={formData.collectionId}
                onChange={(e) => setFormData(prev => ({ ...prev, collectionId: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.icon} {collection.name}
                  </option>
                ))}
              </select>
              <Button
                outline
                type="button"
                onClick={() => setShowNewCollection(true)}
                className="flex items-center gap-1"
              >
                <FolderPlus className="w-4 h-4" />
                New
              </Button>
            </div>
          </div>

          {/* New Collection Form */}
          {showNewCollection && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Create New Collection</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newCollectionData.name}
                    onChange={(e) => setNewCollectionData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    placeholder="Collection name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={newCollectionData.icon}
                    onChange={(e) => setNewCollectionData(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    {iconOptions.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                <div className="flex gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCollectionData(prev => ({ ...prev, color }))}
                      className={cn(
                        "w-6 h-6 rounded-full border-2",
                        newCollectionData.color === color ? "border-gray-800" : "border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  color="indigo"
                  type="button"
                  onClick={handleCreateCollection}
                  disabled={loading || !newCollectionData.name.trim()}
                  className="text-sm"
                >
                  {loading ? 'Creating...' : 'Create Collection'}
                </Button>
                <Button
                  outline
                  type="button"
                  onClick={() => setShowNewCollection(false)}
                  className="text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add a tag..."
              />
              <Button
                outline
                type="button"
                onClick={handleAddTag}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                  >
                    {tag}
                    <Button
                      plain
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-indigo-600 hover:text-indigo-800 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button outline type="button" onClick={onClose}>
              Cancel
            </Button>
            {saveType === 'publish' && (
              <Button
                outline
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
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </Button>
            )}
            <Button
              color="indigo"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 
                saveType === 'publish' ? 'Save & Close' : 
                existingTemplate ? 'Update Template' : 'Save Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
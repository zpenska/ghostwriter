'use client';

import { useState, useEffect } from 'react';
import { X, Save, FolderIcon } from 'lucide-react';
import { templateService, TemplateCollection } from '@/lib/services/template-service';

interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  collection?: TemplateCollection;
}

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function EditCollectionModal({
  isOpen,
  onClose,
  onSave,
  collection
}: EditCollectionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#71717a'
  });
  const [loading, setLoading] = useState(false);

  const colorOptions = [
    '#71717a', '#3b82f6', '#10b981', '#f59e0b', 
    '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
    '#f97316', '#ec4899', '#6366f1', '#14b8a6'
  ];

  useEffect(() => {
    if (isOpen) {
      if (collection) {
        setFormData({
          name: collection.name,
          description: collection.description || '',
          color: collection.color
        });
      } else {
        setFormData({
          name: '',
          description: '',
          color: '#71717a'
        });
      }
    }
  }, [isOpen, collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a collection name.');
      return;
    }

    setLoading(true);
    try {
      if (collection?.id) {
        // Update existing collection
        await templateService.updateCollection(collection.id, formData);
      } else {
        // Create new collection
        await templateService.createCollection({
          ...formData,
          createdBy: 'current-user',
          isActive: true,
          icon: ''
        });
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <h2 className="text-xl font-semibold text-zinc-900 flex items-center gap-2">
            <FolderIcon className="w-6 h-6 text-zinc-600" />
            {collection ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Collection Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 bg-white"
              placeholder="Enter collection name"
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
              placeholder="Describe this collection..."
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={classNames(
                    "w-8 h-8 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2",
                    formData.color === color ? "border-zinc-800 scale-110" : "border-zinc-300"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Preview
            </label>
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full border border-zinc-200"
                style={{ backgroundColor: formData.color }}
              />
              <FolderIcon className="w-5 h-5 text-zinc-600" />
              <span className="font-medium text-zinc-900">
                {formData.name || 'Collection Name'}
              </span>
            </div>
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
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : collection ? 'Update Collection' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
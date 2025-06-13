// src/components/templates/EditCollectionModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Save, FolderIcon } from 'lucide-react';
import { templateService, TemplateCollection } from '@/lib/services/template-service';
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';

interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  collection?: TemplateCollection;
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
    color: '#8a7fae',
    icon: '📄'
  });
  const [loading, setLoading] = useState(false);

  const colorOptions = [
    '#8a7fae', '#3b82f6', '#10b981', '#f59e0b', 
    '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
    '#f97316', '#ec4899', '#6366f1', '#14b8a6'
  ];

  const iconOptions = [
    '📄', '📋', '📝', '🏥', '💊', '🩺', '📊', '📑',
    '📌', '📎', '📁', '🗂️', '📚', '📓', '📘', '📙'
  ];

  useEffect(() => {
    if (isOpen) {
      if (collection) {
        setFormData({
          name: collection.name,
          description: collection.description || '',
          color: collection.color,
          icon: collection.icon
        });
      } else {
        setFormData({
          name: '',
          description: '',
          color: '#8a7fae',
          icon: '📄'
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
          isActive: true
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
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FolderIcon className="w-6 h-6" />
            {collection ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Collection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter collection name"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Describe this collection..."
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className={classNames(
                    "p-2 text-lg border rounded-md hover:bg-gray-50 transition-colors",
                    formData.icon === icon ? "border-purple-500 bg-purple-50" : "border-gray-300"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={classNames(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    formData.color === color ? "border-gray-800 scale-110" : "border-gray-300"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: formData.color }}
              />
              <span className="text-lg">{formData.icon}</span>
              <span className="font-medium text-gray-900">
                {formData.name || 'Collection Name'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className={buttonStyles.secondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={classNames(buttonStyles.primary, "flex items-center gap-2")}
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
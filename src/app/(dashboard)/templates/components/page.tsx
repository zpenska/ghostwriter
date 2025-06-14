'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PuzzlePieceIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface Component {
  id?: string;
  name: string;
  description?: string;
  content: string;
  category: string;
  tags?: string[];
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export default function ComponentsPage() {
  const router = useRouter();
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const categories = [
    { value: 'all', label: 'All Components' },
    { value: 'header', label: 'Headers' },
    { value: 'footer', label: 'Footers' },
    { value: 'signature', label: 'Signatures' },
    { value: 'disclaimer', label: 'Disclaimers' },
    { value: 'address', label: 'Addresses' },
    { value: 'contact', label: 'Contact Info' },
    { value: 'custom', label: 'Custom' }
  ];

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'components'), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const componentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Component));
      setComponents(componentsData);
    } catch (error) {
      console.error('Error loading components:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComponent = async (componentData: Omit<Component, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addDoc(collection(db, 'components'), {
        ...componentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await loadComponents();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating component:', error);
      alert('Failed to create component');
    }
  };

  const handleUpdateComponent = async (componentId: string, updates: Partial<Component>) => {
    try {
      await updateDoc(doc(db, 'components', componentId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      await loadComponents();
    } catch (error) {
      console.error('Error updating component:', error);
      alert('Failed to update component');
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      try {
        await deleteDoc(doc(db, 'components', componentId));
        await loadComponents();
      } catch (error) {
        console.error('Error deleting component:', error);
        alert('Failed to delete component');
      }
    }
  };

  const handleDuplicateComponent = async (component: Component) => {
    try {
      const duplicatedComponent = {
        ...component,
        name: `${component.name} (Copy)`,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined
      };
      await handleCreateComponent(duplicatedComponent);
    } catch (error) {
      console.error('Error duplicating component:', error);
      alert('Failed to duplicate component');
    }
  };

  // Filter components based on search and category
  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      'header': 'bg-blue-100 text-blue-800',
      'footer': 'bg-green-100 text-green-800',
      'signature': 'bg-indigo-100 text-indigo-800',
      'disclaimer': 'bg-yellow-100 text-yellow-800',
      'address': 'bg-violet-100 text-violet-800',
      'contact': 'bg-pink-100 text-pink-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Components</h1>
            <p className="text-sm text-gray-500 mt-1">
              Reusable content blocks for your templates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              outline
              onClick={() => router.push('/templates')}
              className="flex items-center gap-2"
            >
              Back to Templates
            </Button>
            <Button
              color="indigo"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              New Component
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Components Grid */}
      <div className="flex-1 overflow-auto p-6">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-12">
            <PuzzlePieceIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No components found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first reusable component'
              }
            </p>
            {(!searchTerm && selectedCategory === 'all') && (
              <Button
                color="indigo"
                onClick={() => setShowCreateModal(true)}
              >
                Create Component
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredComponents.map((component) => (
              <div key={component.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                      {component.name}
                    </h3>
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      getCategoryColor(component.category)
                    )}>
                      {component.category}
                    </span>
                  </div>
                  <div className="relative">
                    <Button plain className="p-1">
                      <EllipsisVerticalIcon className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>

                {component.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {component.description}
                  </p>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  <div className="bg-gray-50 rounded p-2 font-mono text-xs overflow-hidden">
                    <div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: component.content }} />
                  </div>
                </div>

                {component.tags && component.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {component.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        #{tag}
                      </span>
                    ))}
                    {component.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{component.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Button
                      plain
                      onClick={() => {
                        // TODO: Open edit modal
                        console.log('Edit component:', component.id);
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Edit Component"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      plain
                      onClick={() => handleDuplicateComponent(component)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Duplicate Component"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      plain
                      onClick={() => handleDeleteComponent(component.id!)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete Component"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {component.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      component.isActive ? 'bg-green-400' : 'bg-gray-300'
                    )} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Component Modal - TODO: Implement */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Create New Component</h3>
              <p className="text-sm text-gray-600 mb-4">
                This feature will be implemented in the next version.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  outline
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  color="indigo"
                  onClick={() => setShowCreateModal(false)}
                >
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
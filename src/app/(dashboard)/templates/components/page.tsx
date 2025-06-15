// src/app/(dashboard)/templates/components/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
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
  DocumentDuplicateIcon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  PhotoIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { classNames } from '@/lib/utils/cn';

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
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Component form state
  const [componentForm, setComponentForm] = useState({
    name: '',
    description: '',
    category: 'header',
    tags: [] as string[],
    isActive: true
  });

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

  // Tiptap editor for component content with Image support
  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Highlight,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Start typing your component content...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 border border-zinc-300 rounded-md',
      },
    },
  });

  useEffect(() => {
    loadComponents();
  }, []);

  useEffect(() => {
    if (editingComponent && editor) {
      editor.commands.setContent(editingComponent.content || '');
      setComponentForm({
        name: editingComponent.name,
        description: editingComponent.description || '',
        category: editingComponent.category,
        tags: editingComponent.tags || [],
        isActive: editingComponent.isActive
      });
    } else if (!editingComponent && editor) {
      editor.commands.setContent('');
      setComponentForm({
        name: '',
        description: '',
        category: 'header',
        tags: [],
        isActive: true
      });
    }
  }, [editingComponent, editor]);

  const loadComponents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading components from Firebase...');
      
      // Simple query first
      const q = query(collection(db, 'components'), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      console.log('📦 Found', querySnapshot.size, 'components');
      
      const componentsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Component:', doc.id, data);
        return {
          id: doc.id,
          ...data
        } as Component;
      });
      
      setComponents(componentsData);
      console.log('✅ Components loaded:', componentsData.length);
    } catch (error) {
      console.error('❌ Error loading components:', error);
      
      // Try without orderBy if that fails
      try {
        console.log('🔄 Trying simpler query...');
        const simpleSnapshot = await getDocs(collection(db, 'components'));
        const simpleData = simpleSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Component));
        setComponents(simpleData);
        console.log('✅ Simple query worked, loaded:', simpleData.length);
      } catch (simpleError) {
        console.error('❌ Simple query failed:', simpleError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        editor?.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveComponent = async () => {
    if (!editor || !componentForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const componentData = {
        ...componentForm,
        content: editor.getHTML(),
        updatedAt: serverTimestamp()
      };

      if (editingComponent?.id) {
        await updateDoc(doc(db, 'components', editingComponent.id), componentData);
      } else {
        await addDoc(collection(db, 'components'), {
          ...componentData,
          createdAt: serverTimestamp()
        });
      }

      await loadComponents();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving component:', error);
      alert('Failed to save component');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingComponent(null);
    setComponentForm({
      name: '',
      description: '',
      category: 'header',
      tags: [],
      isActive: true
    });
    if (editor) {
      editor.commands.setContent('');
    }
  };

  const handleEditComponent = (component: Component) => {
    setEditingComponent(component);
    setShowCreateModal(true);
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
      
      await addDoc(collection(db, 'components'), {
        ...duplicatedComponent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await loadComponents();
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
      'header': 'bg-blue-50 text-blue-700 border-blue-200',
      'footer': 'bg-green-50 text-green-700 border-green-200',
      'signature': 'bg-purple-50 text-purple-700 border-purple-200',
      'disclaimer': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'address': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'contact': 'bg-pink-50 text-pink-700 border-pink-200',
      'custom': 'bg-zinc-50 text-zinc-700 border-zinc-200'
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-4 text-sm text-zinc-600">Loading components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/templates')}
              className="inline-flex items-center space-x-2 text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Templates</span>
            </button>
            <div className="border-l border-zinc-300 pl-4">
              <h1 className="text-xl font-semibold text-zinc-900">Components</h1>
              <p className="text-sm text-zinc-600 mt-1">
                Reusable content blocks for your letters
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New Component</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-zinc-300 pl-10 pr-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-lg border-zinc-300 px-3 py-2 pr-8 text-sm focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 appearance-none bg-white"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          </div>

          <div className="text-sm text-zinc-600">
            {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Components Grid */}
      <div className="flex-1 overflow-auto p-6">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
              <PuzzlePieceIcon className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 mb-2">No components found</h3>
            <p className="text-zinc-600 mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first reusable component to get started'
              }
            </p>
            {(!searchTerm && selectedCategory === 'all') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create Component</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredComponents.map((component) => (
              <div key={component.id} className="bg-white rounded-lg border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-zinc-900 truncate mb-2">
                        {component.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={classNames(
                          "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border",
                          getCategoryColor(component.category)
                        )}>
                          {component.category}
                        </span>
                        <div className={classNames(
                          "w-2 h-2 rounded-full",
                          component.isActive ? 'bg-emerald-400' : 'bg-zinc-300'
                        )} />
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditComponent(component)}
                        className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-700 transition-colors"
                        title="Edit Component"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateComponent(component)}
                        className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-700 transition-colors"
                        title="Duplicate Component"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteComponent(component.id!)}
                        className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-red-600 transition-colors"
                        title="Delete Component"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {component.description && (
                    <p className="text-sm text-zinc-600 mb-3 line-clamp-2">
                      {component.description}
                    </p>
                  )}

                  <div className="bg-zinc-50 rounded-lg p-3 mb-4">
                    <div 
                      className="text-xs text-zinc-700 line-clamp-4 prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: component.content || 'No content' }} 
                    />
                  </div>

                  {component.tags && component.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {component.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          #{tag}
                        </span>
                      ))}
                      {component.tags.length > 3 && (
                        <span className="text-xs text-zinc-500 px-2 py-1">
                          +{component.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Component Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-white px-6 py-4 border-b border-zinc-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {editingComponent ? 'Edit Component' : 'Create New Component'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Component Details - 1 column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Component Name *
                      </label>
                      <input
                        type="text"
                        value={componentForm.name}
                        onChange={(e) => setComponentForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter component name..."
                        className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={componentForm.description}
                        onChange={(e) => setComponentForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description..."
                        rows={3}
                        className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Category
                      </label>
                      <select
                        value={componentForm.category}
                        onChange={(e) => setComponentForm(prev => ({ ...prev, category: e.target.value }))}
                        className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 bg-white"
                      >
                        {categories.filter(cat => cat.value !== 'all').map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={componentForm.isActive}
                          onChange={(e) => setComponentForm(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                        />
                        <span className="text-sm font-medium text-zinc-700">Active component</span>
                      </label>
                    </div>
                  </div>

                  {/* Tiptap Editor - 3 columns */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Component Content *
                    </label>
                    
                    {/* Toolbar */}
                    <div className="bg-zinc-50 border border-zinc-300 rounded-t-lg px-3 py-2 flex items-center space-x-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        className={classNames(
                          "p-1.5 rounded hover:bg-zinc-200 transition-colors",
                          editor?.isActive('bold') ? 'bg-zinc-200' : ''
                        )}
                      >
                        <span className="text-sm font-bold">B</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        className={classNames(
                          "p-1.5 rounded hover:bg-zinc-200 transition-colors",
                          editor?.isActive('italic') ? 'bg-zinc-200' : ''
                        )}
                      >
                        <span className="text-sm italic">I</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={classNames(
                          "p-1.5 px-2 rounded hover:bg-zinc-200 transition-colors text-xs font-medium",
                          editor?.isActive('heading', { level: 2 }) ? 'bg-zinc-200' : ''
                        )}
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        className={classNames(
                          "p-1.5 px-2 rounded hover:bg-zinc-200 transition-colors text-sm",
                          editor?.isActive('bulletList') ? 'bg-zinc-200' : ''
                        )}
                      >
                        •
                      </button>
                      
                      {/* File Upload */}
                      <div className="border-l border-zinc-300 pl-2 ml-2">
                        <label className="inline-flex items-center space-x-1 p-1.5 rounded hover:bg-zinc-200 transition-colors cursor-pointer">
                          <PhotoIcon className="h-4 w-4" />
                          <span className="text-xs">Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    
                    {/* Editor Content */}
                    <div className="bg-white border border-t-0 border-zinc-300 rounded-b-lg min-h-[300px]">
                      <EditorContent editor={editor} />
                    </div>
                    
                    <p className="mt-2 text-xs text-zinc-500">
                      Use the toolbar above to format your component content. You can add text, images, and basic formatting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-200 flex items-center justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveComponent}
                  disabled={isSubmitting || !componentForm.name.trim()}
                  className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : (editingComponent ? 'Update Component' : 'Create Component')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
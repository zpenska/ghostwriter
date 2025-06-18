// src/app/(dashboard)/templates/blocks/page.tsx
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
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  ArrowLeftIcon,
  PhotoIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  EyeIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { 
  PuzzlePieceIcon as PuzzlePieceIconSolid,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { classNames } from '@/lib/utils/cn';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface block {
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

export default function BlocksPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<block[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<block | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Block form state
  const [blockForm, setBlockForm] = useState({
    name: '',
    description: '',
    category: 'header',
    tags: [] as string[],
    isActive: true
  });

  const categories = [
    { value: 'all', label: 'All Categories', count: 0 },
    { value: 'header', label: 'Headers', count: 0 },
    { value: 'footer', label: 'Footers', count: 0 },
    { value: 'logo', label: 'Logos', count: 0 },
    { value: 'signature', label: 'Signatures', count: 0 },
    { value: 'disclaimer', label: 'Disclaimers', count: 0 },
    { value: 'address', label: 'Addresses', count: 0 },
    { value: 'contact', label: 'Contact Info', count: 0 },
    { value: 'custom', label: 'Custom', count: 0 }
  ];

  // Update category counts
  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    count: cat.value === 'all' 
      ? blocks.length 
      : blocks.filter(c => c.category === cat.value).length
  }));

  // Tiptap editor for block content with Image support
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
        placeholder: 'Start typing your block content...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  useEffect(() => {
    loadBlocks();
  }, []);

  useEffect(() => {
    if (editingBlock && editor) {
      editor.commands.setContent(editingBlock.content || '');
      setBlockForm({
        name: editingBlock.name,
        description: editingBlock.description || '',
        category: editingBlock.category,
        tags: editingBlock.tags || [],
        isActive: editingBlock.isActive
      });
    } else if (!editingBlock && editor) {
      editor.commands.setContent('');
      setBlockForm({
        name: '',
        description: '',
        category: 'header',
        tags: [],
        isActive: true
      });
    }
  }, [editingBlock, editor]);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'blocks'), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const blocksData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as block;
      });
      
      setBlocks(blocksData);
    } catch (error) {
      console.error('Error loading blocks:', error);
      // Try without orderBy if that fails
      try {
        const simpleSnapshot = await getDocs(collection(db, 'blocks'));
        const simpleData = simpleSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as block));
        setBlocks(simpleData);
      } catch (simpleError) {
        console.error('Simple query failed:', simpleError);
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

  const handleSaveBlock = async () => {
    if (!editor || !blockForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const blockData = {
        ...blockForm,
        content: editor.getHTML(),
        updatedAt: serverTimestamp()
      };

      if (editingBlock?.id) {
        await updateDoc(doc(db, 'blocks', editingBlock.id), blockData);
      } else {
        await addDoc(collection(db, 'blocks'), {
          ...blockData,
          createdAt: serverTimestamp()
        });
      }

      await loadBlocks();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving block:', error);
      alert('Failed to save block');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingBlock(null);
    setBlockForm({
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

  const handleEditBlock = (block: block) => {
    setEditingBlock(block);
    setShowCreateModal(true);
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (confirm('Are you sure you want to delete this block?')) {
      try {
        await deleteDoc(doc(db, 'blocks', blockId));
        await loadBlocks();
      } catch (error) {
        console.error('Error deleting block:', error);
        alert('Failed to delete block');
      }
    }
  };

  const handleDuplicateBlock = async (block: block) => {
    try {
      const duplicatedBlock = {
        ...block,
        name: `${block.name} (Copy)`,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined
      };
      
      await addDoc(collection(db, 'blocks'), {
        ...duplicatedBlock,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await loadBlocks();
    } catch (error) {
      console.error('Error duplicating block:', error);
      alert('Failed to duplicate block');
    }
  };

  // Filter blocks based on search and category
  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         block.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         block.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      'header': 'bg-blue-50 text-blue-800 ring-blue-600/20',
      'footer': 'bg-green-50 text-green-800 ring-green-600/20',
      'logo': 'bg-orange-50 text-orange-800 ring-orange-600/20',
      'signature': 'bg-purple-50 text-purple-800 ring-purple-600/20',
      'disclaimer': 'bg-amber-50 text-amber-800 ring-amber-600/20',
      'address': 'bg-indigo-50 text-indigo-800 ring-indigo-600/20',
      'contact': 'bg-pink-50 text-pink-800 ring-pink-600/20',
      'custom': 'bg-gray-50 text-gray-800 ring-gray-600/20'
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'header': DocumentTextIcon,
      'footer': DocumentTextIcon,
      'logo': PhotoIcon,
      'signature': PencilIcon,
      'disclaimer': XMarkIcon,
      'address': MapPinIcon,
      'contact': PhoneIcon,
      'custom': PuzzlePieceIcon
    };
    return icons[category as keyof typeof icons] || PuzzlePieceIcon;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return 'Unknown';
    }
  };

  const getContentWordCount = (content: string) => {
    if (!content) return 0;
    // Strip HTML tags and count words
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).length : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading blocks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <button
                onClick={() => router.push('/templates')}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Templates
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2">Blocks</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Content Blocks
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Create and manage reusable content blocks for your letter templates
            </p>
          </div>
          <div className="mt-6 flex items-center gap-3 md:ml-4 md:mt-0">
            {/* Search */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-72 rounded-lg border-0 bg-white py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 sm:text-sm sm:leading-6"
                placeholder="Search blocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors"
            >
              <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
              New Block
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Categories</h3>
              <nav className="space-y-1">
                {categoriesWithCounts.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={classNames(
                      selectedCategory === category.value
                        ? 'bg-white text-zinc-900 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50',
                      'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200'
                    )}
                  >
                    <span>{category.label}</span>
                    <span className={classNames(
                      selectedCategory === category.value ? 'text-zinc-600 bg-zinc-100' : 'text-gray-400 bg-gray-200',
                      'ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'
                    )}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Blocks Grid */}
          <div className="lg:col-span-4">
            {filteredBlocks.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-24 w-24 text-gray-300">
                  <PuzzlePieceIconSolid className="h-full w-full" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No blocks found</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria to see more results'
                    : 'Get started by creating your first reusable content block'
                  }
                </p>
                {(!searchTerm && selectedCategory === 'all') && (
                  <div className="mt-8">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors"
                    >
                      <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                      Create your first block
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="group relative bg-white border border-gray-300 rounded-xl p-6 hover:shadow-lg hover:border-gray-400 transition-all duration-200"
                  >
                    {/* Block Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={classNames(
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                          getCategoryColor(block.category)
                        )}>
                          <PuzzlePieceIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {block.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={classNames(
                              'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                              getCategoryColor(block.category)
                            )}>
                              {block.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status & Actions */}
                      <div className="flex items-center gap-2 ml-2">
                        <div className="flex items-center">
                          {block.isActive ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          )}
                        </div>
                        
                        <Menu as="div" className="relative">
                          <Menu.Button className="flex items-center rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2">
                            <span className="sr-only">Open options</span>
                            <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                          </Menu.Button>
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-0 z-10 mt-1 w-48 origin-top-right bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none rounded-lg">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleEditBlock(block)}
                                    className={classNames(
                                      active ? 'bg-gray-50' : '',
                                      'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                                    )}
                                  >
                                    <PencilIcon className="mr-3 h-4 w-4" />
                                    Edit
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleDuplicateBlock(block)}
                                    className={classNames(
                                      active ? 'bg-gray-50' : '',
                                      'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                                    )}
                                  >
                                    <DocumentDuplicateIcon className="mr-3 h-4 w-4" />
                                    Duplicate
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleDeleteBlock(block.id!)}
                                    className={classNames(
                                      active ? 'bg-red-50 text-red-700' : 'text-red-600',
                                      'flex w-full items-center px-4 py-2 text-sm'
                                    )}
                                  >
                                    <TrashIcon className="mr-3 h-4 w-4" />
                                    Delete
                                  </button>
                                )}
                              </Menu.Item>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>
                    </div>

                    {/* Description */}
                    {block.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {block.description}
                      </p>
                    )}

                    {/* Content Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <DocumentTextIcon className="h-4 w-4" />
                        <span>{getContentWordCount(block.content)} words</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(block.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {block.tags && block.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {block.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                          >
                            #{tag}
                          </span>
                        ))}
                        {block.tags.length > 3 && (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            +{block.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Block Modal */}
      {showCreateModal && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl sm:p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900">
                      {editingBlock ? 'Edit Block' : 'Create New Block'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {editingBlock ? 'Update your reusable content block' : 'Create a new reusable content block for your templates'}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="rounded-lg bg-white p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  {/* Block Details */}
                  <div className="space-y-6 lg:col-span-1">
                    <div>
                      <label htmlFor="block-name" className="block text-sm font-medium leading-6 text-gray-900">
                        Block Name <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          id="block-name"
                          value={blockForm.name}
                          onChange={(e) => setBlockForm(prev => ({ ...prev, name: e.target.value }))}
                          className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                          placeholder="Enter block name..."
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="block-description" className="block text-sm font-medium leading-6 text-gray-900">
                        Description
                      </label>
                      <div className="mt-2">
                        <textarea
                          id="block-description"
                          rows={3}
                          value={blockForm.description}
                          onChange={(e) => setBlockForm(prev => ({ ...prev, description: e.target.value }))}
                          className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                          placeholder="Brief description..."
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="block-category" className="block text-sm font-medium leading-6 text-gray-900">
                        Category
                      </label>
                      <div className="mt-2">
                        <select
                          id="block-category"
                          value={blockForm.category}
                          onChange={(e) => setBlockForm(prev => ({ ...prev, category: e.target.value }))}
                          className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6"
                        >
                          {categories.filter(cat => cat.value !== 'all').map(category => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="relative flex items-start">
                      <div className="flex h-6 items-center">
                        <input
                          id="block-active"
                          type="checkbox"
                          checked={blockForm.isActive}
                          onChange={(e) => setBlockForm(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-zinc-600 focus:ring-zinc-600"
                        />
                      </div>
                      <div className="ml-3 text-sm leading-6">
                        <label htmlFor="block-active" className="font-medium text-gray-900">
                          Active block
                        </label>
                        <p className="text-gray-500">Block will be available for use in templates.</p>
                      </div>
                    </div>
                  </div>

                  {/* Tiptap Editor */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium leading-6 text-gray-900 mb-3">
                      Block Content <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Toolbar */}
                    <div className="border border-gray-300 rounded-t-xl bg-gray-50 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editor?.chain().focus().toggleBold().run()}
                          className={classNames(
                            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                            editor?.isActive('bold') 
                              ? 'bg-gray-200 text-gray-900' 
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          Bold
                        </button>
                        <button
                          type="button"
                          onClick={() => editor?.chain().focus().toggleItalic().run()}
                          className={classNames(
                            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                            editor?.isActive('italic') 
                              ? 'bg-gray-200 text-gray-900' 
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          Italic
                        </button>
                        <button
                          type="button"
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                          className={classNames(
                            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                            editor?.isActive('heading', { level: 2 }) 
                              ? 'bg-gray-200 text-gray-900' 
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          H2
                        </button>
                        <div className="border-l border-gray-300 pl-3 ml-3">
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                            <PhotoIcon className="h-4 w-4" />
                            Image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Editor */}
                    <div className="border border-t-0 border-gray-300 rounded-b-xl bg-white min-h-[400px]">
                      <EditorContent editor={editor} />
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="mt-8 flex items-center justify-end gap-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBlock}
                    disabled={isSubmitting || !blockForm.name.trim()}
                    className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      editingBlock ? 'Update Block' : 'Create Block'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
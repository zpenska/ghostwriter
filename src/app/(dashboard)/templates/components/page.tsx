'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/20/solid';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { ReusableComponent } from '@/lib/types/component';

export default function ComponentBuilderPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [components, setComponents] = useState<ReusableComponent[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Build a reusable component here (e.g. address block, table, logo)...',
      }),
    ],
    content: '',
  });

  const handleSave = async () => {
    if (!name || !type || !editor) return;
    const html = editor.getHTML();

    if (editId) {
      await updateDoc(doc(db, 'reusableComponents', editId), {
        name,
        type,
        html,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await addDoc(collection(db, 'reusableComponents'), {
        name,
        type,
        html,
        createdAt: new Date().toISOString(),
      });
    }

    setName('');
    setType('');
    setEditId(null);
    editor.commands.clearContent();
  };

  const handleEdit = (comp: ReusableComponent) => {
    setName(comp.name);
    setType(comp.type);
    editor?.commands.setContent(comp.html);
    setEditId(comp.id);
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this component?');
    if (confirm) {
      await deleteDoc(doc(db, 'reusableComponents', id));
    }
  };

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const html = reader.result?.toString() || '';
      const name = file.name.replace(/\.[^/.]+$/, '');
      await addDoc(collection(db, 'reusableComponents'), {
        name,
        type: 'Uploaded',
        html,
        createdAt: new Date().toISOString(),
      });
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileUpload(file);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reusableComponents'), (snapshot) => {
      const items: ReusableComponent[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ReusableComponent, 'id'>),
      }));
      setComponents(items);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Breadcrumb */}
      <div className="border-b px-6 py-4 bg-[#F5F5F1] flex items-center gap-3">
        <button onClick={() => router.push('/templates')} className="text-sm font-medium text-[#8a7fae] flex items-center">
          <ChevronLeftIcon className="h-4 w-4 mr-1" /> Templates
        </button>
        <span className="text-sm text-zinc-400">/</span>
        <span className="text-sm font-semibold">Component Builder</span>
      </div>

      {/* Form Section */}
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {editId ? 'Edit Component' : 'Create a New Component'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Component Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Component Type (e.g. Logo, Block)"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded-md"
            />
          </div>
          <div className="border rounded-md">
            <EditorContent editor={editor} className="prose max-w-none p-4" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSave}
              className="bg-[#8a7fae] text-white px-4 py-2 rounded-md hover:bg-[#7a6f9e] text-sm font-medium"
            >
              {editId ? 'Update Component' : 'Save Component'}
            </button>
            {editId && (
              <button
                onClick={() => {
                  setName('');
                  setType('');
                  setEditId(null);
                  editor?.commands.clearContent();
                }}
                className="text-sm text-zinc-500 underline"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div className="border rounded-md p-4 bg-[#F5F5F1]">
          <h3 className="text-sm font-medium text-zinc-700 mb-2">Or upload a component file</h3>
          <label
            htmlFor="fileUpload"
            className="flex items-center gap-2 text-sm text-[#8a7fae] hover:underline cursor-pointer"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            Upload .html or .txt file
          </label>
          <input
            ref={fileInputRef}
            id="fileUpload"
            type="file"
            accept=".html,.htm,.txt"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        {/* Saved List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Saved Components</h2>
          <div className="grid gap-4">
            {components.length === 0 ? (
              <p className="text-sm text-zinc-500">No components created yet.</p>
            ) : (
              components.map((comp) => (
                <div key={comp.id} className="border border-zinc-200 rounded p-4 bg-white shadow-sm relative">
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(comp)}
                      className="text-sm text-indigo-600 hover:underline"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(comp.id)}
                      className="text-sm text-red-500 hover:underline"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="font-semibold text-zinc-800 mb-1">{comp.name}</p>
                  <p className="text-sm text-zinc-500 mb-2">{comp.type}</p>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: comp.html }} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

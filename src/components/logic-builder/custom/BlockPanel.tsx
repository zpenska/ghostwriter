'use client';

import { useEffect, useState } from 'react';
import {
  ArchiveBoxIcon,
  DocumentTextIcon,
  PencilIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import classNames from 'classnames';

interface Block {
  id: string;
  name: string;
  description?: string;
  content: string;
  category: string;
  tags?: string[];
  isActive: boolean;
}

interface BlockGroup {
  id: string;
  name: string;
  icon: React.ReactNode;
  blocks: Block[];
}

export default function BlockPanel({ templateId }: { templateId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadBlocks = async () => {
      const snapshot = await getDocs(collection(db, 'blocks'));
      const data: Block[] = [];

      snapshot.forEach((doc) => {
        const d = doc.data();
        if (d && d.isActive !== false) {
          data.push({
            id: doc.id,
            name: d.name || doc.id,
            description: d.description || '',
            content: d.content || '',
            category: d.category || 'custom',
            tags: d.tags || [],
            isActive: d.isActive !== false,
          });
        }
      });

      setBlocks(data);
    };

    loadBlocks();
  }, []);

  const blockCategories = [
    { id: 'header', name: 'Headers', icon: <DocumentTextIcon className="h-4 w-4 text-zinc-600" /> },
    { id: 'footer', name: 'Footers', icon: <ArchiveBoxIcon className="h-4 w-4 text-zinc-600" /> },
    { id: 'signature', name: 'Signatures', icon: <PencilIcon className="h-4 w-4 text-zinc-600" /> },
    { id: 'custom', name: 'Custom Blocks', icon: <WrenchScrewdriverIcon className="h-4 w-4 text-zinc-600" /> },
  ];

  const groupedBlocks = blockCategories.map((category) => ({
    ...category,
    blocks: blocks
      .filter((block) =>
        block.category === category.id &&
        (block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         block.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.blocks.length > 0);

  const toggleCategory = (id: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCategories(newSet);
  };

  return (
    <div className="h-full flex flex-col min-w-80 w-80">
      {/* Search */}
      <div className="p-3 border-b border-zinc-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-zinc-300 py-1.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:outline-none"
            placeholder="Search blocks..."
          />
        </div>
      </div>

      {/* Block Groups */}
      <div className="flex-1 overflow-y-auto">
        {groupedBlocks.map((group) => (
          <div key={group.id} className="border-b border-zinc-200">
            <button
              onClick={() => toggleCategory(group.id)}
              className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {group.icon}
                <span className="text-sm font-medium text-zinc-900">{group.name}</span>
                <span className="text-xs text-zinc-500">({group.blocks.length})</span>
              </div>
              {expandedCategories.has(group.id) ? (
                <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
              )}
            </button>

            {expandedCategories.has(group.id) && (
              <div className="px-3 pb-3 space-y-2">
                {group.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm hover:border-blue-400 hover:shadow transition"
                  >
                    <div className="text-sm font-medium text-zinc-900">{block.name}</div>
                    {block.description && (
                      <div className="text-xs text-zinc-500 mt-1">{block.description}</div>
                    )}
                    {block.tags && block.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {block.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-zinc-100 text-zinc-600 text-[10px] px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

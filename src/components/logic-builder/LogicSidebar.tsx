'use client';

import { useState } from 'react';
import { X, PanelLeft, Bot, Puzzle, Code2 } from 'lucide-react';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline'; // ✅ FIXED
import BlockPanel from './custom/BlockPanel';                  // ✅ Ensure file exists
import NodeReferencePanel from './NodeReferencePanel';  // ✅ Ensure export default

interface LogicSidebarProps {
  templateId: string;
  onPromptInsert?: (prompt: string) => void;
}

export default function LogicSidebar({ templateId, onPromptInsert }: LogicSidebarProps) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'variables' | 'blocks' | 'nodes'>('variables');

  return (
    <div
      className={`transition-all duration-300 bg-white border-r border-zinc-200 shadow-sm h-full flex flex-col ${
        open ? 'w-80' : 'w-0 overflow-hidden'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full p-2 rounded-r-md bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg z-50"
      >
        <PanelLeft className="w-4 h-4" />
      </button>

      {open && (
        <>
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-zinc-700" />
              <h2 className="text-sm font-semibold text-zinc-900">Logic Tools</h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-xs px-2 py-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded"
            >
              Close
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center border-b border-zinc-200 bg-white">
            {[
              { id: 'variables', label: 'Variables', icon: Code2 },
              { id: 'blocks', label: 'Blocks', icon: ArchiveBoxIcon }, // ✅ FIXED
              { id: 'nodes', label: 'Nodes', icon: Bot },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1 px-4 py-2 text-sm transition-all ${
                  activeTab === tab.id
                    ? 'text-zinc-900 font-semibold border-b-2 border-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'blocks' && <BlockPanel templateId={templateId} />}
            {activeTab === 'nodes' && onPromptInsert && (
              <NodeReferencePanel onPromptInsert={onPromptInsert} />
            )}
          </div>

          <div className="p-3 text-xs text-zinc-500 border-t border-zinc-200 bg-zinc-50">
            Drag content into the canvas or click a logic node to build.
          </div>
        </>
      )}
    </div>
  );
}

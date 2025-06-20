'use client';

import { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import nodeTypes, { NodeTypeDef } from './custom/nodeTypes';

export default function NodeReferencePanel({ onPromptInsert }: { onPromptInsert: (prompt: string) => void }) {
  const grouped: Record<string, NodeTypeDef[]> = {};

  Object.entries(nodeTypes).forEach(([_, def]) => {
    if (!grouped[def.group]) grouped[def.group] = [];
    grouped[def.group].push(def);
  });

  const [expanded, setExpanded] = useState(new Set(Object.keys(grouped)));

  const toggle = (group: string) => {
    const next = new Set(expanded);
    next.has(group) ? next.delete(group) : next.add(group);
    setExpanded(next);
  };

  return (
    <div className="divide-y divide-zinc-200">
      {Object.entries(grouped).map(([group, nodes]) => (
        <div key={group} className="border-b border-zinc-100">
          <button
            onClick={() => toggle(group)}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-50"
          >
            <span className="text-sm font-medium text-zinc-900 capitalize">{group}</span>
            {expanded.has(group) ? (
              <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {expanded.has(group) && (
            <div className="px-3 pb-2 space-y-1">
              {nodes.map((node) => (
                <button
                  key={node.label}
                  onClick={() => onPromptInsert(node.prompt || `Use ${node.label}`)}
                  className="flex items-center gap-2 px-3 py-2 border rounded text-sm hover:bg-blue-50 w-full"
                >
                  {node.icon && <node.icon className="w-4 h-4 text-zinc-500" />}
                  <span className="text-zinc-900">{node.label}</span>
                  <span className={`ml-auto px-2 py-0.5 text-[10px] rounded-full ${node.color}`}>
                    {group}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

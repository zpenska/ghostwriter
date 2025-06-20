'use client';

import { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { nodeTypes } from './custom/nodeTypes'; // ✅ Adjust path to your structure
import classNames from 'classnames';

interface NodeReferencePanelProps {
  onPromptInsert: (prompt: string) => void;
}

interface NodeType {
  label: string;
  icon?: React.ElementType;
  color?: string;
  group: string;
  description?: string;
  prompt?: string;
}

export default function NodeReferencePanel({ onPromptInsert }: NodeReferencePanelProps) {
  const groupMap: Record<string, NodeType[]> = {};

  Object.values(nodeTypes).forEach((node) => {
    const group = node.group || 'General';
    if (!groupMap[group]) groupMap[group] = [];
    groupMap[group].push(node);
  });

  const groupKeys = Object.keys(groupMap).sort();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(groupKeys));

  const toggle = (group: string) => {
    const copy = new Set(expanded);
    copy.has(group) ? copy.delete(group) : copy.add(group);
    setExpanded(copy);
  };

  const handleInsert = (node: NodeType) => {
    const prompt = node.prompt || `Insert a ${node.label} rule into the logic.`;
    onPromptInsert(prompt);
  };

  return (
    <div className="divide-y divide-zinc-200">
      {groupKeys.map((group) => (
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
              {groupMap[group].map((node) => (
                <button
                  key={node.label}
                  onClick={() => handleInsert(node)}
                  title={node.description || `Insert logic for ${node.label}`}
                  className={classNames(
                    'w-full text-left rounded px-3 py-2 text-xs border shadow-sm bg-white border-zinc-200',
                    'hover:border-blue-400 hover:bg-blue-50 flex items-center gap-2 transition-all'
                  )}
                >
                  {node.icon && <node.icon className="w-4 h-4 text-zinc-500" />}
                  <span className="font-medium text-zinc-900">{node.label}</span>
                  <span
                    className={classNames(
                      'ml-auto rounded-full px-2 py-0.5 text-[10px]',
                      node.color
                    )}
                  >
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

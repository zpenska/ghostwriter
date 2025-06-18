// src/components/logic/LogicSidebar.tsx - FIXED to use real Casper variables
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Database, 
  Play, 
  Square, 
  GitBranch, 
  RotateCcw,
  ChevronDownIcon,
  ChevronRightIcon
} from 'lucide-react';
import { getCasperVariableContext } from '@/lib/firebase/loaders/getCasperVariableContext';
import { getBlockContext } from '@/lib/firebase/loaders/getBlockContext';

interface LogicSidebarProps {
  templateId: string;
}

interface VariableGroup {
  name: string;
  variables: { key: string; name: string; description: string }[];
}

interface BlockGroup {
  name: string;
  blocks: { id: string; name: string; category: string; description: string }[];
}

// Draggable Node Type Component
const DraggableNodeType: React.FC<{
  type: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}> = ({ type, label, icon, description }) => {
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/node-type', type);
    event.dataTransfer.setData('text/plain', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg cursor-move hover:shadow-md hover:border-zinc-300 transition-all duration-200"
    >
      <div className="text-zinc-600">{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-sm text-zinc-900">{label}</div>
        {description && (
          <div className="text-xs text-zinc-500 mt-0.5">{description}</div>
        )}
      </div>
    </div>
  );
};

// Draggable Variable Component
const DraggableVariable: React.FC<{
  variable: { key: string; name: string; description: string };
}> = ({ variable }) => {
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/node-type', 'variable');
    event.dataTransfer.setData('text/plain', variable.name);
    event.dataTransfer.setData('variable-key', variable.key);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg cursor-move hover:shadow-md hover:border-green-300 transition-all duration-200"
    >
      <Database className="w-4 h-4 text-green-600" />
      <div className="flex-1">
        <div className="font-medium text-sm text-green-900">{variable.name}</div>
        <div className="text-xs text-green-600 font-mono">{variable.key}</div>
        {variable.description && (
          <div className="text-xs text-green-700 mt-0.5">{variable.description}</div>
        )}
      </div>
    </div>
  );
};

// Draggable Block Component
const DraggableBlock: React.FC<{
  block: { id: string; name: string; category: string; description: string };
}> = ({ block }) => {
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/node-type', 'block');
    event.dataTransfer.setData('text/plain', block.name);
    event.dataTransfer.setData('block-id', block.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-3 p-2 bg-purple-50 border border-purple-200 rounded-lg cursor-move hover:shadow-md hover:border-purple-300 transition-all duration-200"
    >
      <Package className="w-4 h-4 text-purple-600" />
      <div className="flex-1">
        <div className="font-medium text-sm text-purple-900">{block.name}</div>
        <div className="text-xs text-purple-600">{block.category}</div>
        {block.description && (
          <div className="text-xs text-purple-700 mt-0.5">{block.description}</div>
        )}
      </div>
    </div>
  );
};

// Collapsible Section Component
const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className="font-medium text-sm text-zinc-900">{title}</span>
        {isOpen ? (
          <ChevronDownIcon className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 pt-0 space-y-2">{children}</div>
      )}
    </div>
  );
};

export default function LogicSidebar({ templateId }: LogicSidebarProps) {
  const [casperVariables, setCasperVariables] = useState<VariableGroup[]>([]);
  const [casperBlocks, setCasperBlocks] = useState<BlockGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // FIXED: Load real Casper variables and blocks from Firestore
  useEffect(() => {
    const loadCasperData = async () => {
      try {
        console.log('📊 LogicSidebar: Loading Casper context data...');
        
        const [variables, blocks] = await Promise.all([
          getCasperVariableContext(),
          getBlockContext()
        ]);

        // Group variables by category
        const groupedVariables = variables.reduce((acc: VariableGroup[], v) => {
          const group = acc.find((g) => g.name === v.group);
          const variable = {
            key: v.key,
            name: v.name,
            description: v.description,
          };

          if (group) {
            group.variables.push(variable);
          } else {
            acc.push({ name: v.group || 'General', variables: [variable] });
          }

          return acc;
        }, []);

        // Group blocks by category
        const groupedBlocks = blocks.reduce((acc: BlockGroup[], b) => {
          const group = acc.find((g) => g.name === b.category);
          const block = {
            id: b.id,
            name: b.name,
            category: b.category,
            description: b.description || '',
          };

          if (group) {
            group.blocks.push(block);
          } else {
            acc.push({ name: b.category || 'General', blocks: [block] });
          }

          return acc;
        }, []);

        setCasperVariables(groupedVariables);
        setCasperBlocks(groupedBlocks);
        
        console.log('✅ LogicSidebar: Casper data loaded:', {
          variableGroups: groupedVariables.length,
          blockGroups: groupedBlocks.length,
          totalVars: variables.length,
          totalBlocks: blocks.length
        });
      } catch (error) {
        console.error('❌ LogicSidebar: Error loading Casper data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCasperData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 mx-auto mb-2"></div>
          <div className="text-sm text-zinc-600">Loading variables...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border-r border-zinc-200">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Logic Elements</h2>
        
        <div className="space-y-4">
          {/* Node Types Section */}
          <CollapsibleSection title="Node Types" defaultOpen={true}>
            <DraggableNodeType
              type="start"
              label="Start"
              icon={<Play className="w-4 h-4" />}
              description="Beginning of flow"
            />
            
            <DraggableNodeType
              type="condition"
              label="Condition"
              icon={<GitBranch className="w-4 h-4" />}
              description="If/then logic"
            />
            
            <DraggableNodeType
              type="action"
              label="Action"
              icon={<Square className="w-4 h-4" />}
              description="Perform action"
            />
            
            <DraggableNodeType
              type="stop"
              label="Stop"
              icon={<Square className="w-4 h-4" />}
              description="End of flow"
            />
          </CollapsibleSection>

          {/* Real Casper Variables Section */}
          {casperVariables.map((group) => (
            <CollapsibleSection 
              key={group.name} 
              title={`Variables: ${group.name}`}
              defaultOpen={group.name === 'Member Information'}
            >
              {group.variables.map((variable) => (
                <DraggableVariable
                  key={variable.key}
                  variable={variable}
                />
              ))}
            </CollapsibleSection>
          ))}

          {/* Real Casper Blocks Section */}
          {casperBlocks.map((group) => (
            <CollapsibleSection 
              key={group.name} 
              title={`Blocks: ${group.name}`}
              defaultOpen={group.name === 'Letter Components'}
            >
              {group.blocks.map((block) => (
                <DraggableBlock
                  key={block.id}
                  block={block}
                />
              ))}
            </CollapsibleSection>
          ))}

          {/* Fallback if no data */}
          {casperVariables.length === 0 && casperBlocks.length === 0 && (
            <div className="text-center py-8">
              <div className="text-zinc-500 mb-2">No variables or blocks found</div>
              <div className="text-xs text-zinc-400">
                Check your Casper variable and block configuration
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <h3 className="font-medium text-sm text-zinc-900 mb-2">How to use:</h3>
          <ul className="text-xs text-zinc-600 space-y-1">
            <li>• Drag nodes to the canvas</li>
            <li>• Connect nodes with edges</li>
            <li>• Use variables in conditions</li>
            <li>• Ask Casper AI for help</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
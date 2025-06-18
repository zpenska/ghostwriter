'use client';

import React, { useState } from 'react';
import { GripVertical, Settings, X, Check } from 'lucide-react';

// React Flow handle component
const Handle: React.FC<{
  type: 'source' | 'target';
  position: 'top' | 'bottom' | 'left' | 'right';
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ type, position, id, className, style }) => {
  const positionStyles = {
    top: { top: '-6px', left: '50%', transform: 'translateX(-50%)' },
    bottom: { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' },
    left: { left: '-6px', top: '50%', transform: 'translateY(-50%)' },
    right: { right: '-6px', top: '50%', transform: 'translateY(-50%)' },
  };

  return (
    <div
      className={`absolute w-3 h-3 border-2 rounded-full bg-white ${className || ''}`}
      style={{
        ...positionStyles[position],
        ...style,
        zIndex: 10,
      }}
      data-handleid={id}
      data-handlepos={position}
    />
  );
};

// Define comprehensive node props interface
interface CustomNodeProps {
  id: string;
  data: {
    label: string;
    condition?: string;
    actionType?: string;
    targetId?: string;
    explanation?: string;
    blockId?: string;
    blockName?: string;
    category?: string;
    variableKey?: string;
    variableName?: string;
    description?: string;
    [key: string]: any;
  };
  selected?: boolean;
  type?: string;
  position?: { x: number; y: number };
  dragging?: boolean;
  dragHandle?: string;
  sourcePosition?: string;
  targetPosition?: string;
  hidden?: boolean;
  width?: number;
  height?: number;
  zIndex?: number;
  isConnectable?: boolean;
}

// Enhanced Condition Node
export const ConditionNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [condition, setCondition] = useState(data?.condition || '');

  const handleSave = () => {
    setIsEditing(false);
    console.log('Saving condition:', condition);
  };

  return (
    <div className={`relative group ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Diamond shape for condition */}
      <div className="relative w-40 h-40 transform rotate-45 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow">
        
        {/* Content (counter-rotated) */}
        <div className="transform -rotate-45 text-center px-2 w-32">
          <div className="text-sm font-semibold text-amber-900 mb-1">
            {data?.label || 'Condition'}
          </div>
          
          {isEditing ? (
            <div className="space-y-1">
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full text-xs p-1 border rounded"
                placeholder="condition..."
                autoFocus
              />
              <div className="flex gap-1 justify-center">
                <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="text-xs text-amber-700 cursor-pointer hover:text-amber-900 font-mono"
              onClick={() => setIsEditing(true)}
            >
              {data?.condition || 'Click to edit'}
            </div>
          )}
        </div>

        {/* Drag handle */}
        <div className="drag-handle absolute -top-3 -left-3 transform -rotate-45 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white border border-zinc-300 rounded p-1 shadow cursor-move">
            <GripVertical className="w-3 h-3 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Handles */}
      <Handle type="target" position="top" className="border-amber-500" />
      <Handle type="source" id="yes" position="right" className="border-green-500 bg-green-100" />
      <Handle type="source" id="no" position="left" className="border-red-500 bg-red-100" />

      {/* Labels for handles */}
      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-xs text-green-600 font-medium">
        Yes
      </div>
      <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 text-xs text-red-600 font-medium">
        No
      </div>
    </div>
  );
};

// Enhanced Action Node
export const ActionNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={`relative group ${selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}>
      <div className="w-48 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 rounded-lg shadow-lg p-4 text-center hover:shadow-xl transition-shadow">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-blue-900">
            {data?.label || 'Action'}
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-200 rounded transition-opacity"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1">
          {data?.actionType && (
            <div className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded">
              {data.actionType}
            </div>
          )}
          
          {data?.targetId && (
            <div className="text-xs text-zinc-600 font-mono">
              → {data.targetId}
            </div>
          )}

          {data?.explanation && (
            <div className="text-xs text-zinc-500 italic">
              {data.explanation}
            </div>
          )}
        </div>

        {/* Drag handle */}
        <div className="drag-handle absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white border border-zinc-300 rounded p-1 shadow cursor-move">
            <GripVertical className="w-3 h-3 text-zinc-500" />
          </div>
        </div>
      </div>

      <Handle type="target" position="top" className="border-blue-500" />
      <Handle type="source" position="bottom" className="border-blue-500" />
    </div>
  );
};

// Enhanced Start Node
export const StartNode: React.FC<CustomNodeProps> = ({ selected }) => (
  <div className={`relative group ${selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}>
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-emerald-500 shadow-lg flex items-center justify-center text-xs font-bold text-emerald-800 hover:shadow-xl transition-shadow">
      START
      
      {/* Drag handle */}
      <div className="drag-handle absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-white border border-zinc-300 rounded p-1 shadow cursor-move">
          <GripVertical className="w-3 h-3 text-zinc-500" />
        </div>
      </div>
    </div>

    <Handle type="source" position="bottom" className="border-emerald-500" />
  </div>
);

// Enhanced Stop Node
export const StopNode: React.FC<CustomNodeProps> = ({ selected }) => (
  <div className={`relative group ${selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}>
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 border-2 border-rose-500 shadow-lg flex items-center justify-center text-xs font-bold text-rose-800 hover:shadow-xl transition-shadow">
      STOP
      
      {/* Drag handle */}
      <div className="drag-handle absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-white border border-zinc-300 rounded p-1 shadow cursor-move">
          <GripVertical className="w-3 h-3 text-zinc-500" />
        </div>
      </div>
    </div>

    <Handle type="target" position="top" className="border-rose-500" />
  </div>
);

// Enhanced Block Node
export const BlockNode: React.FC<CustomNodeProps> = ({ data, selected }) => (
  <div className={`relative group ${selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}>
    <div className="w-56 bg-gradient-to-br from-green-50 to-green-100 border border-green-400 rounded-lg shadow-lg p-3 hover:shadow-xl transition-shadow">
      
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-green-800 bg-green-200 px-2 py-1 rounded">
          BLOCK
        </div>
        
        <div className="drag-handle opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white border border-zinc-300 rounded p-1 shadow cursor-move">
            <GripVertical className="w-3 h-3 text-zinc-500" />
          </div>
        </div>
      </div>

      <div className="text-sm font-medium text-gray-800">
        {data?.label || 'Insert block here'}
      </div>
      
      {data?.blockId && (
        <div className="text-xs text-gray-600 font-mono mt-1">
          ID: {data.blockId}
        </div>
      )}
      
      {data?.category && (
        <div className="text-xs text-green-700 mt-1">
          {data.category}
        </div>
      )}
    </div>

    <Handle type="target" position="top" className="border-green-500" />
    <Handle type="source" position="bottom" className="border-green-500" />
  </div>
);

// Variable Node
export const VariableNode: React.FC<CustomNodeProps> = ({ data, selected }) => (
  <div className={`relative group ${selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}>
    <div className="w-44 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-300 rounded-lg shadow-lg p-3 hover:shadow-xl transition-shadow">
      
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-purple-800 bg-purple-200 px-2 py-1 rounded">
          VARIABLE
        </div>
        
        <div className="drag-handle opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white border border-zinc-300 rounded p-1 shadow cursor-move">
            <GripVertical className="w-3 h-3 text-zinc-500" />
          </div>
        </div>
      </div>

      <div className="text-sm font-medium text-gray-800">
        {data?.variableName || data?.label || 'Variable'}
      </div>
      
      <div className="text-xs text-purple-700 font-mono mt-1">
        {data?.variableKey || '{{variable}}'}
      </div>
      
      {data?.description && (
        <div className="text-xs text-gray-600 mt-1">
          {data.description}
        </div>
      )}
    </div>

    <Handle type="source" position="right" className="border-purple-500" />
  </div>
);

// Export all node types
export const nodeTypes = {
  condition: ConditionNode,
  action: ActionNode,
  start: StartNode,
  stop: StopNode,
  block: BlockNode,
  variable: VariableNode,
};
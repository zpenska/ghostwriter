'use client';
import React, { useState } from 'react';
import { GitBranch, GripVertical, Check, X } from 'lucide-react';

const Handle: React.FC<{type: 'source'|'target'; position: string; className?: string}> = ({ type, position, className }) => (
  <div 
    className={`absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full ${className} ${
      position === 'top' ? '-top-1.5 left-1/2 -translate-x-1/2' : 
      position === 'bottom' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : 
      position === 'left' ? '-left-1.5 top-1/2 -translate-y-1/2' : 
      '-right-1.5 top-1/2 -translate-y-1/2'
    }`}
  />
);

interface IfNodeProps {
  data: {
    label: string;
    condition: string;
    onUpdate?: (condition: string) => void;
  };
}

export const IfNode: React.FC<IfNodeProps> = ({ data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [condition, setCondition] = useState(data.condition || '');

  const handleSave = () => {
    data.onUpdate?.(condition);
    setIsEditing(false);
  };

  return (
    <div className="group relative bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-lg p-3 min-w-[180px] hover:shadow-lg transition-all duration-200">
      <Handle type="target" position="top" />
      
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-yellow-600" />
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{data.label}</div>
          {isEditing ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="text-xs border rounded px-1 py-0.5 flex-1"
                placeholder="Enter condition..."
              />
              <button onClick={handleSave} className="text-green-600 hover:text-green-700">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setIsEditing(false)} className="text-red-600 hover:text-red-700">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-yellow-700 mt-1 cursor-pointer" onClick={() => setIsEditing(true)}>
              {condition || 'Click to edit condition'}
            </div>
          )}
        </div>
      </div>
      
      <GripVertical className="absolute top-2 right-2 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <Handle type="source" position="bottom" className="bg-green-500" />
      <Handle type="source" position="right" className="bg-red-500" />
    </div>
  );
};
'use client';
import React from 'react';
import { Database, GripVertical } from 'lucide-react';

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

interface VariableNodeProps {
  data: {
    label: string;
    variableKey: string;
    dataType?: string;
  };
}

export const VariableNode: React.FC<VariableNodeProps> = ({ data }) => {
  return (
    <div className="group relative bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-3 min-w-[140px] hover:shadow-lg transition-all duration-200">
      <Handle type="target" position="top" />
      
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-green-600" />
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{data.label}</div>
          {data.dataType && (
            <div className="text-xs text-green-600 mt-1">{data.dataType}</div>
          )}
        </div>
      </div>
      
      <GripVertical className="absolute top-2 right-2 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <Handle type="source" position="bottom" />
    </div>
  );
};
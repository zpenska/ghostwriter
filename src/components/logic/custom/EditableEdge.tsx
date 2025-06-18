'use client';
import React, { useState } from 'react';

interface EdgeProps {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  data?: {
    label?: string;
    edgeType?: 'yes' | 'no' | 'default';
  };
}

interface EditableEdgeProps extends EdgeProps {
  onLabelChange?: (newLabel: string) => void;
}

// Simple SVG path creator
const createPath = (sourceX: number, sourceY: number, targetX: number, targetY: number) => {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  return `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
};

export const EditableEdge: React.FC<EditableEdgeProps> = ({ 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  data, 
  onLabelChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || '');

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onLabelChange?.(label);
    setIsEditing(false);
  };

  const path = createPath(sourceX, sourceY, targetX, targetY);
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <g>
      <path
        d={path}
        stroke="#6b7280"
        strokeWidth={2}
        fill="none"
        className="hover:stroke-blue-500 transition-colors cursor-pointer"
        onDoubleClick={handleDoubleClick}
      />
      
      {isEditing ? (
        <foreignObject x={midX - 50} y={midY - 10} width="100" height="20">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSave}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            className="w-full text-xs border rounded px-1"
            autoFocus
          />
        </foreignObject>
      ) : (
        <text
          x={midX}
          y={midY}
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
          className="cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          {label || 'Double-click to edit'}
        </text>
      )}
    </g>
  );
};
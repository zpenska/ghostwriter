'use client';
import React from 'react';

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

// Simple SVG path creator (replaces getBezierPath)
const createPath = (sourceX: number, sourceY: number, targetX: number, targetY: number) => {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  return `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
};

export const DefaultEdge: React.FC<EdgeProps> = ({ sourceX, sourceY, targetX, targetY, data }) => {
  const path = createPath(sourceX, sourceY, targetX, targetY);
  
  return (
    <g>
      <path
        d={path}
        stroke="#6b7280"
        strokeWidth={2}
        fill="none"
        className="hover:stroke-blue-500 transition-colors"
      />
      {data?.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
          className="bg-white"
        >
          {data.label}
        </text>
      )}
    </g>
  );
};

export const YesEdge: React.FC<EdgeProps> = ({ sourceX, sourceY, targetX, targetY }) => {
  const path = createPath(sourceX, sourceY, targetX, targetY);
  
  return (
    <g>
      <path
        d={path}
        stroke="#10b981"
        strokeWidth={3}
        fill="none"
        className="hover:stroke-green-600 transition-colors"
      />
      <text
        x={(sourceX + targetX) / 2}
        y={(sourceY + targetY) / 2 - 10}
        textAnchor="middle"
        fontSize="12"
        fill="#10b981"
        fontWeight="bold"
      >
        YES
      </text>
    </g>
  );
};

export const NoEdge: React.FC<EdgeProps> = ({ sourceX, sourceY, targetX, targetY }) => {
  const path = createPath(sourceX, sourceY, targetX, targetY);
  
  return (
    <g>
      <path
        d={path}
        stroke="#ef4444"
        strokeWidth={3}
        fill="none"
        className="hover:stroke-red-600 transition-colors"
      />
      <text
        x={(sourceX + targetX) / 2}
        y={(sourceY + targetY) / 2 - 10}
        textAnchor="middle"
        fontSize="12"
        fill="#ef4444"
        fontWeight="bold"
      >
        NO
      </text>
    </g>
  );
};
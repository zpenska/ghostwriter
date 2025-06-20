'use client';

import React from 'react';
import { NodeProps } from 'reactflow';

export default function BlockNode({ data }: NodeProps): JSX.Element {
  return (
    <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded p-3 text-sm shadow">
      <strong>{data.label || 'Block'}</strong>
    </div>
  );
}

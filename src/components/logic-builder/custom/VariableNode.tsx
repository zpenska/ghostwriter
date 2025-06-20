'use client';

import React from 'react';
import { NodeProps } from 'reactflow';

export default function LoopNode({ data }: NodeProps): JSX.Element {
  return (
    <div className="bg-blue-50 border border-blue-300 text-blue-900 rounded p-3 text-sm shadow">
      <strong>Loop:</strong> {data.loopOver || 'Unknown list'}
    </div>
  );
}

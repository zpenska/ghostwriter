'use client';

import React from 'react';
import { NodeProps } from 'reactflow';

export default function IfNode({ data }: NodeProps): JSX.Element {
  return (
    <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded p-3 text-sm shadow">
      <strong>If:</strong> {data.condition || 'No condition'}
    </div>
  );
}

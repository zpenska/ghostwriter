import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import BaseNode from './BaseNode';

export const StartNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <BaseNode
      icon={<Play className="w-4 h-4 text-green-600" />}
      title="Start"
      subtitle="Logic flow begins here"
      color="green"
    >
      <Handle type="source" position={Position.Bottom} />
      <div className="text-center py-2">
        <div className="text-sm text-gray-600">{data.label || 'Logic Flow Start'}</div>
      </div>
    </BaseNode>
  );
};

export default StartNode;
import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import BaseNode from './BaseNode';

export const ConditionNode: React.FC<NodeProps> = ({ data, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [condition, setCondition] = useState(data.condition || '');
  const [description, setDescription] = useState(data.description || '');

  const handleSave = useCallback(() => {
    // Update node data
    data.condition = condition;
    data.description = description;
    setIsEditing(false);
  }, [condition, description, data]);

  const handleCancel = useCallback(() => {
    setCondition(data.condition || '');
    setDescription(data.description || '');
    setIsEditing(false);
  }, [data]);

  return (
    <BaseNode
      icon={<GitBranch className="w-4 h-4 text-blue-600" />}
      title="Condition"
      subtitle="If/Then logic"
      color="blue"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      hasError={!condition.trim()}
      errorMessage="Condition expression is required"
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="space-y-3">
        {isEditing ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Condition Expression:
              </label>
              <textarea
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g., {{status}} === 'DENIED' && {{amount}} > 1000"
                className="w-full p-2 text-xs border border-gray-300 rounded resize-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description:
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this condition"
                className="w-full p-2 text-xs border border-gray-300 rounded"
              />
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-50 p-2 rounded text-xs font-mono">
              {condition || 'No condition set'}
            </div>
            {description && (
              <div className="text-xs text-gray-600">
                {description}
              </div>
            )}
          </>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} />
      
      {/* Labels for true/false paths */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>True</span>
        <span>False</span>
      </div>
    </BaseNode>
  );
};

export default ConditionNode;
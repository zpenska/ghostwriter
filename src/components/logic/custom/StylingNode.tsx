import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Palette } from 'lucide-react';
import BaseNode from './BaseNode';

export const StylingNode: React.FC<NodeProps> = ({ data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [targetElement, setTargetElement] = useState(data.targetElement || '');
  const [condition, setCondition] = useState(data.condition || '');
  const [action, setAction] = useState(data.action || 'hide');

  const handleSave = useCallback(() => {
    data.targetElement = targetElement;
    data.condition = condition;
    data.action = action;
    setIsEditing(false);
  }, [targetElement, condition, action, data]);

  const handleCancel = useCallback(() => {
    setTargetElement(data.targetElement || '');
    setCondition(data.condition || '');
    setAction(data.action || 'hide');
    setIsEditing(false);
  }, [data]);

  return (
    <BaseNode
      icon={<Palette className="w-4 h-4 text-pink-600" />}
      title="Styling"
      subtitle="Conditional formatting"
      color="pink"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      hasError={!targetElement.trim() || !condition.trim()}
      errorMessage="Target element and condition are required"
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="space-y-3">
        {isEditing ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Target Element:
              </label>
              <input
                value={targetElement}
                onChange={(e) => setTargetElement(e.target.value)}
                placeholder="e.g., urgency-section"
                className="w-full p-2 text-xs border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Condition:
              </label>
              <input
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g., {{urgencyCode}} !== 'URGENT'"
                className="w-full p-2 text-xs border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Action:
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 rounded"
              >
                <option value="hide">Hide</option>
                <option value="show">Show</option>
                <option value="highlight">Highlight</option>
                <option value="disable">Disable</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs">
              <div className="font-medium">{action} {targetElement}</div>
              <div className="text-gray-600">When: {condition}</div>
            </div>
          </>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </BaseNode>
  );
};

export default StylingNode;
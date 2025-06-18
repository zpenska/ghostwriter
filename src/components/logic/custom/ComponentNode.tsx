import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Component, Shield } from 'lucide-react';
import BaseNode from './BaseNode';

export const ComponentNode: React.FC<NodeProps> = ({ data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [componentId, setComponentId] = useState(data.componentId || '');
  const [parameters, setParameters] = useState(JSON.stringify(data.parameters || {}, null, 2));

  const handleSave = useCallback(() => {
    try {
      const parsedParams = JSON.parse(parameters);
      data.componentId = componentId;
      data.parameters = parsedParams;
      setIsEditing(false);
    } catch (error) {
      alert('Invalid JSON in parameters');
    }
  }, [componentId, parameters, data]);

  const handleCancel = useCallback(() => {
    setComponentId(data.componentId || '');
    setParameters(JSON.stringify(data.parameters || {}, null, 2));
    setIsEditing(false);
  }, [data]);

  const isHealthcareComponent = data.componentId && [
    'appeal-rights-notice',
    'cms-guidance',
    'medical-necessity-disclaimer',
    'approval-confirmation'
  ].includes(data.componentId);

  return (
    <BaseNode
      icon={<Component className="w-4 h-4 text-green-600" />}
      title="Component"
      subtitle={isHealthcareComponent ? "Healthcare Component" : "Template Component"}
      color="green"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      hasError={!componentId.trim()}
      errorMessage="Component ID is required"
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="space-y-3">
        {isEditing ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Component ID:
              </label>
              <input
                value={componentId}
                onChange={(e) => setComponentId(e.target.value)}
                placeholder="e.g., appeal-rights-notice"
                className="w-full p-2 text-xs border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Parameters (JSON):
              </label>
              <textarea
                value={parameters}
                onChange={(e) => setParameters(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full p-2 text-xs border border-gray-300 rounded resize-none font-mono"
                rows={4}
              />
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-medium text-gray-900">
              {componentId || 'No component selected'}
            </div>
            {isHealthcareComponent && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <Shield className="w-3 h-3" />
                <span>Healthcare Compliant</span>
              </div>
            )}
            {data.parameters && Object.keys(data.parameters).length > 0 && (
              <div className="text-xs text-gray-600">
                Parameters: {Object.keys(data.parameters).join(', ')}
              </div>
            )}
          </>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </BaseNode>
  );
};

export default ComponentNode;
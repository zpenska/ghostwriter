import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Shield, AlertTriangle } from 'lucide-react';
import BaseNode from './BaseNode';

export const WorkflowNode: React.FC<NodeProps> = ({ data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [rule, setRule] = useState(data.rule || '');
  const [triggerCondition, setTriggerCondition] = useState(data.triggerCondition || '');
  const [requiredAction, setRequiredAction] = useState(data.requiredAction || '');
  const [blockingRule, setBlockingRule] = useState(data.blockingRule || false);

  const handleSave = useCallback(() => {
    data.rule = rule;
    data.triggerCondition = triggerCondition;
    data.requiredAction = requiredAction;
    data.blockingRule = blockingRule;
    setIsEditing(false);
  }, [rule, triggerCondition, requiredAction, blockingRule, data]);

  const handleCancel = useCallback(() => {
    setRule(data.rule || '');
    setTriggerCondition(data.triggerCondition || '');
    setRequiredAction(data.requiredAction || '');
    setBlockingRule(data.blockingRule || false);
    setIsEditing(false);
  }, [data]);

  return (
    <BaseNode
      icon={<Shield className={`w-4 h-4 ${blockingRule ? 'text-red-600' : 'text-yellow-600'}`} />}
      title="Workflow Rule"
      subtitle={blockingRule ? "Blocking Rule" : "Compliance Rule"}
      color={blockingRule ? "red" : "yellow"}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      hasError={!rule.trim() || !triggerCondition.trim()}
      errorMessage="Rule name and trigger condition are required"
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="space-y-3">
        {isEditing ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rule Name:
              </label>
              <input
                value={rule}
                onChange={(e) => setRule(e.target.value)}
                placeholder="e.g., Appeal Rights Requirement"
                className="w-full p-2 text-xs border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Trigger Condition:
              </label>
              <input
                value={triggerCondition}
                onChange={(e) => setTriggerCondition(e.target.value)}
                placeholder="e.g., {{status}} === 'DENIED'"
                className="w-full p-2 text-xs border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Required Action:
              </label>
              <textarea
                value={requiredAction}
                onChange={(e) => setRequiredAction(e.target.value)}
                placeholder="e.g., Must include appeal rights notice"
                className="w-full p-2 text-xs border border-gray-300 rounded resize-none"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="blocking"
                checked={blockingRule}
                onChange={(e) => setBlockingRule(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="blocking" className="text-xs text-gray-700">
                Blocking Rule (prevents template from being used)
              </label>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-medium text-gray-900">
              {rule || 'Unnamed Rule'}
            </div>
            <div className="text-xs text-gray-600">
              Triggers when: {triggerCondition}
            </div>
            {requiredAction && (
              <div className="text-xs text-gray-600">
                Action: {requiredAction}
              </div>
            )}
            {blockingRule && (
              <div className="flex items-center space-x-1 text-xs text-red-600">
                <AlertTriangle className="w-3 h-3" />
                <span>Blocking Rule</span>
              </div>
            )}
          </>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </BaseNode>
  );
};

export default WorkflowNode;
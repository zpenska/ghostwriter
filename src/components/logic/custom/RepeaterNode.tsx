import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { RotateCcw } from 'lucide-react';
import BaseNode from './BaseNode';

export const RepeaterNode: React.FC<NodeProps> = ({ data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [arrayField, setArrayField] = useState(data.arrayField || '');
  const [itemVariable, setItemVariable] = useState(data.itemVariable || 'item');
  const [template, setTemplate] = useState(data.template || '');
  const [condition, setCondition] = useState(data.condition || '');
  const [separator, setSeparator] = useState(data.separator || '\n');

  const handleSave = useCallback(() => {
    data.arrayField = arrayField;
    data.itemVariable = itemVariable;
    data.template = template;
    data.condition = condition;
    data.separator = separator;
    setIsEditing(false);
  }, [arrayField, itemVariable, template, condition, separator, data]);

  const handleCancel = useCallback(() => {
    setArrayField(data.arrayField || '');
    setItemVariable(data.itemVariable || 'item');
    setTemplate(data.template || '');
    setCondition(data.condition || '');
    setSeparator(data.separator || '\n');
    setIsEditing(false);
  }, [data]);

  return (
    <BaseNode
      icon={<RotateCcw className="w-4 h-4 text-orange-600" />}
      title="Repeater"
      subtitle="Loop through arrays"
      color="orange"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      hasError={!arrayField.trim() || !template.trim()}
      errorMessage="Array field and template are required"
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="space-y-3">
        {isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Array Field:
                </label>
                <input
                  value={arrayField}
                  onChange={(e) => setArrayField(e.target.value)}
                  placeholder="e.g., claim.lines"
                  className="w-full p-2 text-xs border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Item Variable:
                </label>
                <input
                  value={itemVariable}
                  onChange={(e) => setItemVariable(e.target.value)}
                  placeholder="e.g., line"
                  className="w-full p-2 text-xs border border-gray-300 rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Template:
              </label>
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="e.g., Line {{line.number}}: ${{line.amount}}"
                className="w-full p-2 text-xs border border-gray-300 rounded resize-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Condition (optional):
              </label>
              <input
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g., line.status === 'DENIED'"
                className="w-full p-2 text-xs border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Separator:
              </label>
              <select
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 rounded"
              >
                <option value="\n">New Line</option>
                <option value=", ">Comma</option>
                <option value="; ">Semicolon</option>
                <option value=" | ">Pipe</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs">
              <div className="font-medium">For each {itemVariable} in {arrayField}</div>
              {condition && <div className="text-gray-600">Where: {condition}</div>}
            </div>
            <div className="bg-gray-50 p-2 rounded text-xs font-mono">
              {template || 'No template set'}
            </div>
          </>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </BaseNode>
  );
};

export default RepeaterNode;
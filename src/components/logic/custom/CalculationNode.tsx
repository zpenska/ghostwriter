import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Calculator } from 'lucide-react';
import BaseNode from './BaseNode';

export const CalculationNode: React.FC<NodeProps> = ({ data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [expression, setExpression] = useState(data.expression || '');
  const [outputVariable, setOutputVariable] = useState(data.outputVariable || '');
  const [dataType, setDataType] = useState(data.dataType || 'number');
  const [format, setFormat] = useState(data.format || 'number');

  const handleSave = useCallback(() => {
    data.expression = expression;
    data.outputVariable = outputVariable;
    data.dataType = dataType;
    data.format = format;
    setIsEditing(false);
  }, [expression, outputVariable, dataType, format, data]);

  const handleCancel = useCallback(() => {
    setExpression(data.expression || '');
    setOutputVariable(data.outputVariable || '');
    setDataType(data.dataType || 'number');
    setFormat(data.format || 'number');
    setIsEditing(false);
  }, [data]);

  return (
    <BaseNode
      icon={<Calculator className="w-4 h-4 text-purple-600" />}
      title="Calculation"
      subtitle="Math operations"
      color="purple"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      hasError={!expression.trim() || !outputVariable.trim()}
      errorMessage="Expression and output variable are required"
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="space-y-3">
        {isEditing ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Expression:
              </label>
              <textarea
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="e.g., SUM(claim.lines.map(line => line.amount))"
                className="w-full p-2 text-xs border border-gray-300 rounded resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Output Variable:
                </label>
                <input
                  value={outputVariable}
                  onChange={(e) => setOutputVariable(e.target.value)}
                  placeholder="e.g., totalAmount"
                  className="w-full p-2 text-xs border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data Type:
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-300 rounded"
                >
                  <option value="number">Number</option>
                  <option value="string">String</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Format:
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 rounded"
              >
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="percentage">Percentage</option>
                <option value="date">Date</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-50 p-2 rounded text-xs font-mono">
              {expression || 'No expression set'}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Output: {outputVariable || 'None'}</span>
              <span>Format: {format}</span>
            </div>
          </>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </BaseNode>
  );
};

export default CalculationNode;
import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  GitBranch, 
  Calculator, 
  RotateCcw, 
  Component, 
  Palette, 
  Shield, 
  Play,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

// Base node wrapper component
const BaseNode: React.FC<{
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  hasError?: boolean;
  errorMessage?: string;
}> = ({ 
  children, 
  icon, 
  title, 
  subtitle, 
  color, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel,
  hasError,
  errorMessage 
}) => {
  return (
    <div className={`min-w-64 bg-white border-2 rounded-lg shadow-lg ${
      hasError ? 'border-red-400' : `border-${color}-400`
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-3 bg-${color}-50 rounded-t-lg border-b`}>
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 bg-${color}-100 rounded-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {hasError && (
            <div className="p-1" title={errorMessage}>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          )}
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                className="p-1 hover:bg-green-100 rounded"
                title="Save changes"
              >
                <Check className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={onCancel}
                className="p-1 hover:bg-red-100 rounded"
                title="Cancel editing"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit node"
            >
              <Edit2 className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3">
        {children}
      </div>
    </div>
  );
};

// Start Node
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

// Condition Node
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

// Calculation Node
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

// Repeater Node
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

// Component Node
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

// Styling Node
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

// Workflow Node
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

// Node types mapping
export const nodeTypes = {
  start: StartNode,
  condition: ConditionNode,
  calculation: CalculationNode,
  repeater: RepeaterNode,
  component: ComponentNode,
  styling: StylingNode,
  workflow: WorkflowNode,
};
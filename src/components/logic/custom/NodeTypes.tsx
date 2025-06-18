// Node Type Exports
export { default as BaseNode } from './BaseNode';
export { default as StartNode } from './StartNode';
export { default as ConditionNode } from './ConditionNode';
export { default as CalculationNode } from './CalculationNode';
export { default as RepeaterNode } from './RepeaterNode';
export { default as ComponentNode } from './ComponentNode';
export { default as StylingNode } from './StylingNode';
export { default as WorkflowNode } from './WorkflowNode';

// Import all node components
import StartNode from './StartNode';
import ConditionNode from './ConditionNode';
import CalculationNode from './CalculationNode';
import RepeaterNode from './RepeaterNode';
import ComponentNode from './ComponentNode';
import StylingNode from './StylingNode';
import WorkflowNode from './WorkflowNode';

// Node types mapping for React Flow
export const nodeTypes = {
  start: StartNode,
  condition: ConditionNode,
  calculation: CalculationNode,
  repeater: RepeaterNode,
  component: ComponentNode,
  styling: StylingNode,
  workflow: WorkflowNode,
};

// Default export for convenience
export default nodeTypes;
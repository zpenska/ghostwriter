import { GitBranch, Sigma, Repeat2 } from 'lucide-react';

export interface NodeTypeDef {
  label: string;
  icon: React.ElementType;
  color: string;
  group: string;
  description?: string;
  prompt?: string;
}

const nodeMeta: Record<string, NodeTypeDef> = {
  IfNode: {
    label: 'If',
    icon: GitBranch,
    color: 'badge-indigo',
    group: 'Logic',
    description: 'Basic conditional check',
    prompt: 'Only show this if member is over 65.'
  },
  ExpressionNode: {
    label: 'Expression',
    icon: Sigma,
    color: 'badge-pink',
    group: 'Logic',
    description: 'AND / OR chaining logic',
    prompt: 'Show if the member has diabetes and is over 45.'
  },
  LoopNode: {
    label: 'Loop',
    icon: Repeat2,
    color: 'badge-blue',
    group: 'Looping',
    description: 'Repeat for array-based inputs',
    prompt: 'Repeat this block for each claim line.'
  }
};

export default nodeMeta;

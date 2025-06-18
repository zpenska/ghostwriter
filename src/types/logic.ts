// src/types/logic.ts

import { Node, Edge } from '@xyflow/react';

// Base interfaces for Casper variables and blocks
export interface CasperVariable {
  key: string;
  name: string;
  description: string;
  group?: string;
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'array';
  required?: boolean;
  defaultValue?: any;
  enumValues?: string[];
}

export interface CasperBlock {
  id: string;
  name: string;
  category: string;
  description?: string;
  content?: string;
}

// Logic-specific node data interfaces that extend Record<string, unknown>
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
}

export interface StartNodeData extends BaseNodeData {
  label: string;
}

export interface ConditionNodeData extends BaseNodeData {
  label: string;
  condition?: string;
  explanation?: string;
}

export interface ActionNodeData extends BaseNodeData {
  label: string;
  actionType?: 'insertBlock' | 'modifyContent' | 'setVariable';
  targetId?: string;
  explanation?: string;
}

export interface StopNodeData extends BaseNodeData {
  label: string;
}

export interface BlockNodeData extends BaseNodeData {
  label: string;
  blockId?: string;
  blockName?: string;
  category?: string;
}

export interface VariableNodeData extends BaseNodeData {
  label: string;
  variableKey?: string;
  variableName?: string;
  description?: string;
}

// Union type for all node data types
export type LogicNodeData = 
  | StartNodeData 
  | ConditionNodeData 
  | ActionNodeData 
  | StopNodeData 
  | BlockNodeData 
  | VariableNodeData;

// Custom edge data interface that extends Record<string, unknown>
export interface CustomEdgeData extends Record<string, unknown> {
  label?: string;
  animated?: boolean;
}

// Use React Flow's base types directly - no extension needed
export type LogicNode = Node<LogicNodeData>;
export type LogicEdge = Edge<CustomEdgeData>;

// Template structure
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  usedVariables: CasperVariable[];
  usedBlocks: CasperBlock[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'draft' | 'archived';
}

// Variable and block grouping for UI
export interface VariableGroup {
  name: string;
  variables: CasperVariable[];
}

export interface BlockGroup {
  name: string;
  blocks: CasperBlock[];
}

// API request/response types
export interface CasperLogicRequest {
  prompt: string;
  templateId: string;
}

export interface CasperLogicResponse {
  success: boolean;
  nodes: LogicNode[];
  edges: LogicEdge[];
  message?: string;
  error?: string;
}

// Firestore document structures
export interface FirestoreNodeDocument {
  type: string;
  position: { x: number; y: number };
  data: LogicNodeData;
}

export interface FirestoreEdgeDocument {
  source: string;
  target: string;
  label?: string;
  type: string;
  animated?: boolean;
}

// Component prop types
export interface LogicCanvasProps {
  templateId: string;
}

export interface LogicSidebarProps {
  templateId: string;
}

export interface CasperLogicWidgetProps {
  variables: VariableGroup[];
  onLogicInserted?: () => void;
}

// Drag and drop data transfer types
export interface DragData {
  type: string;
  label: string;
  extraData?: {
    variableKey?: string;
    variableName?: string;
    blockId?: string;
    blockName?: string;
    category?: string;
    description?: string;
  };
}

// Error types
export class LogicBuilderError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'LogicBuilderError';
  }
}

// Utility types for forms and validation
export type NodeType = 'start' | 'condition' | 'action' | 'stop' | 'block' | 'variable';
export type EdgeType = 'custom';

// Constants
export const NODE_TYPES: Record<NodeType, string> = {
  start: 'Start',
  condition: 'Condition', 
  action: 'Action',
  stop: 'Stop',
  block: 'Block',
  variable: 'Variable'
} as const;

export const EDGE_LABELS = {
  YES: 'Yes',
  NO: 'No',
  ARROW: '→',
  LOOP: 'Loop'
} as const;
import type { NodeProps } from 'reactflow';
import React from 'react';

const BlockNode: React.ComponentType<NodeProps> = require('./BlockNode').default;
const IfNode: React.ComponentType<NodeProps> = require('./IfNode').default;
const LoopNode: React.ComponentType<NodeProps> = require('./LoopNode').default;
const VariableNode: React.ComponentType<NodeProps> = require('./VariableNode').default;

const nodeTypes = {
  BlockNode,
  IfNode,
  LoopNode,
  VariableNode,
};

export default nodeTypes;

// src/components/logic/ReactFlowWrapper.tsx
'use client';
import React from 'react';
import LogicCanvas from './LogicCanvas';

interface ReactFlowWrapperProps {
  templateId: string;
}

export default function ReactFlowWrapper({ templateId }: ReactFlowWrapperProps) {
  return <LogicCanvas templateId={templateId} />;
}
'use client';


import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Background,
  type Node,
  type Edge,
} from 'reactflow';

import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  DocumentData,
} from 'firebase/firestore';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import useLayout from '@/hooks/useLayout';

import nodeTypes from './custom/reactflowNodeTypes'; // ✅ React component map
import edgeTypes from './custom/edgeTypes'; // ✅ Optional but included

const proOptions = {
  account: 'paid-pro',
  hideAttribution: true,
};

interface LogicCanvasProps {
  templateId: string;
}

type NodeData = {
  label?: string;
  blockId?: string;
  isVisualOnly?: boolean;
  [key: string]: any;
};

function LogicCanvasInner({ templateId }: LogicCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<any>>([]);

  useLayout({ nodes, edges, setNodes });

  useEffect(() => {
    if (!templateId) return;

    const unsubNodes = onSnapshot(
      collection(db, 'templates', templateId, 'logic-nodes'),
      (snapshot) => {
        const logicNodes: Node<NodeData>[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          type: doc.data().type || 'BlockNode',
          position: { x: 0, y: 0 },
          data: doc.data() as NodeData,
        }));

        setNodes(logicNodes);

        if (logicNodes.length === 0) {
          loadTemplateBlocks(templateId, setNodes);
        }
      }
    );

    const unsubEdges = onSnapshot(
      collection(db, 'templates', templateId, 'logic-edges'),
      (snapshot) => {
        const edgeData: Edge[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        setEdges(edgeData);
      }
    );

    return () => {
      unsubNodes();
      unsubEdges();
    };
  }, [templateId]);

  return (
    <div className="w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes} // ✅ actual React components
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        minZoom={0.3}
        maxZoom={1.5}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        deleteKeyCode={null}
        proOptions={proOptions}
      >
        <Background color="#f6f6f6" gap={24} />
      </ReactFlow>
    </div>
  );
}

async function loadTemplateBlocks(
  templateId: string,
  setNodes: (nodes: Node<NodeData>[]) => void
) {
  try {
    const ref = doc(db, 'templates', templateId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const template = snap.data() as DocumentData;
      if (Array.isArray(template.blocks)) {
        const blockNodes: Node<NodeData>[] = template.blocks.map((block: any, i: number) => ({
          id: block.id,
          type: 'BlockNode',
          position: { x: 0, y: i * 160 },
          data: {
            label: block.label || block.id,
            blockId: block.id,
            isVisualOnly: true,
          },
        }));
        setNodes(blockNodes);
      }
    }
  } catch (err) {
    console.error('❌ Failed to load blocks:', err);
  }
}

export default function LogicCanvas({ templateId }: LogicCanvasProps) {
  return (
    <ReactFlowProvider>
      <LogicCanvasInner templateId={templateId} />
    </ReactFlowProvider>
  );
}

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Play, Trash2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface LogicCanvasProps {
  templateId: string;
}

interface FlowNode {
  id: string;
  type: string;
  data: any;
  position: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

// Simple Node Component
const NodeComponent: React.FC<{
  node: FlowNode;
  onDrag: (id: string, position: { x: number; y: number }) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}> = ({ node, onDrag, selected, onSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    });
    onSelect(node.id);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    onDrag(node.id, newPosition);
  }, [isDragging, dragStart, node.id, onDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getNodeStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      left: node.position.x,
      top: node.position.y,
      cursor: 'move',
      userSelect: 'none' as const,
      border: selected ? '2px solid #3b82f6' : '1px solid #d1d5db',
      zIndex: 10, // Ensure nodes are above edges
    };

    switch (node.type) {
      case 'start':
        return {
          ...baseStyle,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#166534',
        };
      case 'stop':
        return {
          ...baseStyle,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#991b1b',
        };
      case 'condition':
        return {
          ...baseStyle,
          width: '120px',
          height: '80px',
          backgroundColor: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: '500',
          color: '#92400e',
          borderRadius: '8px',
          transform: 'rotate(45deg)',
        };
      case 'action':
        return {
          ...baseStyle,
          width: '140px',
          height: '80px',
          backgroundColor: '#dbeafe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: '500',
          color: '#1e40af',
          borderRadius: '8px',
        };
      case 'block':
        return {
          ...baseStyle,
          width: '160px',
          height: '80px',
          backgroundColor: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: '500',
          color: '#166534',
          borderRadius: '8px',
        };
      default:
        return {
          ...baseStyle,
          width: '120px',
          height: '80px',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#374151',
          borderRadius: '8px',
        };
    }
  };

  const getNodeContent = () => {
    switch (node.type) {
      case 'start':
        return 'START';
      case 'stop':
        return 'STOP';
      case 'condition':
        return (
          <div style={{ transform: 'rotate(-45deg)', textAlign: 'center' }}>
            <div>{node.data.label || 'Condition'}</div>
            {node.data.condition && (
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                {node.data.condition}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div style={{ textAlign: 'center', padding: '8px' }}>
            <div>{node.data.label || node.type}</div>
            {node.data.actionType && (
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                {node.data.actionType}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div
      style={getNodeStyle()}
      onMouseDown={handleMouseDown}
    >
      {getNodeContent()}
    </div>
  );
};

// NEW: Edge/Connection Component
const EdgeComponent: React.FC<{
  edge: FlowEdge;
  nodes: FlowNode[];
}> = ({ edge, nodes }) => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return null;

  // Calculate connection points (center of nodes)
  const sourceX = sourceNode.position.x + 60; // Rough center
  const sourceY = sourceNode.position.y + 40;
  const targetX = targetNode.position.x + 60;
  const targetY = targetNode.position.y + 40;

  // Simple line path
  const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

  // Calculate label position (midpoint)
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  // Get edge color based on label
  const getEdgeColor = () => {
    if (edge.label?.toLowerCase().includes('yes')) return '#10b981';
    if (edge.label?.toLowerCase().includes('no')) return '#ef4444';
    return '#6b7280';
  };

  return (
    <g>
      {/* Edge line */}
      <path
        d={path}
        stroke={getEdgeColor()}
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
        className="hover:stroke-blue-500 transition-colors"
      />
      
      {/* Edge label */}
      {edge.label && (
        <g>
          {/* Label background */}
          <rect
            x={labelX - 15}
            y={labelY - 8}
            width="30"
            height="16"
            fill="white"
            stroke="#d1d5db"
            rx="4"
          />
          {/* Label text */}
          <text
            x={labelX}
            y={labelY + 3}
            textAnchor="middle"
            fontSize="10"
            fill={getEdgeColor()}
            fontWeight="bold"
          >
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
};

export default function LogicCanvas({ templateId }: LogicCanvasProps) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // FIXED: Load data from single document instead of separate collections
  useEffect(() => {
    if (!templateId) return;

    console.log('🔍 LogicCanvas: Monitoring template:', templateId);

    const templateDocRef = doc(db, 'templates', templateId);

    const unsubscribe = onSnapshot(templateDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const logic = data.logic || {};
        
        const loadedNodes: FlowNode[] = logic.nodes || [];
        const loadedEdges: FlowEdge[] = logic.edges || [];
        
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setLoading(false);
        
        console.log('📊 LogicCanvas: Data loaded:', {
          nodeCount: loadedNodes.length,
          edgeCount: loadedEdges.length
        });
      } else {
        setNodes([]);
        setEdges([]);
        setLoading(false);
        console.log('📊 LogicCanvas: No template document found');
      }
    }, (error) => {
      console.error('❌ LogicCanvas: Error monitoring template:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [templateId]);

  // Save logic to Firestore (helper function)
  const saveLogicToFirestore = useCallback(async (updatedNodes: FlowNode[], updatedEdges?: FlowEdge[]) => {
    try {
      const templateDocRef = doc(db, 'templates', templateId);
      
      await updateDoc(templateDocRef, {
        'logic.nodes': updatedNodes,
        'logic.edges': updatedEdges || edges,
        'logic.updatedAt': new Date().toISOString()
      });
      
      console.log('✅ LogicCanvas: Logic saved to Firestore');
    } catch (error) {
      console.error('❌ LogicCanvas: Error saving logic:', error);
    }
  }, [templateId, edges]);

  // Handle node drag with Firestore save
  const handleNodeDrag = useCallback(async (nodeId: string, position: { x: number; y: number }) => {
    const updatedNodes = nodes.map(node => 
      node.id === nodeId ? { ...node, position } : node
    );
    
    setNodes(updatedNodes);
    
    // Debounced save to Firestore
    clearTimeout((window as any).dragSaveTimeout);
    (window as any).dragSaveTimeout = setTimeout(() => {
      saveLogicToFirestore(updatedNodes);
    }, 500);
  }, [nodes, saveLogicToFirestore]);

  // Handle drop from sidebar with Firestore save
  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    
    const type = event.dataTransfer.getData('application/node-type');
    const label = event.dataTransfer.getData('text/plain');
    
    if (!type || !label) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const position = {
      x: (event.clientX - rect.left - pan.x) / zoom,
      y: (event.clientY - rect.top - pan.y) / zoom,
    };

    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: { label },
    };

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    
    // Save to Firestore
    await saveLogicToFirestore(updatedNodes);
  }, [templateId, zoom, pan, nodes, saveLogicToFirestore]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Control functions
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleFitView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // FIXED: Clear logic with single document approach
  const clearLogic = async () => {
    if (!confirm('Clear all logic? This cannot be undone.')) return;

    try {
      const templateDocRef = doc(db, 'templates', templateId);
      
      await updateDoc(templateDocRef, {
        'logic.nodes': [],
        'logic.edges': [],
        'logic.updatedAt': new Date().toISOString()
      });
      
      console.log('🗑️ LogicCanvas: Cleared all logic');
    } catch (error) {
      console.error('❌ LogicCanvas: Error clearing logic:', error);
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-50 overflow-hidden">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #9ca3af 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* SVG for edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            {/* Arrow marker for edges */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6b7280"
              />
            </marker>
          </defs>
          
          {/* Render edges */}
          {edges.map(edge => (
            <EdgeComponent key={edge.id} edge={edge} nodes={nodes} />
          ))}
        </svg>

        {/* Render nodes */}
        {nodes.map(node => (
          <NodeComponent
            key={node.id}
            node={node}
            onDrag={handleNodeDrag}
            selected={selectedNode === node.id}
            onSelect={setSelectedNode}
          />
        ))}

        {/* Empty state */}
        {!loading && nodes.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
              <Play className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Logic Yet</h3>
              <p className="text-sm text-gray-600 mb-3">
                Drag nodes from the sidebar or ask Casper AI to create logic flows
              </p>
              <div className="text-xs text-gray-500">
                Try: "If member language is Spanish, show Spanish footer"
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Panel */}
      <div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-sm p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600">{nodes.length} nodes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">{edges.length} edges</span>
          </div>
        </div>
        
        {loading && (
          <div className="text-xs text-amber-600 flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            Loading...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-sm p-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleFitView}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Fit View"
          >
            <Maximize className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="border-l border-gray-200 ml-1 pl-1">
            <button
              onClick={clearLogic}
              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
              title="Clear All Logic"
              disabled={nodes.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-600">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
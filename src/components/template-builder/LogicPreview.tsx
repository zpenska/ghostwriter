// src/components/template-builder/LogicPreview.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { Play, Edit, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface LogicPreviewProps {
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
}

// Mini Node Component for preview
const PreviewNode: React.FC<{ node: FlowNode }> = ({ node }) => {
  const getNodeStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      left: node.position.x * 0.5, // Scale down for preview
      top: node.position.y * 0.5,
      fontSize: '10px',
      userSelect: 'none' as const,
      pointerEvents: 'none' as const,
    };

    switch (node.type) {
      case 'start':
        return {
          ...baseStyle,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#dcfce7',
          border: '2px solid #16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: '#166534',
        };
      case 'stop':
        return {
          ...baseStyle,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          border: '2px solid #dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: '#991b1b',
        };
      case 'condition':
        return {
          ...baseStyle,
          width: '80px',
          height: '50px',
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '500',
          color: '#92400e',
          borderRadius: '8px',
          transform: 'rotate(45deg)',
        };
      case 'action':
        return {
          ...baseStyle,
          width: '90px',
          height: '50px',
          backgroundColor: '#dbeafe',
          border: '2px solid #3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '500',
          color: '#1e40af',
          borderRadius: '8px',
        };
      case 'block':
        return {
          ...baseStyle,
          width: '100px',
          height: '50px',
          backgroundColor: '#f3e8ff',
          border: '2px solid #8b5cf6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '500',
          color: '#6b21a8',
          borderRadius: '8px',
        };
      default:
        return {
          ...baseStyle,
          width: '80px',
          height: '50px',
          backgroundColor: '#f3f4f6',
          border: '2px solid #6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
            <div>{node.data.label || 'IF'}</div>
          </div>
        );
      default:
        return (
          <div style={{ textAlign: 'center', padding: '4px', overflow: 'hidden' }}>
            <div>{node.data.label || node.type}</div>
          </div>
        );
    }
  };

  return <div style={getNodeStyle()}>{getNodeContent()}</div>;
};

export default function LogicPreview({ templateId }: LogicPreviewProps) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLogic, setHasLogic] = useState(false);
  const router = useRouter();

  // Load logic from template
  useEffect(() => {
    if (!templateId) return;

    const templateDocRef = doc(db, 'templates', templateId);

    const unsubscribe = onSnapshot(templateDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const logic = data.logic || {};
        
        const loadedNodes: FlowNode[] = logic.nodes || [];
        const loadedEdges: FlowEdge[] = logic.edges || [];
        
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setHasLogic(loadedNodes.length > 0 || loadedEdges.length > 0);
        setLoading(false);
        
        console.log('📊 LogicPreview: Loaded logic', {
          nodeCount: loadedNodes.length,
          edgeCount: loadedEdges.length
        });
      } else {
        setNodes([]);
        setEdges([]);
        setHasLogic(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [templateId]);

  const handleCreateLogic = () => {
    // FIXED: Use the correct route structure
    router.push(`/templates/${templateId}/logic`);
  };
  
  const handleEditLogic = () => {
    // FIXED: Use the correct route structure  
    router.push(`/templates/${templateId}/logic`);
  };

  if (loading) {
    return (
      <div className="h-full bg-zinc-50 rounded-lg border border-zinc-200 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-2"></div>
            <div className="text-sm text-zinc-600">Loading logic...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-50 rounded-lg border border-zinc-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-zinc-900">Template Logic</h3>
        <div className="flex gap-2">
          {hasLogic ? (
            <Button
              onClick={handleEditLogic}
              className="bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Logic
            </Button>
          ) : (
            <Button
              onClick={handleCreateLogic}
              className="bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Logic
            </Button>
          )}
        </div>
      </div>

      {hasLogic ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-zinc-600">{nodes.length} nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-zinc-600">{edges.length} edges</span>
              </div>
              <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                Logic Active
              </div>
            </div>
          </div>

          {/* Logic Preview Canvas */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 h-80 relative overflow-hidden">
            <div className="absolute inset-0 p-4">
              {/* Grid background */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle, #9ca3af 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              
              {/* Render mini nodes */}
              <div className="relative h-full">
                {nodes.map(node => (
                  <PreviewNode key={node.id} node={node} />
                ))}
              </div>

              {/* Overlay message */}
              <div className="absolute bottom-4 left-4 bg-white border border-zinc-200 rounded px-3 py-2 text-xs text-zinc-600">
                Preview • Click "Edit Logic" to modify
              </div>
            </div>
          </div>

          {/* Logic Summary */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <h4 className="font-medium text-zinc-900 mb-2">Logic Flow Summary</h4>
            <div className="space-y-1 text-sm text-zinc-600">
              {nodes.filter(n => n.type === 'condition').map(node => (
                <div key={node.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  <span>If {node.data.condition || node.data.label}</span>
                </div>
              ))}
              {nodes.filter(n => n.type === 'action').map(node => (
                <div key={node.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Then {node.data.label}</span>
                </div>
              ))}
              {nodes.filter(n => n.type === 'block').map(node => (
                <div key={node.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Insert {node.data.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center h-80 flex flex-col items-center justify-center">
          <Settings className="w-12 h-12 text-zinc-400 mb-4" />
          <h4 className="text-lg font-medium text-zinc-900 mb-2">No Logic Configured</h4>
          <p className="text-zinc-600 mb-4">
            Add conditional logic and rules to make your template dynamic.
          </p>
          <div className="space-y-2 text-sm text-zinc-500 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span>Create conditional content blocks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Set up variable-based rules</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <span>Design complex workflows</span>
            </div>
          </div>
          <Button
            onClick={handleCreateLogic}
            className="bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Logic Flow
          </Button>
        </div>
      )}
    </div>
  );
}
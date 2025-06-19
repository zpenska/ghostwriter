'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import CasperLogicWidget from '@/components/logic/CasperLogicWidget';
import LogicSidebar from '@/components/logic/LogicSidebar';
import { getCasperVariableContext } from '@/lib/firebase/loaders/getCasperVariableContext';
import { getBlockContext } from '@/lib/firebase/loaders/getBlockContext';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface VariableGroup {
  name: string;
  variables: { key: string; name: string; description: string }[];
}

interface BlockGroup {
  name: string;
  blocks: { id: string; name: string; category: string; description: string }[];
}

// Dynamic import with proper React Flow provider
const ReactFlowNoSSR = dynamic(() => import('@/components/logic/ReactFlowWrapper'), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-zinc-500">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-2"></div>
        <div>Loading Canvas...</div>
      </div>
    </div>
  )
});

export default function LogicBuilderPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  
  // Multiple ways to get templateId for reliability
  const templateId = 
    params?.id || 
    searchParams?.get('id') || 
    searchParams?.get('templateId');

  const [logicExists, setLogicExists] = useState<boolean | null>(null);
  const [casperVariables, setCasperVariables] = useState<VariableGroup[]>([]);
  const [casperBlocks, setCasperBlocks] = useState<BlockGroup[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [saving, setSaving] = useState(false);

  // Load Casper context data
  useEffect(() => {
    const loadCasperData = async () => {
      try {
        console.log('📊 Loading Casper context data...');
        
        const [variables, blocks] = await Promise.all([
          getCasperVariableContext(),
          getBlockContext()
        ]);

        // Group variables by category
        const groupedVariables = variables.reduce((acc: VariableGroup[], v) => {
          const group = acc.find((g) => g.name === v.group);
          const variable = {
            key: v.key,
            name: v.name,
            description: v.description,
          };

          if (group) {
            group.variables.push(variable);
          } else {
            acc.push({ name: v.group || 'General', variables: [variable] });
          }

          return acc;
        }, []);

        // Group blocks by category
        const groupedBlocks = blocks.reduce((acc: BlockGroup[], b) => {
          const group = acc.find((g) => g.name === b.category);
          const block = {
            id: b.id,
            name: b.name,
            category: b.category,
            description: b.description || '',
          };

          if (group) {
            group.blocks.push(block);
          } else {
            acc.push({ name: b.category || 'General', blocks: [block] });
          }

          return acc;
        }, []);

        setCasperVariables(groupedVariables);
        setCasperBlocks(groupedBlocks);
        
        console.log('✅ Casper data loaded:', {
          variableGroups: groupedVariables.length,
          blockGroups: groupedBlocks.length,
          totalVars: variables.length,
          totalBlocks: blocks.length
        });
      } catch (error) {
        console.error('❌ Error loading Casper data:', error);
      }
    };

    loadCasperData();
  }, []);

  // Monitor logic existence with real-time updates
  useEffect(() => {
    if (!templateId) {
      console.warn('⚠️ No templateId found for logic monitoring');
      return;
    }

    console.log('🔍 Monitoring logic for template:', templateId);

    // FIXED: Use single document approach instead of separate collections
    // OLD (4 segments - invalid): templates/{templateId}/logic/nodes
    // NEW (3 segments - valid): templates/{templateId}
    const templateDocRef = doc(db, 'templates', templateId as string);

    const unsubscribe = onSnapshot(templateDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const logic = data.logic || {};
        
        const nodes = logic.nodes || [];
        const edges = logic.edges || [];
        
        const nodeCount = nodes.length;
        const edgeCount = edges.length;
        
        setNodeCount(nodeCount);
        setEdgeCount(edgeCount);
        setLogicExists(nodeCount > 0 || edgeCount > 0);
        
        console.log('📊 Logic updated:', { 
          nodeCount, 
          edgeCount, 
          hasLogic: nodeCount > 0 || edgeCount > 0 
        });
      } else {
        // Document doesn't exist yet
        setNodeCount(0);
        setEdgeCount(0);
        setLogicExists(false);
        console.log('📊 No template document found');
      }
    }, (error) => {
      console.error('❌ Error monitoring logic:', error);
      setLogicExists(false);
    });

    return () => unsubscribe();
  }, [templateId]);

  const handleLogicInserted = () => {
    console.log('🔄 Logic inserted callback triggered');
    // Force canvas refresh by updating key
    setRefreshKey(prev => prev + 1);
    
    // The real-time listeners should handle the actual updates,
    // but this ensures the canvas component remounts if needed
    setTimeout(() => {
      console.log('⚡ Canvas refresh completed');
    }, 500);
  };

  const handleBackToTemplate = () => {
    if (templateId) {
      router.push(`/template-builder?id=${templateId}`);
    } else {
      router.push('/templates');
    }
  };

  // NEW: Save logic function
  const handleSaveLogic = async () => {
    if (!templateId) {
      console.warn('⚠️ No templateId available for saving');
      return;
    }

    setSaving(true);
    
    try {
      // Get current logic state from Firestore
      const templateDocRef = doc(db, 'templates', templateId as string);
      const templateDoc = await getDoc(templateDocRef);
      
      if (templateDoc.exists()) {
        const data = templateDoc.data();
        const logic = data.logic || {};
        
        const currentNodes = logic.nodes || [];
        const currentEdges = logic.edges || [];
        
        if (currentNodes.length === 0 && currentEdges.length === 0) {
          alert('No logic to save. Create some logic first.');
          return;
        }

        // Update with save timestamp
        await updateDoc(templateDocRef, {
          'logic.nodes': currentNodes,
          'logic.edges': currentEdges,
          'logic.lastSaved': new Date().toISOString(),
          'logic.savedBy': 'user' // You can replace with actual user info
        });

        console.log('✅ Logic saved successfully');
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg shadow-lg z-50';
        successMessage.textContent = `Logic saved! ${currentNodes.length} nodes, ${currentEdges.length} edges`;
        document.body.appendChild(successMessage);
        
        // Remove message after 3 seconds
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
        
      } else {
        console.error('❌ Template not found');
        alert('Template not found. Please make sure the template exists.');
      }
      
    } catch (error) {
      console.error('❌ Error saving logic:', error);
      alert('Failed to save logic. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (!templateId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-zinc-900 mb-2">Template ID Required</div>
          <div className="text-zinc-600 mb-4">Unable to load logic builder without a valid template ID.</div>
          <Button onClick={() => router.push('/templates')} variant="outline">
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-[280px] border-r border-zinc-200 bg-white overflow-y-auto">
        <LogicSidebar templateId={templateId as string} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToTemplate}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Back to Template
            </Button>
            <h1 className="text-lg font-semibold text-zinc-900">Logic Builder</h1>
          </div>

          {/* Status indicators and Save button */}
          <div className="flex items-center gap-4">
            {/* Status indicators */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-zinc-600">{nodeCount} nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-zinc-600">{edgeCount} edges</span>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${
                logicExists 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-zinc-100 text-zinc-600'
              }`}>
                {logicExists ? 'Logic Active' : 'No Logic'}
              </div>
            </div>

            {/* Save button */}
            <Button
              onClick={handleSaveLogic}
              disabled={!logicExists || saving}
              className="bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-400"
            >
              {saving ? 'Saving...' : 'Save Logic'}
            </Button>
          </div>
        </div>

        {/* Logic Canvas */}
        <div className="flex-1 bg-zinc-50 overflow-hidden relative">
          {logicExists === null ? (
            // Loading state
            <div className="h-full flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-2"></div>
                <div>Loading logic...</div>
              </div>
            </div>
          ) : (
            // Canvas (shows regardless of logic existence)
            <div className="h-full w-full">
              <ReactFlowNoSSR 
                key={`canvas-${templateId}-${refreshKey}`} 
                templateId={templateId as string} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Casper Logic AI Widget */}
      <CasperLogicWidget
        variables={casperVariables}
        onLogicInserted={handleLogicInserted}
      />
    </div>
  );
}
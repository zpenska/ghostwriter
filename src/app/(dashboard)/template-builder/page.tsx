'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import TemplateEditor from '@/components/template-builder/TemplateEditor';
import VariablePanel from '@/components/template-builder/VariablePanel';
import AiAgentChat from '@/components/template-builder/AiAgentChat';
import { buttonStyles } from '@/lib/utils/button-styles';

const tabs = [
  { name: 'Builder', href: '#', current: true },
  { name: 'Logic', href: '#', current: false },
  { name: 'Properties', href: '#', current: false },
  { name: 'Preview', href: '#', current: false },
];

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function TemplateBuilderPage() {
  const [activeTab, setActiveTab] = useState('Builder');
  const [variablePanelCollapsed, setVariablePanelCollapsed] = useState(false);
  const [editorRef, setEditorRef] = useState<any>(null);
  const [aiAgentProvider, setAiAgentProvider] = useState<any>(null);
  const [showAiChat, setShowAiChat] = useState(false);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag ended:', { active: active.id, over: over?.id }); // Debug log
    
    if (over && over.id === 'editor-droppable' && editorRef) {
      const variable = active.data.current;
      if (variable) {
        // Insert the variable with special styling
        const variableHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 font-mono text-sm" contenteditable="false">{{${variable.name}}}</span>&nbsp;`;
        editorRef.chain().focus().insertContent(variableHtml).run();
      }
    }
  };

  const handleEditorReady = (editor: any, aiProvider: any) => {
    setEditorRef(editor);
    setAiAgentProvider(aiProvider);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-full bg-page-nimbus">
        {/* Variable Panel - Only show on Builder tab */}
        {activeTab === 'Builder' && (
          <aside className={classNames(
            'relative border-r bg-white shadow-sm transition-all duration-300',
            variablePanelCollapsed ? 'w-12' : 'w-64'
          )}>
            {/* Collapse button */}
            <button
              onClick={() => setVariablePanelCollapsed(!variablePanelCollapsed)}
              className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50"
            >
              {variablePanelCollapsed ? (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
            
            {!variablePanelCollapsed && <VariablePanel />}
          </aside>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header with Tabs */}
          <div className="bg-white border-b border-gray-200 px-6">
            <div className="flex items-center justify-between py-4">
              <h1 className="text-2xl font-semibold text-gray-900">Template Builder</h1>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAiChat(!showAiChat)}
                  type="button"
                  className={showAiChat ? buttonStyles.primary : buttonStyles.secondary}
                  title="Toggle AI Assistant"
                >
                  AI Assistant
                </button>
                <button
                  type="button"
                  className={buttonStyles.secondary}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  className={buttonStyles.yellow}
                >
                  Publish Template
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-2">
              <div className="grid grid-cols-1 sm:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => handleTabChange(e.target.value)}
                  aria-label="Select a tab"
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-accent-lavender"
                >
                  {tabs.map((tab) => (
                    <option key={tab.name}>{tab.name}</option>
                  ))}
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
                />
              </div>
              <div className="hidden sm:block">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.name}
                      onClick={() => handleTabChange(tab.name)}
                      aria-current={tab.name === activeTab ? 'page' : undefined}
                      className={classNames(
                        tab.name === activeTab
                          ? 'border-accent-lavender text-accent-lavender'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                        'border-b-2 px-1 pb-4 text-sm font-medium whitespace-nowrap'
                      )}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'Builder' && (
              <div className="h-full flex">
                <div className={classNames(
                  "flex-1 p-6 transition-all duration-300",
                  showAiChat && aiAgentProvider ? "pr-0" : ""
                )}>
                  <TemplateEditor onEditorReady={handleEditorReady} />
                </div>
                
                {/* AI Chat Panel */}
                {showAiChat && aiAgentProvider && (
                  <div className="w-[400px] border-l bg-white shadow-lg animate-slide-in-right">
                    <AiAgentChat 
                      provider={aiAgentProvider} 
                      editor={editorRef}
                      onClose={() => setShowAiChat(false)}
                    />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'Logic' && (
              <div className="p-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium mb-4">Template Logic</h2>
                  <p className="text-gray-600">Configure conditional logic and rules for your template.</p>
                  <div className="mt-6 space-y-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Logic configuration coming soon...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'Properties' && (
              <div className="p-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium mb-4">Template Properties</h2>
                  <p className="text-gray-600">Set template metadata and properties.</p>
                  <div className="mt-6 space-y-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Template properties coming soon...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'Preview' && (
              <div className="p-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium mb-4">Template Preview</h2>
                  <p className="text-gray-600">Preview your template with sample data.</p>
                  {editorRef && (
                    <div className="mt-6 prose prose-sm max-w-none border rounded-lg p-6">
                      <div dangerouslySetInnerHTML={{ __html: editorRef.getHTML() }} />
                    </div>
                  )}
                  {!editorRef && (
                    <div className="mt-6 border rounded-lg p-4">
                      <p className="text-sm text-gray-500">No content to preview yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
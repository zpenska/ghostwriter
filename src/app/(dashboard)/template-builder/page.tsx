'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import TemplateEditor from '@/components/template-builder/TemplateEditor';
import VariablePanel from '@/components/template-builder/VariablePanel';
import { Editor } from '@tiptap/react';
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';

export default function TemplateBuilderPage() {
  const [activeTab, setActiveTab] = useState('Builder');
  const [showAiChat, setShowAiChat] = useState(false);
  const [variablePanelCollapsed, setVariablePanelCollapsed] = useState(false);
  const [editorRef, setEditorRef] = useState<Editor | null>(null);

  const tabs = ['Builder', 'Logic', 'Properties', 'Preview'];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id === 'editor-droppable' && editorRef) {
      const variable = active.data.current;
      if (variable) {
        // Insert the variable with special styling
        const variableHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 font-mono text-sm" contenteditable="false">{{${variable.name}}}</span>&nbsp;`;
        editorRef.chain().focus().insertContent(variableHtml).run();
      }
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={classNames(
          'bg-white border-r border-gray-200 transition-all duration-300',
          variablePanelCollapsed ? 'w-12' : 'w-80'
        )}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className={classNames(
                'text-lg font-semibold text-gray-900',
                variablePanelCollapsed ? 'hidden' : ''
              )}>
                Template Builder
              </h2>
              <button
                onClick={() => setVariablePanelCollapsed(!variablePanelCollapsed)}
                className={buttonStyles.icon}
              >
                {variablePanelCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          {!variablePanelCollapsed && (
            <div className="p-4">
              <VariablePanel />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">
                New Template
              </h1>
              <div className="flex space-x-3">
                <button
                  type="button"
                  className={buttonStyles.secondary}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  className={buttonStyles.primary}
                >
                  Save & Close
                </button>
                <button
                  type="button"
                  className={classNames(
                    'bg-[#8a7fae] hover:bg-[#7a6f9e] text-white',
                    'px-4 py-2 rounded-md font-medium text-sm',
                    'transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-[#8a7fae] focus:ring-offset-2',
                    'shadow-sm hover:shadow-md'
                  )}
                >
                  Publish Template
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={classNames(
                    tab === activeTab
                      ? 'border-[#8a7fae] text-[#8a7fae]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors'
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-hidden bg-gray-50">
            <div className="h-full flex gap-6">
              {/* Editor Area */}
              <div className="flex-1 bg-white rounded-lg shadow-sm">
                {activeTab === 'Builder' && (
                  <div className="h-full">
                    <TemplateEditor onEditorReady={setEditorRef} />
                  </div>
                )}
                {activeTab === 'Logic' && (
                  <div className="h-full bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Template Logic
                    </h3>
                    <p className="text-gray-500">
                      Configure conditional logic and rules for your template.
                    </p>
                  </div>
                )}
                {activeTab === 'Properties' && (
                  <div className="h-full bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Template Properties
                    </h3>
                    <p className="text-gray-500">
                      Set template metadata and configuration.
                    </p>
                  </div>
                )}
                {activeTab === 'Preview' && (
                  <div className="h-full bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Template Preview
                    </h3>
                    <p className="text-gray-500">
                      Preview your template with sample data.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
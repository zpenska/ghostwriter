'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import TemplateEditor from '@/components/template-builder/TemplateEditor';
import VariablePanel from '@/components/template-builder/VariablePanel';
import CasperAIWidget from '@/components/template-builder/CasperAIWidget';
import SaveTemplateModal from '@/components/template-builder/SaveTemplateModal';
import LogicPreview from '@/components/template-builder/LogicPreview';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { EditorContext } from '@/hooks/useEditorContext';
import { templateService } from '@/lib/services/template-service';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function TemplateBuilderPage() {
  const [activeTab, setActiveTab] = useState('Builder');
  const [showAiChat, setShowAiChat] = useState(false);
  const [variablePanelCollapsed, setVariablePanelCollapsed] = useState(false);
  const [editorRef, setEditorRef] = useState<Editor | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveType, setSaveType] = useState<'draft' | 'publish'>('draft');
  const [templateContent, setTemplateContent] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id');

  const tabs = ['Builder', 'Logic', 'Properties', 'Preview'];

  // Load existing template if editing
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplate = async (id: string) => {
    try {
      const template = await templateService.getTemplate(id);
      if (template) {
        setCurrentTemplate(template);
        setTemplateContent(template.content);
        
        // Set content in editor when it's ready
        if (editorRef) {
          editorRef.commands.setContent(template.content);
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template. Please try again.');
    }
  };

  // FIXED: Simple handleDragEnd function without DOM parsing errors
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('🎯 Drag ended:', { active: active.data.current, over: over?.id });

    if (over && over.id === 'editor-droppable' && editorRef) {
      const draggedData = active.data.current;
      
      if (!draggedData) {
        console.log('❌ No data found in drag event');
        return;
      }

      console.log('📝 Inserting content:', draggedData);

      if (draggedData.type === 'component') {
        // Handle block insertion - simple HTML insertion
        console.log('🧩 Inserting block:', draggedData.name);
        
        const wrappedContent = `
          <div class="component-block border-l-4 border-emerald-500 pl-4 my-4 bg-emerald-50 p-3 rounded-r-lg">
            <div class="text-xs text-emerald-700 font-medium mb-2">📄 ${draggedData.name}</div>
            <div class="component-content">
              ${draggedData.content}
            </div>
          </div>
          <p>&nbsp;</p>
        `;
        
        // Simple insertion - let Tiptap handle the HTML parsing
        editorRef.chain().focus().insertContent(wrappedContent).run();
          
      } else {
        // Handle variable insertion - keep existing functionality
        console.log('🏷️ Inserting variable:', draggedData.name);
        const variableHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300 font-mono text-sm" contenteditable="false">{{${draggedData.name}}}</span>&nbsp;`;
        editorRef.chain().focus().insertContent(variableHtml).run();
      }
      
      setHasUnsavedChanges(true);
    } else {
      console.log('❌ Drop target not found or editor not ready');
    }
  };

  const handleContentChange = (content: string) => {
    setTemplateContent(content);
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    if (!templateContent.trim()) {
      alert('Please add some content before saving.');
      return;
    }

    if (currentTemplate?.id) {
      // For existing templates, just save without modal
      await saveTemplate({
        ...currentTemplate,
        content: templateContent,
        status: 'draft',
        lastModifiedBy: 'current-user'
      });
    } else {
      // For new templates, show modal to get name and collection
      setSaveType('draft');
      setShowSaveModal(true);
    }
  };

  const handleSaveAndClose = async () => {
    if (!templateContent.trim()) {
      // If no content, just close
      router.push('/templates');
      return;
    }

    if (currentTemplate?.id) {
      // Save existing template and close
      await saveTemplate({
        ...currentTemplate,
        content: templateContent,
        status: 'published',
        lastModifiedBy: 'current-user'
      });
      router.push('/templates');
    } else if (hasUnsavedChanges) {
      // New template with changes - show modal
      setSaveType('publish');
      setShowSaveModal(true);
    } else {
      // No changes, just close
      router.push('/templates');
    }
  };

  // Centralized save function
  const saveTemplate = async (templateData: any) => {
    setSaving(true);
    
    try {
      // Extract variables from content
      const variables = templateService.extractVariables(templateContent);
      
      const saveData = {
        ...templateData,
        content: templateContent,
        variables,
        createdBy: currentTemplate?.createdBy || 'current-user',
        lastModifiedBy: 'current-user'
      };

      if (currentTemplate?.id) {
        // Update existing template - this will work with Tiptap collaboration
        await templateService.updateTemplate(currentTemplate.id, saveData, true); // Increment version
        
        // Update current template state
        setCurrentTemplate({ ...currentTemplate, ...saveData, version: (currentTemplate.version || 1) + 1 });
        
        console.log('✅ Template updated successfully');
      } else {
        // Create new template
        const templateId = await templateService.saveTemplate(saveData);
        
        // Update URL to reflect the new template ID without page refresh
        const newUrl = `/template-builder?id=${templateId}`;
        window.history.replaceState(null, '', newUrl);
        
        // Load the newly created template
        const newTemplate = await templateService.getTemplate(templateId);
        setCurrentTemplate(newTemplate);
        
        console.log('✅ Template saved successfully');
      }
      
      setHasUnsavedChanges(false);
      return true;
      
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    const success = await saveTemplate(templateData);
    
    if (success) {
      setShowSaveModal(false);
      
      // If this was triggered by "Save & Close", navigate to templates
      if (templateData.closeAfterSave) {
        router.push('/templates');
      }
      
      // Show success message
      const message = currentTemplate?.id ? 'Template updated successfully!' : 'Template saved successfully!';
      alert(message);
    }
  };

  const handleEditorReady = (editor: Editor) => {
    setEditorRef(editor);
    
    // Set content if we have a loaded template
    if (currentTemplate?.content) {
      editor.commands.setContent(currentTemplate.content);
    }
  };

  // Auto-save functionality - preserve Tiptap collaboration state
  useEffect(() => {
    if (!hasUnsavedChanges || !currentTemplate?.id) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        const variables = templateService.extractVariables(templateContent);
        await templateService.updateTemplate(
          currentTemplate.id,
          {
            content: templateContent,
            variables
          },
          false // Don't increment version for auto-saves to preserve collaboration
        );
        console.log('📄 Template auto-saved');
        // Don't reset hasUnsavedChanges for auto-saves to maintain collaboration state
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 10000); // Auto-save after 10 seconds to reduce conflicts with collaboration

    return () => clearTimeout(autoSaveTimer);
  }, [templateContent, hasUnsavedChanges, currentTemplate]);

  // Warn about unsaved changes when leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <EditorContext.Provider value={{ editor: editorRef }}>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex h-screen bg-white">
          {/* Variable Panel Sidebar - GREY background like Catalyst UI */}
          <div className={classNames(
            'bg-zinc-50 border-r border-zinc-200 transition-all duration-300 relative',
            variablePanelCollapsed ? 'w-12' : 'w-80'
          )}>
            {/* Collapse button positioned to align with main nav */}
            <button
              onClick={() => setVariablePanelCollapsed(!variablePanelCollapsed)}
              className={classNames(
                "absolute top-6 right-3 z-10 inline-flex items-center justify-center w-7 h-7 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-50",
                variablePanelCollapsed && "right-2"
              )}
            >
              {variablePanelCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </button>
            
            {!variablePanelCollapsed && (
              <div className="h-full pt-2">
                <VariablePanel />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header - WHITE background */}
            <div className="bg-white border-b border-zinc-200 px-6 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-semibold text-zinc-900">
                    {currentTemplate?.name || 'New Template'}
                  </h1>
                  {hasUnsavedChanges && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Unsaved changes
                    </span>
                  )}
                  {currentTemplate?.status && (
                    <span className={classNames(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      currentTemplate.status === 'published' 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-zinc-100 text-zinc-800"
                    )}>
                      {currentTemplate.status}
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button
                    outline
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="text-zinc-700 border-zinc-300 hover:bg-zinc-50"
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    onClick={handleSaveAndClose}
                    className="bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    Save & Close
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs - WHITE background */}
            <div className="bg-white border-b border-zinc-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={classNames(
                      tab === activeTab
                        ? 'border-zinc-900 text-zinc-900'
                        : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300',
                      'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area - WHITE background */}
            <div className="flex-1 p-6 overflow-hidden bg-white">
              <div className="h-full flex gap-6">
                {/* Editor Area - GREY background like Catalyst UI */}
                <div className="flex-1 bg-zinc-50 rounded-lg border border-zinc-200">
                  {activeTab === 'Builder' && (
                    <div className="h-full">
                      <TemplateEditor
                        documentId={currentTemplate?.id || 'new-template'}
                        userId="zach-dev"
                        userName="Zach"
                        templateName={currentTemplate?.name || 'New Template'}
                        onEditorReady={handleEditorReady}
                        onContentChange={handleContentChange}
                      />
                    </div>
                  )}
                  
                  {activeTab === 'Logic' && (
                    <div className="h-full">
                      {currentTemplate?.id ? (
                        <LogicPreview templateId={currentTemplate.id} />
                      ) : (
                        <div className="h-full bg-zinc-50 rounded-lg border border-zinc-200 p-6">
                          <h3 className="text-lg font-medium text-zinc-900 mb-4">Template Logic</h3>
                          <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center h-80 flex flex-col items-center justify-center">
                            <div className="text-zinc-500 mb-4">
                              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h4 className="text-lg font-medium text-zinc-900 mb-2">Save Template First</h4>
                            <p className="text-zinc-600 mb-4">
                              Please save your template before adding logic flows.
                            </p>
                            <Button
                              onClick={handleSaveDraft}
                              className="bg-zinc-900 text-white hover:bg-zinc-800"
                            >
                              Save Template
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'Properties' && (
                    <div className="h-full bg-zinc-50 rounded-lg border border-zinc-200 p-6">
                      <h3 className="text-lg font-medium text-zinc-900 mb-4">Template Properties</h3>
                      <div className="space-y-4">
                        {currentTemplate && (
                          <div className="bg-white p-4 rounded-lg border border-zinc-200 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <label className="font-medium text-zinc-900">Name:</label>
                                <p className="text-zinc-700">{currentTemplate.name}</p>
                              </div>
                              <div>
                                <label className="font-medium text-zinc-900">Category:</label>
                                <p className="text-zinc-700 capitalize">{currentTemplate.category}</p>
                              </div>
                              <div>
                                <label className="font-medium text-zinc-900">Status:</label>
                                <p className="text-zinc-700 capitalize">{currentTemplate.status}</p>
                              </div>
                              <div>
                                <label className="font-medium text-zinc-900">Version:</label>
                                <p className="text-zinc-700">{currentTemplate.version}</p>
                              </div>
                            </div>
                            <div>
                              <label className="font-medium text-zinc-900">Variables Used:</label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {currentTemplate.variables?.map((variable: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 bg-zinc-100 text-zinc-800 text-xs rounded-full border border-zinc-300"
                                  >
                                    {variable}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <Button
                          outline
                          onClick={handleSaveDraft}
                          className="text-zinc-700 border-zinc-300 hover:bg-zinc-50"
                        >
                          Edit Properties
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'Preview' && (
                    <div className="h-full bg-zinc-50 rounded-lg border border-zinc-200 p-6">
                      <h3 className="text-lg font-medium text-zinc-900 mb-4">Template Preview</h3>
                      <div className="space-y-4">
                        <p className="text-zinc-600">Preview your template with sample data.</p>
                        <div className="border rounded-lg p-6 bg-white border-zinc-200">
                          <div 
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: templateContent || '<p>No content yet...</p>' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Casper AI Widget */}
          <CasperAIWidget 
            editor={editorRef}
            variables={[
              {
                name: 'Member Information',
                variables: [
                  { key: 'member_name', name: 'Member Name', description: 'Full name of the member' },
                  { key: 'member_id', name: 'Member ID', description: 'Unique member identifier' },
                  { key: 'dob', name: 'Date of Birth', description: 'Member date of birth' },
                ]
              },
              {
                name: 'Provider Information', 
                variables: [
                  { key: 'provider_name', name: 'Provider Name', description: 'Healthcare provider name' },
                  { key: 'facility_name', name: 'Facility Name', description: 'Healthcare facility name' },
                ]
              },
              {
                name: 'Service Information',
                variables: [
                  { key: 'service_date', name: 'Service Date', description: 'Date of service' },
                  { key: 'diagnosis_code', name: 'Diagnosis Code', description: 'ICD-10 diagnosis code' },
                  { key: 'procedure_code', name: 'Procedure Code', description: 'CPT procedure code' },
                ]
              }
            ]}
            onContentInserted={() => {
              setHasUnsavedChanges(true);
              console.log('🤖 Casper AI inserted content');
            }}
          />

          {/* Save Template Modal */}
          <SaveTemplateModal
            isOpen={showSaveModal}
            onClose={() => setShowSaveModal(false)}
            onSave={handleSaveTemplate}
            currentContent={templateContent}
            existingTemplate={currentTemplate}
            saveType={saveType}
          />
        </div>
      </DndContext>
    </EditorContext.Provider>
  );
}
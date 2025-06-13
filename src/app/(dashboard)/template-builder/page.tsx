// src/app/(dashboard)/template-builder/page.tsx
'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import TemplateEditor from '@/components/template-builder/TemplateEditor';
import VariablePanel from '@/components/template-builder/VariablePanel';
import CasperAIWidget from '@/components/template-builder/CasperAIWidget';
import SaveTemplateModal from '@/components/template-builder/SaveTemplateModal';
import { Editor } from '@tiptap/react';
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';
import { EditorContext } from '@/hooks/useEditorContext';
import { templateService } from '@/lib/services/template-service';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'editor-droppable' && editorRef) {
      const variable = active.data.current;
      if (variable) {
        const variableHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 font-mono text-sm" contenteditable="false">{{${variable.name}}}</span>&nbsp;`;
        editorRef.chain().focus().insertContent(variableHtml).run();
        setHasUnsavedChanges(true);
      }
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
            variables,
            lastModifiedBy: 'current-user'
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
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-semibold text-gray-900">
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
                      currentTemplate.status === 'published' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    )}>
                      {currentTemplate.status}
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    className={buttonStyles.secondary}
                    onClick={handleSaveDraft}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button 
                    type="button" 
                    className={buttonStyles.primary}
                    onClick={handleSaveAndClose}
                  >
                    Save & Close
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
                    <div className="h-full bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Template Logic</h3>
                      <div className="space-y-4">
                        <p className="text-gray-500">Configure conditional logic and rules for your template.</p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <p className="text-sm text-gray-500">Logic builder coming soon...</p>
                          <p className="text-xs text-gray-400 mt-2">Ask Casper AI to help create conditional logic</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'Properties' && (
                    <div className="h-full bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Template Properties</h3>
                      <div className="space-y-4">
                        {currentTemplate && (
                          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <label className="font-medium text-gray-700">Name:</label>
                                <p className="text-gray-900">{currentTemplate.name}</p>
                              </div>
                              <div>
                                <label className="font-medium text-gray-700">Category:</label>
                                <p className="text-gray-900 capitalize">{currentTemplate.category}</p>
                              </div>
                              <div>
                                <label className="font-medium text-gray-700">Status:</label>
                                <p className="text-gray-900 capitalize">{currentTemplate.status}</p>
                              </div>
                              <div>
                                <label className="font-medium text-gray-700">Version:</label>
                                <p className="text-gray-900">{currentTemplate.version}</p>
                              </div>
                            </div>
                            <div>
                              <label className="font-medium text-gray-700">Variables Used:</label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {currentTemplate.variables?.map((variable: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                                  >
                                    {variable}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={handleSaveDraft}
                          className={buttonStyles.secondary}
                        >
                          Edit Properties
                        </button>
                      </div>
                    </div>
                  )}
                  {activeTab === 'Preview' && (
                    <div className="h-full bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Template Preview</h3>
                      <div className="space-y-4">
                        <p className="text-gray-500">Preview your template with sample data.</p>
                        <div className="border rounded-lg p-6 bg-gray-50">
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
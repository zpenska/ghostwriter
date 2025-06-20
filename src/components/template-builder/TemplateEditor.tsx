'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
// Pro extensions
import { Mathematics } from '@tiptap-pro/extension-mathematics';
import FileHandler from '@tiptap-pro/extension-file-handler';
import { Emoji, gitHubEmojis } from '@tiptap-pro/extension-emoji';
import AI from '@tiptap-pro/extension-ai';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import UniqueID from '@tiptap-pro/extension-unique-id';
import DragHandle from '@tiptap-pro/extension-drag-handle';
import InvisibleCharacters from '@tiptap-pro/extension-invisible-characters';
import { useCallback, useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import EditorToolbar from './EditorToolbar';
import { useDroppable } from '@dnd-kit/core';
import 'katex/dist/katex.min.css';
import Image from '@tiptap/extension-image';
import { PageBreak } from '@/lib/tiptap/extensions/page-break';
import { Node, mergeAttributes } from '@tiptap/core';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Shield,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react';

// Enhanced Variable Extension with clean rendering (no HTML artifacts)
const VariableExtension = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,
  
  addAttributes() {
    return {
      name: { default: '' },
      type: { default: 'text' },
      healthcareCategory: { default: null },
      dataType: { default: 'string' },
      required: { default: false },
      sensitive: { default: false },
    };
  },
  
  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    const isHealthcare = HTMLAttributes.healthcareCategory;
    const isSensitive = HTMLAttributes.sensitive === 'true';
    const isRequired = HTMLAttributes.required === 'true';
    
    // Clean variable styling - no HTML code visible to user
    const baseClasses = 'inline-flex items-center px-2 py-1 mx-1 rounded-md font-mono text-sm shadow-sm hover:shadow-md transition-all cursor-default';
    const colorClasses = isHealthcare 
      ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
      : 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200';
    
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-variable': 'true',
        'contenteditable': 'false',
        class: `${baseClasses} ${colorClasses}`,
        style: 'user-select: none; font-family: Arial, sans-serif; font-size: 12pt;',
        title: `Variable: ${HTMLAttributes.name}${isHealthcare ? ` (${HTMLAttributes.healthcareCategory})` : ''}${isSensitive ? ' - Sensitive Data' : ''}${isRequired ? ' - Required' : ''}`
      }),
      [
        'span',
        { 
          class: 'flex items-center space-x-1',
          style: 'font-family: Arial, sans-serif;'
        },
        // Required indicator
        ...(isRequired ? [['span', { class: 'text-red-600 font-bold' }, '*']] : []),
        // Healthcare indicator
        ...(isHealthcare ? [['span', { class: 'text-green-700' }, '🏥']] : []),
        // Sensitive data indicator  
        ...(isSensitive ? [['span', { class: 'text-orange-600' }, '🔒']] : []),
        // Variable name with clean formatting - just the variable name, no extra HTML
        ['span', { 
          class: 'font-medium',
          style: 'font-family: Arial, sans-serif;'
        }, `{{${HTMLAttributes.name}}}`],
      ]
    ];
  },

  addCommands() {
    return {
      insertVariable: (attributes: any) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
});

// Enhanced Reusable Block Extension with healthcare compliance
const ReusableBlock = Node.create({
  name: 'reusableBlock',
  group: 'block',
  atom: true,
  
  addAttributes() {
    return {
      label: { default: '' },
      content: { default: '' },
      blockId: { default: '' },
      category: { default: 'general' },
      healthcareCompliant: { default: false },
      complianceRules: { default: [] },
    };
  },
  
  parseHTML() {
    return [{ tag: 'div[data-reusable-block]' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    const isHealthcareCompliant = HTMLAttributes.healthcareCompliant === 'true';
    const category = HTMLAttributes.category || 'general';
    
    const categoryColors = {
      appeal: 'border-red-500 bg-red-50',
      compliance: 'border-yellow-500 bg-yellow-50',
      medical: 'border-blue-500 bg-blue-50',
      general: 'border-emerald-500 bg-emerald-50'
    };
    
    const colorClasses = categoryColors[category as keyof typeof categoryColors] || categoryColors.general;
    
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-reusable-block': 'true',
        'contenteditable': 'false',
        class: `my-4 p-4 border-l-4 ${colorClasses} rounded-r-lg shadow-sm hover:shadow-md transition-shadow`,
        style: 'font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5;'
      }),
      [
        'div',
        { class: 'flex items-center justify-between mb-2' },
        [
          'div',
          { class: 'flex items-center space-x-2' },
          [
            'span',
            { class: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              category === 'appeal' ? 'bg-red-100 text-red-800' :
              category === 'compliance' ? 'bg-yellow-100 text-yellow-800' :
              category === 'medical' ? 'bg-blue-100 text-blue-800' :
              'bg-emerald-100 text-emerald-800'
            }` },
            `📄 ${category.charAt(0).toUpperCase() + category.slice(1)} Block`
          ],
          ['span', { class: 'text-sm font-medium text-gray-900' }, HTMLAttributes.label],
          ...(isHealthcareCompliant ? [
            ['span', { class: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800' }, '🏥 Compliant']
          ] : [])
        ],
        [
          'span',
          { class: 'text-xs text-gray-600 opacity-75' },
          'Reusable Component'
        ]
      ],
      [
        'div',
        { 
          class: 'prose prose-sm max-w-none text-gray-700',
          innerHTML: HTMLAttributes.content,
          style: 'font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5;'
        }
      ],
    ];
  },
});

// Healthcare Component Extension for compliance components
const HealthcareComponent = Node.create({
  name: 'healthcareComponent',
  group: 'block',
  atom: true,
  
  addAttributes() {
    return {
      componentId: { default: '' },
      componentType: { default: 'general' },
      title: { default: '' },
      description: { default: '' },
      complianceLevel: { default: 'none' }, // none, recommended, required, blocking
      regulation: { default: '' },
    };
  },
  
  parseHTML() {
    return [{ tag: 'div[data-healthcare-component]' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    const complianceLevel = HTMLAttributes.complianceLevel || 'none';
    const componentType = HTMLAttributes.componentType || 'general';
    
    const complianceColors = {
      blocking: 'border-red-500 bg-red-50',
      required: 'border-orange-500 bg-orange-50',
      recommended: 'border-yellow-500 bg-yellow-50',
      none: 'border-gray-300 bg-gray-50'
    };
    
    const complianceIcons = {
      blocking: '🚫',
      required: '⚠️',
      recommended: '💡',
      none: '📋'
    };
    
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-healthcare-component': 'true',
        'contenteditable': 'false',
        class: `my-4 p-4 border-2 ${complianceColors[complianceLevel as keyof typeof complianceColors]} rounded-lg shadow-sm hover:shadow-md transition-shadow`,
        style: 'font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5;'
      }),
      [
        'div',
        { class: 'flex items-center justify-between mb-3' },
        [
          'div',
          { class: 'flex items-center space-x-2' },
          [
            'span',
            { class: 'text-lg' },
            complianceIcons[complianceLevel as keyof typeof complianceIcons]
          ],
          [
            'div',
            {},
            [
              'div',
              { class: 'text-sm font-medium text-gray-900' },
              HTMLAttributes.title || 'Healthcare Component'
            ],
            [
              'div',
              { class: 'text-xs text-gray-600' },
              HTMLAttributes.description || `${componentType} component`
            ]
          ]
        ],
        [
          'div',
          { class: 'flex items-center space-x-1' },
          [
            'span',
            { class: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              complianceLevel === 'blocking' ? 'bg-red-100 text-red-800' :
              complianceLevel === 'required' ? 'bg-orange-100 text-orange-800' :
              complianceLevel === 'recommended' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }` },
            complianceLevel.charAt(0).toUpperCase() + complianceLevel.slice(1)
          ],
          ...(HTMLAttributes.regulation ? [
            ['span', { class: 'text-xs text-gray-500' }, HTMLAttributes.regulation]
          ] : [])
        ]
      ],
      [
        'div',
        { class: 'bg-white p-3 rounded border border-gray-200' },
        [
          'div',
          { class: 'text-sm text-gray-700 italic' },
          `This ${componentType} component will be populated based on template data and compliance requirements.`
        ]
      ]
    ];
  },
});

interface TemplateEditorProps {
  documentId: string;
  userId: string;
  userName: string;
  templateName?: string;
  initialContent?: string;
  isExistingTemplate?: boolean;
  onEditorReady?: (editor: any) => void;
  onContentChange?: (content: string) => void;
  headerCollapsed?: boolean;
  currentTemplate?: any;
  activeTab?: string;
  showComplianceIndicators?: boolean;
  enableLogicIntegration?: boolean;
}

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Default font styles component
const EditorStyles = () => (
  <style jsx>{`
    .template-editor-content {
      font-family: Arial, sans-serif !important;
      font-size: 12pt !important;
      line-height: 1.5 !important;
    }

    .template-editor-content p {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      margin: 0 0 12pt 0;
    }

    .template-editor-content h1,
    .template-editor-content h2,
    .template-editor-content h3,
    .template-editor-content h4,
    .template-editor-content h5,
    .template-editor-content h6 {
      font-family: Arial, sans-serif;
      line-height: 1.5;
    }

    .template-editor-content ul,
    .template-editor-content ol {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
    }

    .template-editor-content table {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
    }

    .template-editor-content td,
    .template-editor-content th {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
    }

    .template-editor-content li {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
    }

    /* Ensure variables and blocks inherit the font */
    .template-editor-content [data-variable="true"],
    .template-editor-content [data-reusable-block="true"],
    .template-editor-content [data-healthcare-component="true"] {
      font-family: Arial, sans-serif;
    }

    /* Default paragraph spacing for healthcare documents */
    .template-editor-content .ProseMirror {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
    }

    /* Placeholder text styling */
    .template-editor-content .is-editor-empty::before {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
    }

    /* Clean variable styling - no visible HTML artifacts */
    .template-editor-content [data-variable="true"] {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      margin: 0 2px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 11pt;
      font-weight: 500;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      cursor: default;
      user-select: none;
      transition: all 0.2s ease;
    }

    .template-editor-content [data-variable="true"]:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
  `}</style>
);

export default function TemplateEditor({
  documentId,
  userId,
  userName,
  templateName = 'Untitled Template',
  initialContent = '',
  isExistingTemplate = false,
  onEditorReady,
  onContentChange,
  headerCollapsed = false,
  currentTemplate,
  activeTab = 'Builder',
  showComplianceIndicators = true,
  enableLogicIntegration = true,
}: TemplateEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [tokens, setTokens] = useState<any>(null);
  const [status, setStatus] = useState('Connecting...');
  const [ydoc] = useState(() => new Y.Doc());
  const [contentLoaded, setContentLoaded] = useState(false);
  const [showPageMargins, setShowPageMargins] = useState(true);
  const [savingBlock, setSavingBlock] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState<'checking' | 'compliant' | 'violations' | 'error'>('compliant');
  const [complianceViolations, setComplianceViolations] = useState<any[]>([]);
  const [showCompliancePanel, setShowCompliancePanel] = useState(false);
  const [logicSyncEnabled, setLogicSyncEnabled] = useState(enableLogicIntegration);
  const contentChangeTimeoutRef = useRef<NodeJS.Timeout>();

  // Add droppable zone for @dnd-kit
  const { setNodeRef, isOver } = useDroppable({
    id: 'editor-droppable',
    data: {
      accepts: ['variable', 'component', 'block'],
    },
  });

  // Listen for real-time template updates
  useEffect(() => {
    if (!currentTemplate?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'templates', currentTemplate.id),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          
          // Update compliance status
          if (data.complianceStatus) {
            setComplianceStatus(data.complianceStatus.compliant ? 'compliant' : 'violations');
            setComplianceViolations(data.complianceStatus.violations || []);
          }
        }
      },
      (error) => {
        console.error('Error listening to template updates:', error);
      }
    );

    return () => unsubscribe();
  }, [currentTemplate?.id]);

  // Enhanced content change handler with debouncing and logic integration
  const handleContentChange = useCallback((content: string) => {
    // Clear existing timeout
    if (contentChangeTimeoutRef.current) {
      clearTimeout(contentChangeTimeoutRef.current);
    }

    // Debounce content changes to avoid excessive processing
    contentChangeTimeoutRef.current = setTimeout(() => {
      // Call original onContentChange
      onContentChange?.(content);

      // Extract template components for logic builder integration
      if (logicSyncEnabled && enableLogicIntegration) {
        const templateComponents = extractTemplateComponents(content);
        
        // Emit event for logic builder
        window.dispatchEvent(new CustomEvent('templateContentChanged', {
          detail: { 
            templateId: documentId, 
            content,
            components: templateComponents
          }
        }));
      }

      // Run compliance check if enabled
      if (showComplianceIndicators && currentTemplate?.id) {
        runComplianceCheck(content);
      }
    }, 500); // 500ms debounce
  }, [onContentChange, logicSyncEnabled, enableLogicIntegration, documentId, showComplianceIndicators, currentTemplate?.id]);

  // Extract template components for logic builder - Fixed regex iteration
  const extractTemplateComponents = (content: string) => {
    const components: any[] = [];
    
    // Extract variables - Fixed regex iteration issue
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variableMatches = Array.from(content.matchAll(variableRegex));
    variableMatches.forEach((match) => {
      const variableName = match[1].trim();
      if (!components.find(c => c.name === variableName)) {
        components.push({
          type: 'variable',
          name: variableName,
          content: match[0],
          position: match.index
        });
      }
    });
    
    // Extract reusable blocks - Fixed regex iteration issue
    const blockRegex = /data-reusable-block="true"[^>]*data-label="([^"]+)"/g;
    const blockMatches = Array.from(content.matchAll(blockRegex));
    blockMatches.forEach((match) => {
      components.push({
        type: 'block',
        name: match[1],
        content: match[0],
        position: match.index
      });
    });
    
    // Extract healthcare components - Fixed regex iteration issue
    const componentRegex = /data-healthcare-component="true"[^>]*data-component-id="([^"]+)"/g;
    const componentMatches = Array.from(content.matchAll(componentRegex));
    componentMatches.forEach((match) => {
      components.push({
        type: 'healthcareComponent',
        name: match[1],
        content: match[0],
        position: match.index
      });
    });
    
    return components;
  };

  // Run compliance check
  const runComplianceCheck = async (content: string) => {
    setComplianceStatus('checking');
    
    try {
      // This would integrate with your compliance rules engine
      const response = await fetch('/api/compliance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: currentTemplate?.id,
          content,
          templateData: extractTemplateComponents(content)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setComplianceStatus(result.compliant ? 'compliant' : 'violations');
        setComplianceViolations(result.violations || []);
      } else {
        setComplianceStatus('error');
      }
    } catch (error) {
      console.error('Compliance check error:', error);
      setComplianceStatus('error');
    }
  };

  useEffect(() => {
    async function getTokens() {
      try {
        const response = await fetch('/api/tiptap-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userName, documentId }),
        });
        if (!response.ok) throw new Error('Failed to get authentication tokens');
        const tokens = await response.json();
        setTokens(tokens);
      } catch (error) {
        console.error('Auth error:', error);
        setStatus('Authentication failed - Using local mode');
      }
    }
    getTokens();
  }, [userId, userName, documentId]);

  useEffect(() => {
    if (!tokens) return;
    
    try {
      const provider = new HocuspocusProvider({
        url: `wss://collab.tiptap.dev/v1/${tokens.appId}`,
        name: documentId,
        document: ydoc,
        token: tokens.documentToken,
        onOpen: () => setStatus('Connected'),
        onClose: () => setStatus('Disconnected'),
        onError: (error: any) => {
          console.error('Collab error:', error);
          setStatus('Connection error - Working locally');
        },
      } as any);
      
      setProvider(provider);
      return () => {
        if (provider && typeof provider.destroy === 'function') {
          provider.destroy();
        }
      };
    } catch (error) {
      console.error('Provider setup error:', error);
      setStatus('Local mode');
    }
  }, [tokens, documentId, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        history: false,
        heading: { levels: [1, 2, 3] } 
      }),
      
      // Font styling handled entirely through CSS for better compatibility
      
      Collaboration.configure({ document: ydoc }),
      ...(provider ? [
        CollaborationCursor.configure({ 
          provider, 
          user: { name: userName, color: '#71717a' } 
        }),
      ] : []),
      Placeholder.configure({
        placeholder: 'Start typing your healthcare letter here, or ask Casper AI to draft one for you...',
        showOnlyWhenEditable: true,
        emptyEditorClass: 'is-editor-empty',
      }),
      Typography,
      Highlight.configure({ 
        multicolor: true, 
        HTMLAttributes: { class: 'highlight' } 
      }),
      TextAlign.configure({ 
        types: ['heading', 'paragraph'], 
        alignments: ['left', 'center', 'right', 'justify'] 
      }),
      Underline,
      CharacterCount.configure({ limit: null }),
      Mathematics,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Table.configure({ 
        resizable: true, 
        HTMLAttributes: { class: 'template-table' } 
      }),
      TableRow,
      TableHeader,
      TableCell,
      FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'],
        onDrop: (currentEditor: any, files: File[], pos: number) => {
          files.forEach((file: File) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
              currentEditor.chain().insertContentAt(pos, {
                type: 'image',
                attrs: { src: fileReader.result },
              }).focus().run();
            };
          });
        },
      }),
      Emoji.configure({ 
        enableEmoticons: true, 
        emojis: gitHubEmojis 
      }),
      UniqueID.configure({ 
        attributeName: 'data-unique-id', 
        types: ['paragraph', 'heading', 'listItem'] 
      }),
      DragHandle.configure({ 
        render: () => {
          const el = document.createElement('div');
          el.classList.add('drag-handle');
          el.innerHTML = '⋮⋮';
          return el;
        } 
      }),
      InvisibleCharacters.configure({ visible: false }),
      VariableExtension,
      ReusableBlock,
      HealthcareComponent,
      PageBreak,
      ...(tokens?.aiToken ? [
        AI.configure({
          appId: tokens.aiAppId,
          token: tokens.aiToken,
          autocompletion: true,
        })
      ] : []),
    ],
    editorProps: {
      attributes: {
        class: 'template-editor-content prose prose-sm max-w-none focus:outline-none text-zinc-900 document-editor',
        style: 'font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5;'
      },
    },
    onCreate: ({ editor }) => {
      console.log('📝 Enhanced editor created successfully with clean variable rendering');
      onEditorReady?.(editor);
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      
      if (!isExistingTemplate) {
        localStorage.setItem(`template-${documentId}`, content);
      }
      
      handleContentChange(content);
    },
  }, [provider, tokens, onEditorReady, ydoc, userName, documentId, handleContentChange, isExistingTemplate]);

  // Content loading logic
  useEffect(() => {
    if (!editor || contentLoaded) return;

    console.log('🔄 Loading content...', {
      isExistingTemplate,
      hasInitialContent: !!initialContent,
      documentId
    });

    if (isExistingTemplate && initialContent) {
      console.log('📄 Loading Firebase content for existing template');
      editor.commands.setContent(initialContent);
      setContentLoaded(true);
    } else if (!isExistingTemplate) {
      const saved = localStorage.getItem(`template-${documentId}`);
      if (saved && saved !== '<p></p>') {
        console.log('💾 Loading localStorage content for new template');
        editor.commands.setContent(saved);
      }
      setContentLoaded(true);
    }
  }, [editor, initialContent, isExistingTemplate, documentId, contentLoaded]);

  useEffect(() => {
    if (editor && isExistingTemplate && initialContent && contentLoaded) {
      console.log('🔄 Updating content from Firebase');
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent, isExistingTemplate, contentLoaded]);

  // Enhanced Save as Block functionality with healthcare categories
  const handleSaveAsBlock = useCallback(async () => {
    if (!editor) return;
    
    const { selection } = editor.state;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to);
    
    if (!selectedText.trim()) {
      alert('Please select some text to save as a block.');
      return;
    }

    const blockName = prompt('Enter a name for this block:', selectedText.substring(0, 50) + '...');
    if (!blockName) return;

    const category = prompt(
      'Enter a category for this block:\n\n' +
      '• appeal - Appeal rights and process information\n' +
      '• compliance - Regulatory compliance notices\n' +
      '• medical - Medical necessity and clinical information\n' +
      '• general - General reusable content\n\n' +
      'Category:', 
      'general'
    );
    if (!category) return;

    const isHealthcareCompliant = ['appeal', 'compliance', 'medical'].includes(category.toLowerCase());

    setSavingBlock(true);
    
    try {
      // Get the selected HTML content - Fixed serialization issue
      const { from, to } = selection;
      const selectedContent = editor.getHTML().slice(
        editor.view.state.doc.textBetween(0, from).length,
        editor.view.state.doc.textBetween(0, to).length
      );

      // Save to Firestore blocks collection with enhanced metadata
      await addDoc(collection(db, 'blocks'), {
        name: blockName,
        description: `Created from template: ${templateName}`,
        content: selectedContent || selectedText,
        category: category.toLowerCase(),
        healthcareCompliant: isHealthcareCompliant,
        complianceRules: isHealthcareCompliant ? ['auto-detected'] : [],
        isActive: true,
        createdAt: new Date(),
        createdBy: userId,
        templateId: currentTemplate?.id || null,
        metadata: {
          wordCount: selectedText.split(/\s+/).length,
          charCount: selectedText.length,
          containsVariables: /\{\{[^}]+\}\}/.test(selectedText),
          extractedVariables: Array.from(selectedText.matchAll(/\{\{([^}]+)\}\}/g)).map(m => m[1].trim())
        }
      });

      alert('Block saved successfully! It will appear in the Blocks panel.');
      console.log('✅ Enhanced block saved:', { 
        name: blockName, 
        category, 
        healthcareCompliant: isHealthcareCompliant,
        content: selectedContent || selectedText 
      });
      
    } catch (error) {
      console.error('❌ Error saving block:', error);
      alert('Failed to save block. Please try again.');
    } finally {
      setSavingBlock(false);
    }
  }, [editor, templateName, userId, currentTemplate]);

  // Enhanced helper functions
  const takeSnapshot = useCallback(() => {
    if (!editor) return;
    const content = editor.getHTML();
    const components = extractTemplateComponents(content);
    const snapshots = JSON.parse(localStorage.getItem('template-snapshots') || '[]');
    snapshots.push({ 
      id: Date.now(), 
      timestamp: new Date().toISOString(), 
      content,
      templateName,
      componentCount: components.length,
      complianceStatus: complianceStatus
    });
    if (snapshots.length > 20) snapshots.shift();
    localStorage.setItem('template-snapshots', JSON.stringify(snapshots));
    alert('Enhanced snapshot saved with compliance status!');
  }, [editor, templateName, complianceStatus]);

  const checkSpelling = useCallback(async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to || editor.state.doc.content.size);
    if (!text) return alert('Please select some text to check.');
    
    const apiUrl = process.env.NEXT_PUBLIC_LANGUAGETOOL_API_KEY
      ? 'https://api.languagetoolplus.com/v2/check'
      : 'https://api.languagetool.org/v2/check';
    
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded', 
          Accept: 'application/json' 
        },
        body: new URLSearchParams({
          text,
          language: 'en-US',
          apiKey: process.env.NEXT_PUBLIC_LANGUAGETOOL_API_KEY || '',
          disabledRules: 'WHITESPACE_RULE,PUNCTUATION_PARAGRAPH_END',
        }),
      });
      
      const data = await res.json();
      if (data.matches?.length > 0) {
        const errors = data.matches.map((m: any) => 
          `• ${m.message} (at position ${m.offset})`
        ).join('\n');
        alert(`Spelling/Grammar Issues Found:\n\n${errors}`);
      } else {
        alert('No spelling or grammar issues found! ✅');
      }
    } catch (err) {
      console.error('Spell check error:', err);
      alert('Spell check failed. Please try again.');
    }
  }, [editor]);

  const showInvisibleCharacters = useCallback(() => {
    editor?.chain().focus().toggleInvisibleCharacters().run();
  }, [editor]);

  const toggleMargins = useCallback(() => {
    setShowPageMargins(!showPageMargins);
    console.log('Toggling margins:', !showPageMargins);
  }, [showPageMargins]);

  const toggleLogicSync = useCallback(() => {
    setLogicSyncEnabled(!logicSyncEnabled);
    console.log('Logic sync enabled:', !logicSyncEnabled);
  }, [logicSyncEnabled]);

  const openLogicBuilder = useCallback(() => {
    if (currentTemplate?.id) {
      window.open(`/templates/${currentTemplate.id}/logic`, '_blank');
    } else {
      alert('Please save the template first to access the logic builder.');
    }
  }, [currentTemplate?.id]);

  const hasSelection = editor?.state.selection && 
    editor.state.selection.from !== editor.state.selection.to;

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-zinc-600">{status}</p>
          <p className="text-sm text-zinc-500 mt-2">Loading enhanced healthcare editor...</p>
        </div>
      </div>
    );
  }

  // Hide editor when not on Builder tab (unless header is collapsed)
  const showEditor = headerCollapsed || activeTab === 'Builder';

  return (
    <div className={classNames(
      "template-editor-container flex flex-col h-full bg-white rounded-lg border border-zinc-200",
      !showEditor && "opacity-0 pointer-events-none absolute inset-0"
    )}>
      {/* Include font styles */}
      <EditorStyles />
      
      {/* Enhanced Toolbar with healthcare features */}
      <EditorToolbar 
        editor={editor} 
        showPageMargins={showPageMargins}
        onToggleMargins={toggleMargins}
        onSaveAsBlock={handleSaveAsBlock}
        hasSelection={hasSelection}
        savingBlock={savingBlock}
        {...(showComplianceIndicators && {
          complianceStatus,
          onToggleCompliance: () => setShowCompliancePanel(!showCompliancePanel)
        })}
        {...(enableLogicIntegration && {
          logicSyncEnabled,
          onToggleLogicSync: toggleLogicSync,
          onOpenLogicBuilder: openLogicBuilder
        })}
      />
      
      {/* Document Container */}
      <div className="flex-1 overflow-y-auto bg-zinc-100 p-6">
        <div 
          ref={setNodeRef}
          className={classNames(
            "document-container mx-auto bg-white shadow-lg transition-all duration-200",
            isOver ? "ring-4 ring-blue-500 ring-opacity-30 bg-blue-50" : "",
            showPageMargins ? "document-with-margins" : ""
          )}
          style={{
            width: '8.5in',
            minHeight: '11in',
            maxWidth: '100%',
            padding: showPageMargins ? '1in 1in 1in 1in' : '0.75in',
            position: 'relative',
            fontFamily: 'Arial, sans-serif',
            fontSize: '12pt',
            lineHeight: '1.5',
          }}
        >
          {/* Enhanced Drop Zone Indicator */}
          {isOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-75 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none z-20">
              <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-800 font-medium">Drop variable or component here</p>
                </div>
                <p className="text-xs text-blue-600 mt-1">Healthcare variables will be automatically categorized</p>
              </div>
            </div>
          )}
          
          {/* Compliance Status Overlay */}
          {showComplianceIndicators && complianceStatus !== 'compliant' && (
            <div className="absolute top-4 right-4 z-10">
              <div className={classNames(
                "flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg",
                complianceStatus === 'checking' ? "bg-blue-100 text-blue-800" :
                complianceStatus === 'violations' ? "bg-red-100 text-red-800" :
                complianceStatus === 'error' ? "bg-yellow-100 text-yellow-800" :
                "bg-green-100 text-green-800"
              )}>
                {complianceStatus === 'checking' && <RefreshCw className="w-4 h-4 animate-spin" />}
                {complianceStatus === 'violations' && <AlertTriangle className="w-4 h-4" />}
                {complianceStatus === 'error' && <AlertTriangle className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {complianceStatus === 'checking' && 'Checking Compliance...'}
                  {complianceStatus === 'violations' && `${complianceViolations.length} Compliance Issues`}
                  {complianceStatus === 'error' && 'Compliance Check Error'}
                </span>
              </div>
            </div>
          )}
          
          {/* Margin Guidelines */}
          {showPageMargins && (
            <>
              <div 
                className="absolute left-0 right-0 border-t-2 border-blue-400 border-dashed pointer-events-none"
                style={{ top: '1in', opacity: 0.7, zIndex: 10 }}
              />
              <div 
                className="absolute left-0 right-0 border-b-2 border-blue-400 border-dashed pointer-events-none"
                style={{ bottom: '1in', opacity: 0.7, zIndex: 10 }}
              />
              <div 
                className="absolute top-0 bottom-0 border-l-2 border-blue-400 border-dashed pointer-events-none"
                style={{ left: '1in', opacity: 0.7, zIndex: 10 }}
              />
              <div 
                className="absolute top-0 bottom-0 border-r-2 border-blue-400 border-dashed pointer-events-none"
                style={{ right: '1in', opacity: 0.7, zIndex: 10 }}
              />
            </>
          )}
          
          <EditorContent 
            editor={editor} 
            className="template-editor h-full document-content" 
          />
        </div>
      </div>
      
      {/* Enhanced Status Bar */}
      {!headerCollapsed && (
        <div className="border-t border-zinc-200 px-4 py-2 flex items-center justify-between text-sm text-zinc-600 bg-white">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <span className={classNames(
                "w-2 h-2 rounded-full mr-2",
                status === 'Connected' ? 'bg-emerald-500' : 
                status.includes('local') || status.includes('Local') ? 'bg-blue-500' :
                'bg-zinc-400'
              )} />
              {status}
            </span>
            <span>Document: {templateName}</span>
            {logicSyncEnabled && (
              <span className="flex items-center text-blue-600">
                <Brain className="w-3 h-3 mr-1" />
                Logic Sync
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span>{editor.storage.characterCount?.characters() || 0} chars</span>
            <span>{editor.storage.characterCount?.words() || 0} words</span>
            
            {/* Compliance Status */}
            {showComplianceIndicators && (
              <button
                onClick={() => setShowCompliancePanel(!showCompliancePanel)}
                className={classNames(
                  "inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500",
                  complianceStatus === 'compliant' ? "text-green-700 hover:bg-green-100" :
                  complianceStatus === 'violations' ? "text-red-700 hover:bg-red-100" :
                  complianceStatus === 'checking' ? "text-blue-700 hover:bg-blue-100" :
                  "text-yellow-700 hover:bg-yellow-100"
                )}
              >
                <Shield className="w-3 h-3 mr-1" />
                {complianceStatus === 'compliant' && 'Compliant'}
                {complianceStatus === 'violations' && `${complianceViolations.length} Issues`}
                {complianceStatus === 'checking' && 'Checking...'}
                {complianceStatus === 'error' && 'Error'}
              </button>
            )}

            {/* Action Buttons */}
            <button 
              onClick={takeSnapshot} 
              className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500"
            >
              Snapshot
            </button>
            <button 
              onClick={checkSpelling} 
              className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500"
            >
              Spelling
            </button>
            <button 
              onClick={showInvisibleCharacters} 
              className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500"
            >
              ¶
            </button>
            <button 
              onClick={toggleMargins} 
              className={classNames(
                "inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500",
                showPageMargins 
                  ? "bg-blue-100 text-blue-900 hover:bg-blue-200" 
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              )}
              title={showPageMargins ? "Hide Margins" : "Show Margins"}
            >
              {showPageMargins ? "Hide Margins" : "Show Margins"}
            </button>
            
            {/* Logic Builder Button */}
            {enableLogicIntegration && (
              <button
                onClick={openLogicBuilder}
                className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-purple-700 hover:bg-purple-100 hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                title="Open Logic Builder"
              >
                <Brain className="w-3 h-3 mr-1" />
                Logic
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
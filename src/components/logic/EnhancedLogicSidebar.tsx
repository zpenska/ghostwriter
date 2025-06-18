'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Variable,
  Square,
  Component,
  Filter,
  Star,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  GitBranch,
  Calculator,
  RotateCcw,
  Palette,
  Shield,
  Play,
  Plus
} from 'lucide-react';

interface CasperVariable {
  key: string;
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array';
  healthcareCategory?: 'member' | 'claim' | 'provider' | 'diagnosis' | 'service';
  description?: string;
  group: string;
}

interface TemplateComponent {
  id: string;
  type: 'variable' | 'block' | 'component';
  name: string;
  content: string;
  usageCount: number;
  inTemplate: boolean;
}

interface NodeTemplate {
  type: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  healthcare: boolean;
}

interface EnhancedLogicSidebarProps {
  templateId: string;
  templateContent: string;
  variables: CasperVariable[];
  onTemplateComponentsChange: (components: TemplateComponent[]) => void;
}

export default function EnhancedLogicSidebar({
  templateId,
  templateContent,
  variables,
  onTemplateComponentsChange,
}: EnhancedLogicSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'components' | 'nodes' | 'rules'>('components');
  const [filterInTemplate, setFilterInTemplate] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [templateComponents, setTemplateComponents] = useState<TemplateComponent[]>([]);

  // Available node types for drag and drop
  const nodeTemplates: NodeTemplate[] = [
    {
      type: 'condition',
      icon: <GitBranch className="w-4 h-4" />,
      title: 'Condition',
      description: 'If/Then/Else logic',
      color: 'blue',
      healthcare: false,
    },
    {
      type: 'calculation',
      icon: <Calculator className="w-4 h-4" />,
      title: 'Calculation',
      description: 'Math operations & formulas',
      color: 'purple',
      healthcare: true,
    },
    {
      type: 'repeater',
      icon: <RotateCcw className="w-4 h-4" />,
      title: 'Repeater',
      description: 'Loop through arrays',
      color: 'orange',
      healthcare: true,
    },
    {
      type: 'component',
      icon: <Component className="w-4 h-4" />,
      title: 'Component',
      description: 'Insert template blocks',
      color: 'green',
      healthcare: true,
    },
    {
      type: 'styling',
      icon: <Palette className="w-4 h-4" />,
      title: 'Styling',
      description: 'Conditional formatting',
      color: 'pink',
      healthcare: false,
    },
    {
      type: 'workflow',
      icon: <Shield className="w-4 h-4" />,
      title: 'Workflow Rule',
      description: 'Compliance & validation',
      color: 'red',
      healthcare: true,
    },
  ];

  // Extract components from template content
  const extractTemplateComponents = useCallback((htmlContent: string): TemplateComponent[] => {
    const components: TemplateComponent[] = [];
    
    // Extract variables {{variable}}
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const foundVariables = new Set<string>();
    let match;
    
    while ((match = variableRegex.exec(htmlContent)) !== null) {
      const variableName = match[1].trim();
      foundVariables.add(variableName);
    }
    
    // Map found variables to component structure
    foundVariables.forEach(variableName => {
      const variableData = variables.find(v => v.key === variableName);
      const usageCount = (htmlContent.match(new RegExp(`{{${variableName}}}`, 'g')) || []).length;
      
      components.push({
        id: `var-${variableName}`,
        type: 'variable',
        name: variableName,
        content: `{{${variableName}}}`,
        usageCount,
        inTemplate: true,
      });
    });

    // Extract blocks [block:blockName]
    const blockRegex = /\[block:([^\]]+)\]/g;
    const foundBlocks = new Set<string>();
    
    while ((match = blockRegex.exec(htmlContent)) !== null) {
      const blockName = match[1].trim();
      foundBlocks.add(blockName);
    }
    
    foundBlocks.forEach(blockName => {
      const usageCount = (htmlContent.match(new RegExp(`\\[block:${blockName}\\]`, 'g')) || []).length;
      
      components.push({
        id: `block-${blockName}`,
        type: 'block',
        name: blockName,
        content: `[block:${blockName}]`,
        usageCount,
        inTemplate: true,
      });
    });

    // Extract components <component id="componentId">
    const componentRegex = /<component\s+id="([^"]+)"/g;
    const foundComponents = new Set<string>();
    
    while ((match = componentRegex.exec(htmlContent)) !== null) {
      const componentId = match[1].trim();
      foundComponents.add(componentId);
    }
    
    foundComponents.forEach(componentId => {
      const usageCount = (htmlContent.match(new RegExp(`<component\\s+id="${componentId}"`, 'g')) || []).length;
      
      components.push({
        id: `comp-${componentId}`,
        type: 'component',
        name: componentId,
        content: `<component id="${componentId}">`,
        usageCount,
        inTemplate: true,
      });
    });

    // Add unused variables as available components
    variables.forEach(variable => {
      if (!foundVariables.has(variable.key)) {
        components.push({
          id: `var-${variable.key}`,
          type: 'variable',
          name: variable.key,
          content: `{{${variable.key}}}`,
          usageCount: 0,
          inTemplate: false,
        });
      }
    });

    return components.sort((a, b) => {
      // Sort by: in template first, then by usage count, then alphabetically
      if (a.inTemplate && !b.inTemplate) return -1;
      if (!a.inTemplate && b.inTemplate) return 1;
      if (a.inTemplate && b.inTemplate) {
        if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [variables]);

  // Update template components when content changes
  useEffect(() => {
    if (templateContent) {
      const components = extractTemplateComponents(templateContent);
      setTemplateComponents(components);
      onTemplateComponentsChange(components);
    }
  }, [templateContent, extractTemplateComponents, onTemplateComponentsChange]);

  // Filter and search components
  const filteredComponents = useMemo(() => {
    return templateComponents.filter(component => {
      // Search filter
      if (searchTerm && !component.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Template filter
      if (filterInTemplate && !component.inTemplate) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'healthcare') {
          const variable = variables.find(v => v.key === component.name);
          if (!variable || !variable.healthcareCategory) {
            return false;
          }
        } else if (selectedCategory !== component.type) {
          return false;
        }
      }
      
      return true;
    });
  }, [templateComponents, searchTerm, filterInTemplate, selectedCategory, variables]);

  // Get healthcare categories
  const healthcareCategories = useMemo(() => {
    const categories = new Set<string>();
    variables.forEach(v => {
      if (v.healthcareCategory) {
        categories.add(v.healthcareCategory);
      }
    });
    return Array.from(categories);
  }, [variables]);

  // Handle drag start for components
  const handleDragStart = (event: React.DragEvent, component: TemplateComponent) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: 'component',
      data: {
        label: component.name,
        componentId: component.id,
        componentType: component.type,
        content: component.content,
        usageCount: component.usageCount,
        inTemplate: component.inTemplate,
      }
    }));
  };

  // Handle drag start for node templates
  const handleNodeDragStart = (event: React.DragEvent, nodeTemplate: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: nodeTemplate.type,
      data: {
        label: nodeTemplate.title,
        description: nodeTemplate.description,
      }
    }));
  };

  const renderComponentItem = (component: TemplateComponent) => {
    const variable = variables.find(v => v.key === component.name);
    const isHealthcare = variable?.healthcareCategory;
    
    return (
      <div
        key={component.id}
        draggable
        onDragStart={(e) => handleDragStart(e, component)}
        className={`
          p-3 border rounded-lg cursor-move transition-all duration-200 hover:shadow-md
          ${component.inTemplate 
            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <div className={`p-1.5 rounded ${
              component.type === 'variable' ? 'bg-blue-100' :
              component.type === 'block' ? 'bg-green-100' : 'bg-purple-100'
            }`}>
              {component.type === 'variable' && <Variable className="w-3 h-3 text-blue-600" />}
              {component.type === 'block' && <Square className="w-3 h-3 text-green-600" />}
              {component.type === 'component' && <Component className="w-3 h-3 text-purple-600" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-sm text-gray-900 truncate">
                  {component.name}
                </span>
                {component.inTemplate && (
                  <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                )}
                {isHealthcare && (
                  <div className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded flex-shrink-0">
                    HC
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500 capitalize">
                  {component.type}
                </span>
                {variable?.dataType && (
                  <span className="text-xs text-gray-400">
                    {variable.dataType}
                  </span>
                )}
                {isHealthcare && (
                  <span className="text-xs text-green-600 capitalize">
                    {variable.healthcareCategory}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {component.inTemplate && (
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-blue-600">
                  {component.usageCount}
                </span>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
        
        {variable?.description && (
          <p className="text-xs text-gray-600 mt-1 truncate">
            {variable.description}
          </p>
        )}
      </div>
    );
  };

  const renderNodeTemplate = (nodeTemplate: NodeTemplate) => (
    <div
      key={nodeTemplate.type}
      draggable
      onDragStart={(e) => handleNodeDragStart(e, nodeTemplate)}
      className={`
        p-3 border rounded-lg cursor-move transition-all duration-200 hover:shadow-md
        bg-${nodeTemplate.color}-50 border-${nodeTemplate.color}-200 hover:bg-${nodeTemplate.color}-100
      `}
    >
      <div className="flex items-center space-x-2">
        <div className={`p-1.5 bg-${nodeTemplate.color}-100 rounded`}>
          {nodeTemplate.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-1">
            <span className="font-medium text-sm text-gray-900">
              {nodeTemplate.title}
            </span>
            {nodeTemplate.healthcare && (
              <div className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                HC
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {nodeTemplate.description}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Logic Builder</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('components')}
            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'components'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Components
          </button>
          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'nodes'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Nodes
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'rules'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Rules
          </button>
        </div>
      </div>

      {/* Filters - only show for components tab */}
      {activeTab === 'components' && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            {/* In Template Filter */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="inTemplate"
                checked={filterInTemplate}
                onChange={(e) => setFilterInTemplate(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="inTemplate" className="text-sm text-gray-700">
                Used in template only
              </label>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Components</option>
                <option value="variable">Variables</option>
                <option value="block">Blocks</option>
                <option value="component">Components</option>
                <option value="healthcare">Healthcare</option>
                {healthcareCategories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'components' && (
          <div className="p-4">
            {/* Stats */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Template Analysis</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                <div>Variables: {templateComponents.filter(c => c.type === 'variable' && c.inTemplate).length}</div>
                <div>Blocks: {templateComponents.filter(c => c.type === 'block' && c.inTemplate).length}</div>
                <div>Components: {templateComponents.filter(c => c.type === 'component' && c.inTemplate).length}</div>
                <div>Healthcare: {templateComponents.filter(c => {
                  const variable = variables.find(v => v.key === c.name);
                  return variable?.healthcareCategory;
                }).length}</div>
              </div>
            </div>

            {/* Component List */}
            <div className="space-y-2">
              {filteredComponents.length > 0 ? (
                filteredComponents.map(renderComponentItem)
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No components found</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className="p-4">
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Logic Nodes</span>
              </div>
              <p className="text-xs text-green-800">
                Drag nodes to the canvas to build your logic flow
              </p>
            </div>

            <div className="space-y-2">
              {nodeTemplates.map(renderNodeTemplate)}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="p-4">
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Compliance Rules</span>
              </div>
              <p className="text-xs text-red-800">
                Healthcare compliance rules will be automatically applied
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Appeal Rights Required</span>
                </div>
                <p className="text-xs text-yellow-800">
                  Automatically triggered for all denial letters
                </p>
              </div>

              <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Medical Necessity Disclaimer</span>
                </div>
                <p className="text-xs text-green-800">
                  Added when denial reason includes medical necessity
                </p>
              </div>

              <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Peer-to-Peer Information</span>
                </div>
                <p className="text-xs text-blue-800">
                  Included for prior authorization denials
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="flex justify-between items-center">
            <span>Template: {templateId.substring(0, 8)}...</span>
            <span>{filteredComponents.length} items</span>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Brain, Sparkles, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface CasperVariable {
  key: string;
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array';
  healthcareCategory?: 'member' | 'claim' | 'provider' | 'diagnosis' | 'service';
  description?: string;
}

interface TemplateComponent {
  id: string;
  type: 'variable' | 'block' | 'component';
  name: string;
  usageCount: number;
}

interface LogicSuggestion {
  type: 'condition' | 'calculation' | 'repeater' | 'component' | 'workflow';
  title: string;
  description: string;
  confidence: number;
  healthcare: boolean;
  compliance?: boolean;
}

interface EnhancedCasperLogicWidgetProps {
  variables: CasperVariable[];
  templateComponents: TemplateComponent[];
  onLogicInserted: (logic: any) => void;
  onClose?: () => void;
  templateId: string;
}

export default function EnhancedCasperLogicWidget({
  variables,
  templateComponents,
  onLogicInserted,
  onClose,
  templateId,
}: EnhancedCasperLogicWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<LogicSuggestion[]>([]);
  const [response, setResponse] = useState('');
  const [logicType, setLogicType] = useState<'natural' | 'expression' | 'choice'>('natural');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Healthcare-specific prompts and suggestions
  const healthcarePrompts = [
    "If denial reason = 'Medical Necessity' and service = sleep study, insert CMS guidance",
    "For each claim line where status = 'DENIED', calculate total denied amount",
    "If member age >= 65 AND language = 'es', use Spanish senior template",
    "Show urgency section only if urgencyCode = 'URGENT'",
    "Require appeal rights notice for all denials (blocking rule)",
    "If service code starts with 'DME' and amount > $500, show detailed explanation",
  ];

  // Auto-suggestions based on template context
  useEffect(() => {
    if (templateComponents.length > 0) {
      const autoSuggestions: LogicSuggestion[] = [];

      // Check for common healthcare patterns
      const hasStatus = variables.some(v => v.key.toLowerCase().includes('status'));
      const hasDenial = variables.some(v => v.key.toLowerCase().includes('denial'));
      const hasAmount = variables.some(v => v.dataType === 'number' && v.key.toLowerCase().includes('amount'));
      const hasAge = variables.some(v => v.key.toLowerCase().includes('age'));
      const hasLanguage = variables.some(v => v.key.toLowerCase().includes('language'));

      if (hasStatus) {
        autoSuggestions.push({
          type: 'condition',
          title: 'Status-Based Logic',
          description: 'Add conditional logic based on status values (approved, denied, pending)',
          confidence: 0.9,
          healthcare: true,
        });
      }

      if (hasDenial) {
        autoSuggestions.push({
          type: 'workflow',
          title: 'Appeal Rights Compliance',
          description: 'Automatically include appeal rights notice for denials',
          confidence: 0.95,
          healthcare: true,
          compliance: true,
        });
      }

      if (hasAmount) {
        autoSuggestions.push({
          type: 'calculation',
          title: 'Amount Calculations',
          description: 'Calculate totals, averages, or conditional amounts',
          confidence: 0.8,
          healthcare: true,
        });
      }

      if (hasAge && hasLanguage) {
        autoSuggestions.push({
          type: 'condition',
          title: 'Member Demographics Logic',
          description: 'Customize content based on age and language preferences',
          confidence: 0.85,
          healthcare: true,
        });
      }

      setSuggestions(autoSuggestions);
    }
  }, [variables, templateComponents]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setResponse('');

    try {
      const payload = {
        prompt: input,
        logicType,
        variables: variables.map(v => ({
          key: v.key,
          name: v.name,
          dataType: v.dataType,
          healthcareCategory: v.healthcareCategory,
        })),
        templateComponents: templateComponents.map(c => ({
          id: c.id,
          type: c.type,
          name: c.name,
          usageCount: c.usageCount,
        })),
        templateId,
        context: {
          isHealthcare: true,
          requiresCompliance: true,
          variables: variables.length,
          components: templateComponents.length,
        },
      };

      const response = await fetch('/api/casper-logic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setResponse(data.explanation || 'Logic generated successfully');
        if (data.logic) {
          onLogicInserted(data.logic);
        }
      } else {
        setResponse(data.error || 'Failed to generate logic');
      }
    } catch (error) {
      console.error('Error calling Casper Logic API:', error);
      setResponse('Error: Failed to generate logic. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: LogicSuggestion) => {
    let promptText = '';
    
    switch (suggestion.type) {
      case 'condition':
        if (suggestion.title.includes('Status')) {
          promptText = "If claim status equals 'DENIED', insert denial explanation and appeal rights, else if status equals 'APPROVED', insert approval confirmation";
        } else if (suggestion.title.includes('Demographics')) {
          promptText = "If member age >= 65 AND language = 'es', use Spanish senior template, elif age >= 65, use English senior template, else use standard template";
        }
        break;
      case 'workflow':
        promptText = "When letter includes denial content, automatically require appeal rights notice (blocking rule)";
        break;
      case 'calculation':
        promptText = "Calculate SUM of denied amounts from claim lines where status = 'DENIED', format as currency";
        break;
      default:
        promptText = suggestion.description;
    }
    
    setInput(promptText);
    setLogicType('natural');
  };

  const insertPrompt = (prompt: string) => {
    setInput(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        title="Open Casper AI Logic Assistant"
      >
        <Brain className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Casper AI</h3>
            <p className="text-xs text-gray-600">Healthcare Logic Assistant</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            onClose?.();
          }}
          className="p-1 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Logic Type Selector */}
      <div className="p-4 border-b bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logic Type
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => setLogicType('natural')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              logicType === 'natural'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Natural Language
          </button>
          <button
            onClick={() => setLogicType('expression')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              logicType === 'expression'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Expression
          </button>
          <button
            onClick={() => setLogicType('choice')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              logicType === 'choice'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Multiple Choice
          </button>
        </div>
      </div>

      {/* Auto-Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-1 text-yellow-500" />
            Smart Suggestions
          </h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left p-2 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900">
                        {suggestion.title}
                      </span>
                      {suggestion.healthcare && (
                        <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                          Healthcare
                        </span>
                      )}
                      {suggestion.compliance && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                          Compliance
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <span>{Math.round(suggestion.confidence * 100)}%</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Healthcare Prompts */}
      <div className="p-4 border-b">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700"
        >
          <span>Healthcare Examples</span>
          <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
            ↓
          </span>
        </button>
        {showAdvanced && (
          <div className="mt-2 space-y-1">
            {healthcarePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => insertPrompt(prompt)}
                className="w-full text-left p-2 text-xs text-gray-600 hover:bg-gray-50 rounded border border-gray-200 hover:border-blue-300 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your logic:
          </label>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              logicType === 'natural'
                ? "Describe your logic in plain English (e.g., 'If denial reason is medical necessity, show CMS guidance')"
                : logicType === 'expression'
                ? "Enter expression (e.g., '{{status}} === \"DENIED\" && {{amount}} > 1000')"
                : "Describe multiple choice logic (e.g., 'Switch on claim status: approved → show approval, denied → show denial with appeal rights')"
            }
            className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="p-4 pt-0">
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Logic...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Generate Logic</span>
              </>
            )}
          </button>
        </div>

        {/* Response Area */}
        {response && (
          <div className="p-4 pt-0">
            <div className={`p-3 rounded-lg text-sm ${
              response.startsWith('Error:')
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}>
              <div className="flex items-start space-x-2">
                {response.startsWith('Error:') ? (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{response}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Context Info */}
      <div className="p-4 border-t bg-gray-50 text-xs text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <div>Variables: {variables.length}</div>
          <div>Components: {templateComponents.length}</div>
          <div>Healthcare: {variables.filter(v => v.healthcareCategory).length}</div>
          <div>Template: {templateId.substring(0, 8)}...</div>
        </div>
      </div>
    </div>
  );
}
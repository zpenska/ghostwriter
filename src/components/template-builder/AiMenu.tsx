'use client';

import { Editor } from '@tiptap/react';
import { healthcarePrompts } from '@/lib/tiptap/ai-config';
import { 
  FileText, 
  Users, 
  Heart, 
  ShieldCheck, 
  ClipboardCheck,
  XCircle,
  MessageSquare,
  CheckCircle,
  File,
  Plus,
  Edit,
  Activity,
  Hash,
  Stethoscope
} from 'lucide-react';
import { useState } from 'react';
import { tiptapAI } from '@/lib/services/tiptap-ai-service';

interface AiMenuProps {
  editor: Editor;
  onClose: () => void;
}

// Map icon names to Lucide components
const iconMap: { [key: string]: any } = {
  'FileTextIcon': FileText,
  'UsersIcon': Users,
  'HeartIcon': Heart,
  'ShieldCheckIcon': ShieldCheck,
  'ClipboardCheckIcon': ClipboardCheck,
  'XCircleIcon': XCircle,
  'MessageSquareIcon': MessageSquare,
  'CheckCircleIcon': CheckCircle,
  'FileIcon': File,
  'PlusIcon': Plus,
  'EditIcon': Edit,
  'ActivityIcon': Activity,
  'HashIcon': Hash,
  'SyringeIcon': Stethoscope
};

export default function AiMenu({ editor, onClose }: AiMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group prompts by category
  const categories = healthcarePrompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, typeof healthcarePrompts>);

  const handlePromptClick = async (prompt: typeof healthcarePrompts[0]) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    try {
      // Check if AI extension is properly configured
      const hasAI = editor.extensionManager.extensions.find(ext => ext.name === 'ai');
      
      if (!hasAI) {
        alert('AI extension is not properly configured. Please check your settings.');
        onClose();
        return;
      }

      // For text operations, we need selected text
      if (selectedText && selectedText.trim()) {
        // Use the AI rewrite functionality
        const promptText = prompt.prompt.replace('{selectedText}', selectedText);
        
        // Show loading state
        editor.chain().focus().setTextSelection({ from, to }).run();
        editor.chain().focus().deleteSelection().insertContent('✨ AI is processing...').run();
        
        // Call TipTap AI service
        const response = await tiptapAI.rewriteText(selectedText, promptText);
        
        if (response.error) {
          // Revert on error
          editor.chain().focus().undo().run();
          alert(`AI Error: ${response.error}`);
        } else if (response.text) {
          // Replace with AI response
          editor.chain().focus().undo().insertContent(response.text).run();
        }
      } else {
        // No text selected - for generation prompts
        if (prompt.category === 'Templates') {
          editor.chain().focus().insertContent('✨ Generating template...').run();
          
          const templateKey = prompt.label.toLowerCase().replace(/\s+/g, '-');
          const response = await tiptapAI.generateTemplate(templateKey);
          
          if (response.error) {
            editor.chain().focus().undo().run();
            alert(`AI Error: ${response.error}`);
          } else if (response.text) {
            editor.chain().focus().undo().insertContent(response.text).run();
          }
        } else {
          alert('Please select some text for this operation');
        }
      }
      
      onClose();
    } catch (error) {
      console.error('AI prompt error:', error);
      alert('AI feature encountered an error. Please try again.');
      // Try to clean up any loading state
      try {
        editor.chain().focus().undo().run();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  };

  // Helper function to get template content
  const getTemplateContent = (templateType: string) => {
    const templates: Record<string, string> = {
      'Prior Auth': `
Subject: Prior Authorization Approval - [Member Name] - [Service/Medication]

Dear [Provider Name],

We are pleased to inform you that the prior authorization request for [Member Name] (Member ID: [Member ID]) has been approved.

Authorization Details:
- Service/Medication: [Service/Medication Name]
- Authorization Number: [Auth Number]
- Effective Date: [Start Date]
- Expiration Date: [End Date]
- Approved Units/Visits: [Number]

This authorization is subject to the member's continued eligibility and benefit coverage at the time of service.

If you have any questions, please contact our Provider Services at [Phone Number].

Sincerely,
[Your Organization]
`,
      'Appeal Response': `
Subject: Appeal Decision - [Member Name] - [Case Number]

Dear [Member/Provider Name],

We have completed our review of your appeal dated [Appeal Date] regarding [Service/Claim].

After careful consideration of all submitted documentation and applicable coverage guidelines, we have determined:

[DECISION: Approved/Partially Approved/Denied]

[Detailed explanation of decision and rationale]

You have the right to request an external review of this decision. Please see the attached appeal rights for more information.

Sincerely,
[Your Organization]
`,
      'Denial Explanation': `
Subject: Benefit Determination - [Member Name] - [Service]

Dear [Member/Provider Name],

We have reviewed the request for [Service/Treatment] for [Member Name] (Member ID: [Member ID]).

After careful review, we are unable to approve coverage for the requested service at this time.

Reason for Determination:
[Detailed explanation of denial reason based on medical policy, benefit limitations, or eligibility]

You have the right to appeal this decision. Please see the enclosed appeal rights and procedures.

Sincerely,
[Your Organization]
`
    };

    return templates[templateType] || `\n[Template for ${templateType}]\n`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-h-96 overflow-hidden flex">
      {/* Categories */}
      <div className="w-1/3 border-r border-gray-200 bg-gray-50">
        <div className="p-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">
            Categories
          </div>
          {Object.keys(categories).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                selectedCategory === category ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts */}
      <div className="flex-1 overflow-y-auto">
        {selectedCategory ? (
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">
              {selectedCategory}
            </div>
            {categories[selectedCategory].map((prompt) => {
              const Icon = iconMap[prompt.icon] || FileText;
              return (
                <button
                  key={prompt.label}
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full text-left px-2 py-2 text-sm rounded hover:bg-gray-100 flex items-start gap-2 group"
                >
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-700 group-hover:text-purple-700">
                      {prompt.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {prompt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            Select a category to view AI prompts
          </div>
        )}
      </div>
    </div>
  );
}
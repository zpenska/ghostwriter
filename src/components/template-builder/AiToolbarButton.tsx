import { Editor } from '@tiptap/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface AiToolbarButtonProps {
  editor: Editor;
}

export default function AiToolbarButton({ editor }: AiToolbarButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // AI actions that work with the AI extension
  const aiActions = [
    {
      label: 'Improve writing',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          // Use the AI extension's actual API
          try {
            // The AI extension provides these through the editor instance
            const aiExtension = editor.extensionManager.extensions.find(ext => ext.name === 'ai');
            if (aiExtension && aiExtension.options.appId) {
              // For now, we'll use a placeholder - in production, this would call the AI API
              const improvedText = `[AI Improved]: ${selectedText}`;
              editor.chain().focus().deleteRange({ from, to }).insertContent(improvedText).run();
            }
          } catch (error) {
            console.error('AI improvement failed:', error);
          }
          setIsProcessing(false);
        }
      },
    },
    {
      label: 'Fix spelling & grammar',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          try {
            // Placeholder for AI grammar fix
            const fixedText = `[Grammar Fixed]: ${selectedText}`;
            editor.chain().focus().deleteRange({ from, to }).insertContent(fixedText).run();
          } catch (error) {
            console.error('Grammar fix failed:', error);
          }
          setIsProcessing(false);
        }
      },
    },
    {
      label: 'Make shorter',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          try {
            const shorterText = `[Shortened]: ${selectedText.substring(0, Math.floor(selectedText.length / 2))}...`;
            editor.chain().focus().deleteRange({ from, to }).insertContent(shorterText).run();
          } catch (error) {
            console.error('Shortening failed:', error);
          }
          setIsProcessing(false);
        }
      },
    },
    {
      label: 'Make longer',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          try {
            const longerText = `[Expanded]: ${selectedText} with additional context and details.`;
            editor.chain().focus().deleteRange({ from, to }).insertContent(longerText).run();
          } catch (error) {
            console.error('Expansion failed:', error);
          }
          setIsProcessing(false);
        }
      },
    },
    {
      label: 'Simplify',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          try {
            const simplifiedText = `[Simplified]: ${selectedText}`;
            editor.chain().focus().deleteRange({ from, to }).insertContent(simplifiedText).run();
          } catch (error) {
            console.error('Simplification failed:', error);
          }
          setIsProcessing(false);
        }
      },
    },
    {
      label: 'Professional tone',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          try {
            const professionalText = `[Professional]: ${selectedText}`;
            editor.chain().focus().deleteRange({ from, to }).insertContent(professionalText).run();
          } catch (error) {
            console.error('Tone change failed:', error);
          }
          setIsProcessing(false);
        }
      },
    },
    {
      label: 'Casual tone',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          try {
            const casualText = `[Casual]: ${selectedText}`;
            editor.chain().focus().deleteRange({ from, to }).insertContent(casualText).run();
          } catch (error) {
            console.error('Tone change failed:', error);
          }
          setIsProcessing(false);
        }
      },
    },
    {
      label: 'Translate to Spanish',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          try {
            const translatedText = `[Spanish]: ${selectedText}`;
            editor.chain().focus().deleteRange({ from, to }).insertContent(translatedText).run();
          } catch (error) {
            console.error('Translation failed:', error);
          }
          setIsProcessing(false);
        }
      },
    },
  ];

  const handleAction = (action: any) => {
    action.command();
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <Button
        color="indigo"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isProcessing}
        className={cn(
          'text-xs px-3 py-1',
          isProcessing && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isProcessing ? 'Processing...' : 'AI'}
      </Button>
      
      {showMenu && !isProcessing && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {aiActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleAction(action)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
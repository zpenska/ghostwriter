// src/components/template-builder/AiToolbarButton.tsx
import { Editor } from '@tiptap/react';
import { useState } from 'react';
import { buttonStyles } from '@/lib/utils/button-styles';
import { classNames } from '@/lib/utils/cn';

interface AiToolbarButtonProps {
  editor: Editor;
}

export default function AiToolbarButton({ editor }: AiToolbarButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Function to call Tiptap AI API
  const callTiptapAI = async (text: string, instruction: string) => {
    const response = await fetch('https://api.tiptap.dev/v1/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TIPTAP_AI_SECRET}`,
      },
      body: JSON.stringify({
        appId: process.env.NEXT_PUBLIC_TIPTAP_AI_APP_ID,
        text: text,
        instruction: instruction,
      }),
    });

    if (!response.ok) {
      throw new Error('AI request failed');
    }

    const result = await response.json();
    return result.text || text;
  };
  
  // AI actions that work with the AI extension
  const aiActions = [
    {
      label: 'Improve writing',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          try {
            const improvedText = await callTiptapAI(
              selectedText,
              'Improve the writing quality, clarity, and professionalism of this text while maintaining its original meaning.'
            );
            editor.chain().focus().deleteRange({ from, to }).insertContent(improvedText).run();
          } catch (error) {
            console.error('AI improvement failed:', error);
            alert('Failed to improve text. Please try again.');
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
            const fixedText = await callTiptapAI(
              selectedText,
              'Fix all spelling and grammar errors in this text.'
            );
            editor.chain().focus().deleteRange({ from, to }).insertContent(fixedText).run();
          } catch (error) {
            console.error('Grammar fix failed:', error);
            alert('Failed to fix grammar. Please try again.');
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
            const shorterText = await callTiptapAI(
              selectedText,
              'Make this text more concise while preserving all key information.'
            );
            editor.chain().focus().deleteRange({ from, to }).insertContent(shorterText).run();
          } catch (error) {
            console.error('Shortening failed:', error);
            alert('Failed to shorten text. Please try again.');
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
            const longerText = await callTiptapAI(
              selectedText,
              'Expand this text with more detail and context while maintaining clarity.'
            );
            editor.chain().focus().deleteRange({ from, to }).insertContent(longerText).run();
          } catch (error) {
            console.error('Expansion failed:', error);
            alert('Failed to expand text. Please try again.');
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
            const simplifiedText = await callTiptapAI(
              selectedText,
              'Simplify this text to make it easier to understand, using simpler words and shorter sentences.'
            );
            editor.chain().focus().deleteRange({ from, to }).insertContent(simplifiedText).run();
          } catch (error) {
            console.error('Simplification failed:', error);
            alert('Failed to simplify text. Please try again.');
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
            const professionalText = await callTiptapAI(
              selectedText,
              'Rewrite this text in a professional, formal tone suitable for business communication.'
            );
            editor.chain().focus().deleteRange({ from, to }).insertContent(professionalText).run();
          } catch (error) {
            console.error('Tone change failed:', error);
            alert('Failed to change tone. Please try again.');
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
            const casualText = await callTiptapAI(
              selectedText,
              'Rewrite this text in a casual, friendly tone.'
            );
            editor.chain().focus().deleteRange({ from, to }).insertContent(casualText).run();
          } catch (error) {
            console.error('Tone change failed:', error);
            alert('Failed to change tone. Please try again.');
          }
          setIsProcessing(false);
        }
      },
    },
    {
      label: 'Patient-friendly',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          try {
            const patientText = await callTiptapAI(
              selectedText,
              'Rewrite this text to be easily understood by patients, avoiding medical jargon and using simple, clear language.'
            );
            editor.chain().focus().deleteRange({ from, to }).insertContent(patientText).run();
          } catch (error) {
            console.error('Patient-friendly conversion failed:', error);
            alert('Failed to convert text. Please try again.');
          }
          setIsProcessing(false);
        }
      },
    },
    {
      label: 'Add empathy',
      command: async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          setIsProcessing(true);
          try {
            const empatheticText = await callTiptapAI(
              selectedText,
              'Add empathetic and compassionate language to this text while maintaining professionalism, suitable for healthcare communication.'
            );
            editor.chain().focus().deleteRange({ from, to }).insertContent(empatheticText).run();
          } catch (error) {
            console.error('Empathy addition failed:', error);
            alert('Failed to add empathy. Please try again.');
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
            const translatedText = await callTiptapAI(
              selectedText,
              'Translate this text to Spanish, maintaining the same tone and formality level.'
            );
            editor.chain().focus().deleteRange({ from, to }).insertContent(translatedText).run();
          } catch (error) {
            console.error('Translation failed:', error);
            alert('Failed to translate text. Please try again.');
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
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isProcessing}
        className={classNames(
          buttonStyles.purple,
          'text-xs px-3 py-1',
          isProcessing && 'opacity-50 cursor-not-allowed'
        )}
        title="AI Assistant"
      >
        {isProcessing ? 'Processing...' : 'AI'}
      </button>
      
      {showMenu && !isProcessing && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1 max-h-96 overflow-y-auto">
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
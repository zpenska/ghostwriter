// src/lib/services/spell-check.ts
import { Editor } from '@tiptap/react';

interface SpellCheckMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: Array<{ value: string }>;
  rule: {
    id: string;
    description: string;
    category: {
      id: string;
      name: string;
    };
  };
}

interface SpellCheckResponse {
  matches: SpellCheckMatch[];
}

export class SpellCheckService {
  private apiKey?: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.baseUrl = apiKey 
      ? 'https://api.languagetoolplus.com/v2/check'
      : 'https://api.languagetool.org/v2/check';
  }

  async checkText(text: string, language: string = 'en-US'): Promise<SpellCheckResponse> {
    // LanguageTool requires at least 3 characters
    if (text.trim().length < 3) {
      return { matches: [] };
    }

    const params = new URLSearchParams({
      text,
      language,
      enabledOnly: 'false',
      // Add required parameters for LanguageTool
      disabledRules: 'WHITESPACE_RULE',
    });

    if (this.apiKey && this.username) {
      params.append('apiKey', this.apiKey);
      params.append('username', this.username);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LanguageTool error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Spell check error:', error);
      throw error;
    }
  }

  async checkEditor(editor: Editor): Promise<void> {
    // Store editor reference globally for popup to use
    (window as any).currentEditor = editor;
    
    // Try different methods to get text
    const text = editor.state.doc.textContent || editor.getText() || '';
    
    console.log('Editor text content:', text);
    console.log('Text length:', text.length);
    
    // Check if there's enough text
    if (text.trim().length < 3) {
      alert('Please type at least a few words before checking spelling.');
      return;
    }
    
    try {
      const result = await this.checkText(text);
      
      if (result.matches.length === 0) {
        alert('No spelling or grammar issues found!');
        return;
      }

      this.highlightErrors(editor, result.matches);
      
      alert(`Found ${result.matches.length} potential issues. Click on highlighted text for suggestions.`);
    } catch (error) {
      console.error('Spell check failed:', error);
      // Provide helpful error message
      if (error instanceof Error && error.message.includes('400')) {
        alert('Spell check failed. Please make sure you have some text in the editor.');
      } else {
        alert('Spell check service is temporarily unavailable. Please try again later.');
      }
    }
  }

  private highlightErrors(editor: Editor, matches: SpellCheckMatch[]) {
    editor.chain().focus().unsetMark('highlight').run();

    const sortedMatches = [...matches].sort((a, b) => b.offset - a.offset);

    sortedMatches.forEach((match) => {
      const from = match.offset + 1;
      const to = from + match.length;

      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setHighlight({ color: '#fee2e2' })
        .run();

      editor.storage.spellcheck = editor.storage.spellcheck || {};
      editor.storage.spellcheck[`${from}-${to}`] = match;
    });
  }

  getSuggestionsAtPosition(editor: Editor, pos: number): SpellCheckMatch | null {
    const storage = editor.storage.spellcheck;
    if (!storage) return null;

    for (const key of Object.keys(storage)) {
      const [from, to] = key.split('-').map(Number);
      if (pos >= from && pos <= to) {
        return storage[key];
      }
    }

    return null;
  }
}

export const spellCheckService = new SpellCheckService(
  process.env.NEXT_PUBLIC_LANGUAGETOOL_API_KEY
);
// Spell and Grammar Check Service
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
    // Use the free API endpoint or premium if API key is provided
    this.baseUrl = apiKey 
      ? 'https://api.languagetoolplus.com/v2/check'
      : 'https://api.languagetool.org/v2/check';
  }

  async checkText(text: string, language: string = 'en-US'): Promise<SpellCheckResponse> {
    const params = new URLSearchParams({
      text,
      language,
      enabledOnly: 'false',
    });

    if (this.apiKey) {
      params.append('apiKey', this.apiKey);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Spell check error:', error);
      throw error;
    }
  }

  // Apply spell check to editor
  async checkEditor(editor: Editor): Promise<void> {
    const text = editor.getText();
    
    try {
      const result = await this.checkText(text);
      
      if (result.matches.length === 0) {
        alert('No spelling or grammar issues found!');
        return;
      }

      // Store matches for highlighting
      this.highlightErrors(editor, result.matches);
      
      alert(`Found ${result.matches.length} potential issues. Click on highlighted text for suggestions.`);
    } catch (error) {
      console.error('Spell check failed:', error);
      alert('Spell check failed. Please try again.');
    }
  }

  private highlightErrors(editor: Editor, matches: SpellCheckMatch[]) {
    // Clear previous highlights
    editor.chain().focus().unsetMark('highlight').run();

    // Sort matches by offset (descending) to avoid position shifts
    const sortedMatches = [...matches].sort((a, b) => b.offset - a.offset);

    sortedMatches.forEach((match) => {
      const from = match.offset + 1; // Tiptap positions are 1-indexed
      const to = from + match.length;

      // Add highlight with error data
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setHighlight({ color: '#fee2e2' }) // Light red for errors
        .run();

      // Store match data for later use
      editor.storage.spellcheck = editor.storage.spellcheck || {};
      editor.storage.spellcheck[`${from}-${to}`] = match;
    });
  }

  // Get suggestions for a specific position
  getSuggestionsAtPosition(editor: Editor, pos: number): SpellCheckMatch | null {
    const storage = editor.storage.spellcheck;
    if (!storage) return null;

    // Find match at position
    for (const key of Object.keys(storage)) {
      const [from, to] = key.split('-').map(Number);
      if (pos >= from && pos <= to) {
        return storage[key];
      }
    }

    return null;
  }
}

// Create a singleton instance
export const spellCheckService = new SpellCheckService(
  process.env.NEXT_PUBLIC_LANGUAGETOOL_API_KEY
);
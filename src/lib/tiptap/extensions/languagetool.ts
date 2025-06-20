import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    languageTool: {
      /**
       * Check grammar and spelling
       */
      checkGrammar: () => ReturnType,
    }
  }
}

export interface LanguageToolOptions {
  apiKey?: string;
  language?: string;
  apiUrl?: string;
}

export const LanguageTool = Extension.create<LanguageToolOptions>({
  name: 'languageTool',

  addOptions() {
    return {
      apiKey: '',
      language: 'en-US',
      apiUrl: 'https://api.languagetoolplus.com/v2/check',
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('languageTool'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            // Handle decorations for spelling/grammar errors
            return oldState.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      checkGrammar: () => ({ editor, chain }) => {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to || editor.state.doc.content.size);

        if (!text) return false;

        // Call LanguageTool API
        const apiUrl = this.options.apiUrl || 'https://api.languagetoolplus.com/v2/check';
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            text: text,
            language: this.options.language || 'en-US',
            apiKey: this.options.apiKey || '',
            enabledRules: '',
            disabledRules: 'WHITESPACE_RULE,PUNCTUATION_PARAGRAPH_END',
          }),
        })
          .then(response => response.json())
          .then(data => {
            if (data.matches && data.matches.length > 0) {
              // Process grammar/spelling errors
              console.log('LanguageTool found issues:', data.matches);
              // You can add UI to show these errors
            }
          })
          .catch((error: unknown) => {
            console.error('LanguageTool error:', error);
          });

        return true;
      },
    };
  },
});
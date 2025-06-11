// src/lib/tiptap/extensions/languagetool.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

interface LanguageToolMatch {
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

interface LanguageToolOptions {
  apiKey?: string;
  username?: string;
  language?: string;
  baseUrl?: string;
  debounceWait?: number;
}

const languageToolPluginKey = new PluginKey('languageTool');

export const LanguageTool = Extension.create<LanguageToolOptions>({
  name: 'languageTool',

  addOptions() {
    return {
      apiKey: undefined,
      username: undefined,
      language: 'en-US',
      baseUrl: 'https://api.languagetool.org/v2/check',
      debounceWait: 1000,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    let timeoutId: NodeJS.Timeout | null = null;
    let currentMatches: LanguageToolMatch[] = [];
    let editorView: any = null;

    const checkText = async (text: string) => {
      if (text.trim().length < 3) return { matches: [] };

      const params = new URLSearchParams({
        text,
        language: options.language || 'en-US',
        enabledOnly: 'false',
        disabledRules: 'WHITESPACE_RULE',
      });

      if (options.apiKey && options.username) {
        params.append('apiKey', options.apiKey);
        params.append('username', options.username);
      }

      const url = options.baseUrl || 'https://api.languagetool.org/v2/check';

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: params.toString(),
        });

        if (!response.ok) {
          console.error('LanguageTool error:', await response.text());
          return { matches: [] };
        }

        return await response.json();
      } catch (error) {
        console.error('LanguageTool request failed:', error);
        return { matches: [] };
      }
    };

    const createDecorations = (doc: any, matches: LanguageToolMatch[]) => {
      const decorations: Decoration[] = [];

      matches.forEach((match) => {
        const from = match.offset + 1;
        const to = from + match.length;

        if (from <= doc.content.size && to <= doc.content.size) {
          const decoration = Decoration.inline(from, to, {
            class: 'language-tool-error',
            'data-match': JSON.stringify(match),
          });
          decorations.push(decoration);
        }
      });

      return DecorationSet.create(doc, decorations);
    };

    return [
      new Plugin({
        key: languageToolPluginKey,
        state: {
          init(_, { doc }) {
            return DecorationSet.empty;
          },
          apply(tr, old) {
            if (tr.docChanged) {
              // Clear timeout if text changed
              if (timeoutId) {
                clearTimeout(timeoutId);
              }

              // Set new timeout for checking
              timeoutId = setTimeout(async () => {
                const text = tr.doc.textContent;
                const result = await checkText(text);
                currentMatches = result.matches || [];

                // Update decorations - use the stored view reference
                if (editorView) {
                  const decorations = createDecorations(editorView.state.doc, currentMatches);
                  editorView.dispatch(
                    editorView.state.tr.setMeta(languageToolPluginKey, { decorations })
                  );
                }
              }, options.debounceWait);

              return old;
            }

            // Check if we have new decorations from the timeout
            const meta = tr.getMeta(languageToolPluginKey);
            if (meta && meta.decorations) {
              return meta.decorations;
            }

            return old.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return languageToolPluginKey.getState(state);
          },
          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            
            if (target.classList.contains('language-tool-error')) {
              const matchData = target.getAttribute('data-match');
              if (matchData) {
                const match = JSON.parse(matchData);
                showSuggestionPopup(view, pos, match, target);
                return true;
              }
            }
            return false;
          },
        },
        view: (view) => {
          // Store editor view reference
          editorView = view;
          
          return {
            destroy: () => {
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
              editorView = null;
            },
          };
        },
      }),
    ];
  },
});

// Helper function to show suggestion popup
function showSuggestionPopup(view: any, pos: number, match: LanguageToolMatch, target: HTMLElement) {
  // Remove any existing popup
  const existingPopup = document.querySelector('.language-tool-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create popup
  const popup = document.createElement('div');
  popup.className = 'language-tool-popup';
  
  // Position popup near the error
  const rect = target.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom + 5}px`;
  popup.style.zIndex = '9999';

  // Create popup content
  popup.innerHTML = `
    <div class="language-tool-popup-content">
      <div class="language-tool-header">
        <span class="language-tool-title">Correct</span>
        <button class="language-tool-close">×</button>
      </div>
      <div class="language-tool-message">
        <p class="language-tool-error-type">Potential error</p>
        <p class="language-tool-description">${match.message}</p>
      </div>
      <div class="language-tool-suggestions">
        ${match.replacements.slice(0, 3).map(replacement => `
          <button class="language-tool-suggestion" data-value="${replacement.value}">
            ${replacement.value}
          </button>
        `).join('')}
        <button class="language-tool-ignore">Ignore</button>
      </div>
    </div>
  `;

  // Add event listeners
  popup.querySelector('.language-tool-close')?.addEventListener('click', () => {
    popup.remove();
  });

  popup.querySelector('.language-tool-ignore')?.addEventListener('click', () => {
    popup.remove();
  });

  popup.querySelectorAll('.language-tool-suggestion').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const value = (e.target as HTMLElement).getAttribute('data-value');
      if (value) {
        // Replace the text
        const from = match.offset + 1;
        const to = from + match.length;
        const tr = view.state.tr.replaceWith(from, to, view.state.schema.text(value));
        view.dispatch(tr);
        popup.remove();
      }
    });
  });

  document.body.appendChild(popup);

  // Remove popup when clicking outside
  setTimeout(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!popup.contains(e.target as Node)) {
        popup.remove();
        document.removeEventListener('click', handleClickOutside);
      }
    };
    document.addEventListener('click', handleClickOutside);
  }, 100);
}
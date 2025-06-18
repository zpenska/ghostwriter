// src/lib/tiptap/ai-extensions.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// AI Generation Extension
export const AiGeneration = Extension.create({
  name: 'aiGeneration',

  addOptions() {
    return {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      onGenerate: null,
    };
  },

  addCommands() {
    return {
      generateContent: (options: { prompt: string; insertAt?: number }) => ({ editor, commands }) => {
        const { prompt, insertAt } = options;
        
        // Show loading state
        const loadingNode = editor.schema.nodes.paragraph.create({}, [
          editor.schema.text('✨ AI is generating content...', [
            editor.schema.marks.em.create()
          ])
        ]);
        
        if (insertAt !== undefined) {
          editor.view.dispatch(
            editor.view.state.tr.insert(insertAt, loadingNode)
          );
        } else {
          commands.insertContent(loadingNode);
        }

        // Call AI service
        this.generateAIContent(prompt, editor);
        
        return true;
      },

      improveText: (selection?: { from: number; to: number }) => ({ editor }) => {
        const { from, to } = selection || editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        
        if (!selectedText) return false;
        
        const prompt = `Improve the following text to be more professional and clear: "${selectedText}"`;
        this.generateAIContent(prompt, editor, { from, to });
        
        return true;
      },

      makePatientFriendly: (selection?: { from: number; to: number }) => ({ editor }) => {
        const { from, to } = selection || editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        
        if (!selectedText) return false;
        
        const prompt = `Rewrite this medical text to be easily understood by patients, avoiding jargon: "${selectedText}"`;
        this.generateAIContent(prompt, editor, { from, to });
        
        return true;
      },

      checkHIPAA: (selection?: { from: number; to: number }) => ({ editor }) => {
        const { from, to } = selection || editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        
        if (!selectedText) return false;
        
        const prompt = `Review this text for HIPAA compliance and identify any potential PHI that should be removed: "${selectedText}"`;
        this.generateAIContent(prompt, editor, { from, to });
        
        return true;
      },
    };
  },

  // AI content generation method
  generateAIContent(prompt: string, editor: any, replaceRange?: { from: number; to: number }) {
    const { apiKey, baseUrl, model, onGenerate } = this.options;
    
    fetch('/api/ai-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        context: editor.getHTML(),
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.content) {
        if (replaceRange) {
          // Replace selected text
          editor.chain()
            .focus()
            .deleteRange(replaceRange)
            .insertContent(data.content)
            .run();
        } else {
          // Insert new content
          editor.chain()
            .focus()
            .insertContent(data.content)
            .run();
        }
        
        onGenerate?.(data.content);
      }
    })
    .catch(error => {
      console.error('AI generation error:', error);
      editor.chain()
        .focus()
        .insertContent('<p style="color: red;">❌ AI generation failed. Please try again.</p>')
        .run();
    });
  },
});

// AI Changes Extension (Track AI modifications)
export const AiChanges = Extension.create({
  name: 'aiChanges',

  addOptions() {
    return {
      trackChanges: true,
      showChanges: true,
    };
  },

  addStorage() {
    return {
      changes: [],
      currentChange: null,
    };
  },

  addCommands() {
    return {
      trackAiChange: (changeData: { type: string; original: string; generated: string; range: { from: number; to: number } }) => ({ editor }) => {
        if (!this.options.trackChanges) return false;
        
        const change = {
          id: Date.now().toString(),
          timestamp: new Date(),
          ...changeData,
        };
        
        this.storage.changes.push(change);
        
        // Add decoration to show AI changes
        if (this.options.showChanges) {
          this.addChangeDecoration(editor, change);
        }
        
        return true;
      },

      acceptAiChange: (changeId: string) => ({ editor }) => {
        const changeIndex = this.storage.changes.findIndex((c: any) => c.id === changeId);
        if (changeIndex === -1) return false;
        
        this.storage.changes.splice(changeIndex, 1);
        this.updateDecorations(editor);
        
        return true;
      },

      rejectAiChange: (changeId: string) => ({ editor }) => {
        const change = this.storage.changes.find((c: any) => c.id === changeId);
        if (!change) return false;
        
        // Restore original text
        editor.chain()
          .focus()
          .deleteRange(change.range)
          .insertContent(change.original)
          .run();
        
        // Remove from changes
        this.storage.changes = this.storage.changes.filter((c: any) => c.id !== changeId);
        this.updateDecorations(editor);
        
        return true;
      },

      showAiChanges: () => ({ editor }) => {
        this.options.showChanges = true;
        this.updateDecorations(editor);
        return true;
      },

      hideAiChanges: () => ({ editor }) => {
        this.options.showChanges = false;
        this.updateDecorations(editor);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('aiChanges'),
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, set) => {
            if (!this.options.showChanges) return DecorationSet.empty;
            
            // Update decorations based on changes
            return this.createChangeDecorations();
          },
        },
        props: {
          decorations: (state) => this.getPlugin().getState(state),
        },
      }),
    ];
  },

  addChangeDecoration(editor: any, change: any) {
    // Implementation for adding change decorations
  },

  updateDecorations(editor: any) {
    // Implementation for updating decorations
  },

  createChangeDecorations() {
    // Implementation for creating change decorations
    return DecorationSet.empty;
  },
});

// AI Suggestions Extension
export const AiSuggestion = Extension.create({
  name: 'aiSuggestion',

  addOptions() {
    return {
      showSuggestions: true,
      suggestionDelay: 1000,
      minTextLength: 10,
    };
  },

  addStorage() {
    return {
      suggestions: [],
      activeSuggestion: null,
    };
  },

  addCommands() {
    return {
      getSuggestions: () => ({ editor }) => {
        const content = editor.getText();
        if (content.length < this.options.minTextLength) return false;
        
        this.fetchSuggestions(content, editor);
        return true;
      },

      applySuggestion: (suggestionId: string) => ({ editor }) => {
        const suggestion = this.storage.suggestions.find((s: any) => s.id === suggestionId);
        if (!suggestion) return false;
        
        editor.chain()
          .focus()
          .deleteRange(suggestion.range)
          .insertContent(suggestion.text)
          .run();
        
        // Track as AI change
        editor.commands.trackAiChange({
          type: 'suggestion',
          original: suggestion.original,
          generated: suggestion.text,
          range: suggestion.range,
        });
        
        return true;
      },

      dismissSuggestion: (suggestionId: string) => () => {
        this.storage.suggestions = this.storage.suggestions.filter((s: any) => s.id !== suggestionId);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    let suggestionTimeout: NodeJS.Timeout;
    
    return [
      new Plugin({
        key: new PluginKey('aiSuggestion'),
        props: {
          handleTextInput: (view, from, to, text) => {
            if (!this.options.showSuggestions) return false;
            
            // Clear existing timeout
            clearTimeout(suggestionTimeout);
            
            // Set new timeout for suggestions
            suggestionTimeout = setTimeout(() => {
              const content = view.state.doc.textBetween(0, view.state.doc.content.size);
              if (content.length >= this.options.minTextLength) {
                this.fetchSuggestions(content, { view });
              }
            }, this.options.suggestionDelay);
            
            return false;
          },
        },
      }),
    ];
  },

  fetchSuggestions(content: string, editor: any) {
    fetch('/api/ai-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        context: 'healthcare-letter',
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.suggestions) {
        this.storage.suggestions = data.suggestions.map((s: any, index: number) => ({
          ...s,
          id: `suggestion-${Date.now()}-${index}`,
        }));
        
        // Trigger UI update
        editor.view?.dispatch(editor.view.state.tr);
      }
    })
    .catch(error => {
      console.error('AI suggestions error:', error);
    });
  },
});

// Healthcare-specific AI Extension
export const HealthcareAI = Extension.create({
  name: 'healthcareAI',

  addCommands() {
    return {
      generateDenialLetter: (options: { reason: string; memberInfo: any }) => ({ editor }) => {
        const prompt = `Generate a professional healthcare denial letter for the following reason: ${options.reason}. Include appropriate medical necessity language and appeal rights information.`;
        
        editor.commands.generateContent({ prompt });
        return true;
      },

      generateApprovalLetter: (options: { service: string; memberInfo: any }) => ({ editor }) => {
        const prompt = `Generate a professional healthcare approval letter for ${options.service}. Include coverage details and any limitations or requirements.`;
        
        editor.commands.generateContent({ prompt });
        return true;
      },

      generateAppealResponse: (options: { originalDecision: string; appealReason: string }) => ({ editor }) => {
        const prompt = `Generate a professional appeal response letter addressing the following appeal reason: ${options.appealReason}. Original decision: ${options.originalDecision}`;
        
        editor.commands.generateContent({ prompt });
        return true;
      },

      suggestICD10Codes: (selection?: { from: number; to: number }) => ({ editor }) => {
        const { from, to } = selection || editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        
        if (!selectedText) return false;
        
        const prompt = `Suggest relevant ICD-10 codes for the following medical condition or service: "${selectedText}"`;
        editor.commands.generateContent({ prompt });
        
        return true;
      },

      suggestCPTCodes: (selection?: { from: number; to: number }) => ({ editor }) => {
        const { from, to } = selection || editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        
        if (!selectedText) return false;
        
        const prompt = `Suggest relevant CPT/HCPCS codes for the following medical procedure or service: "${selectedText}"`;
        editor.commands.generateContent({ prompt });
        
        return true;
      },
    };
  },
});

// Export all extensions
export { AiGeneration, AiChanges, AiSuggestion, HealthcareAI };
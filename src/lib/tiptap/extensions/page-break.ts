// src/lib/tiptap/extensions/page-break.ts
// Simple page break extension with proper TypeScript types

import { Node } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Insert a page break
       */
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: 'pageBreak',
  
  group: 'block',
  
  atom: true,
  
  selectable: false,
  
  draggable: true,
  
  parseHTML() {
    return [
      {
        tag: 'div[data-page-break]',
      },
    ];
  },
  
  renderHTML() {
    return [
      'div',
      {
        'data-page-break': 'true',
        class: 'page-break',
      },
    ];
  },
  
  addCommands() {
    return {
      setPageBreak: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    };
  },
});
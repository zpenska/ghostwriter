// src/types/tiptap.d.ts

declare module '@tiptap/extension-subscript' {
    import { Extension } from '@tiptap/core';
    const Subscript: Extension;
    export default Subscript;
  }
  
  declare module '@tiptap/extension-superscript' {
    import { Extension } from '@tiptap/core';
    const Superscript: Extension;
    export default Superscript;
  }
  
  declare module '@tiptap/extension-code-block-lowlight' {
    import { Extension } from '@tiptap/core';
    import { Plugin } from 'prosemirror-state';
    
    export interface CodeBlockLowlightOptions {
      lowlight: any;
      defaultLanguage?: string | null;
      HTMLAttributes?: Record<string, any>;
    }
    
    const CodeBlockLowlight: Extension<CodeBlockLowlightOptions>;
    export default CodeBlockLowlight;
  }

  // src/types/tiptap.d.ts
// Additional TypeScript declarations for Tiptap extensions

import '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Insert a page break element
       */
      setPageBreak: () => ReturnType;
    };
  }
}
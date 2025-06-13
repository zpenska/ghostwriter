import { useContext, createContext } from 'react';
import { Editor } from '@tiptap/react';

export const EditorContext = createContext<{ editor: Editor | null }>({ editor: null });

export function useEditorContext() {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error('useEditorContext must be used inside an EditorContext.Provider');
  }

  return context;
}

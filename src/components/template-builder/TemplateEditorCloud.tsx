'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import CollaborationHistory from '@tiptap-pro/extension-collaboration-history';
import Comments from '@tiptap-pro/extension-comments';
import { useEffect, useState } from 'react';
import { TIPTAP_CLOUD_CONFIG } from '@/lib/tiptap/cloud-config';
// ... import all other extensions

interface TemplateEditorCloudProps {
  documentId: string;
  userId: string;
  userName: string;
}

export default function TemplateEditorCloud({ documentId, userId, userName }: TemplateEditorCloudProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [tokens, setTokens] = useState<any>(null);

  // Get authentication tokens
  useEffect(() => {
    async function getTokens() {
      const response = await fetch('/api/tiptap-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName }),
      });
      const tokens = await response.json();
      setTokens(tokens);
    }
    getTokens();
  }, [userId, userName]);

  // Initialize collaboration provider
  useEffect(() => {
    if (!tokens) return;

    const provider = new HocuspocusProvider({
      appId: TIPTAP_CLOUD_CONFIG.appId,
      name: documentId,
      token: tokens.documentToken,
      url: TIPTAP_CLOUD_CONFIG.collaborationUrl,
    });

    setProvider(provider);

    return () => {
      provider.destroy();
    };
  }, [documentId, tokens]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: provider?.document,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: userName,
          color: '#8B5CF6',
        },
      }),
      CollaborationHistory.configure({
        provider,
      }),
      Comments.configure({
        provider,
      }),
      // ... all other extensions
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  }, [provider]);

  if (!editor || !provider) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <EditorContent editor={editor} />
    </div>
  );
}
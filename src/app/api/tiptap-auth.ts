// pages/api/tiptap-auth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const AI_APP_ID = process.env.TIPTAP_AI_APP_ID!;
const AI_SECRET = process.env.TIPTAP_AI_SECRET!;
const APP_ID = process.env.TIPTAP_AI_APP_ID!; // reuse for collab

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, userName, documentId } = req.body;

  const documentToken = jwt.sign(
    { app_id: APP_ID, user_id: userId, document_id: documentId },
    AI_SECRET, // Can be same secret for both if unified
    { expiresIn: '1h' }
  );

  const aiToken = jwt.sign(
    { app_id: AI_APP_ID, user_id: userId },
    AI_SECRET,
    { expiresIn: '1h' }
  );

  res.status(200).json({
    appId: AI_APP_ID,
    documentToken,
    aiToken,
  });
}

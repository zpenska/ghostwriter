// src/app/api/tiptap-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { TIPTAP_CLOUD_CONFIG } from '@/lib/tiptap/cloud-config';

export async function POST(request: NextRequest) {
  try {
    const { userId, userName, documentId } = await request.json();

    if (!userId || !userName) {
      return NextResponse.json(
        { error: 'Missing userId or userName' },
        { status: 400 }
      );
    }

    // Generate JWT for document access using your app secret
    const documentToken = jwt.sign(
      {
        aud: TIPTAP_CLOUD_CONFIG.appId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        sub: userId,
        context: {
          user: {
            id: userId,
            name: userName,
          },
          document: {
            id: documentId || 'default',
            access: 'write',
          },
        },
      },
      TIPTAP_CLOUD_CONFIG.appSecret,
      { algorithm: 'HS256' }
    );

    // Generate JWT for AI features
    const aiToken = jwt.sign(
      {
        aud: TIPTAP_CLOUD_CONFIG.aiAppId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        sub: userId,
      },
      TIPTAP_CLOUD_CONFIG.aiSecret,
      { algorithm: 'HS256' }
    );

    return NextResponse.json({
      documentToken,
      aiToken,
      expiresIn: 86400, // 24 hours
    });
  } catch (error) {
    console.error('JWT generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tokens' },
      { status: 500 }
    );
  }
}
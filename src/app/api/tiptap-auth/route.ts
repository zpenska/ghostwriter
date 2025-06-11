import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { TIPTAP_CLOUD_CONFIG } from '@/lib/tiptap/cloud-config';

export async function POST(request: NextRequest) {
  try {
    const { userId, userName } = await request.json();

    if (!userId || !userName) {
      return NextResponse.json({ error: 'Missing userId or userName' }, { status: 400 });
    }

    // Generate JWT for Document Server
    const documentToken = jwt.sign(
      {
        aud: TIPTAP_CLOUD_CONFIG.appId,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        iss: 'https://cloud.tiptap.dev',
        sub: userId,
        context: {
          user: {
            id: userId,
            name: userName,
          },
        },
      },
      TIPTAP_CLOUD_CONFIG.appSecret,
      { algorithm: 'HS256' }
    );

    // Generate JWT for AI
    const aiToken = jwt.sign(
      {
        aud: TIPTAP_CLOUD_CONFIG.aiAppId,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        iss: 'https://cloud.tiptap.dev',
      },
      TIPTAP_CLOUD_CONFIG.aiSecret,
      { algorithm: 'HS256' }
    );

    // Generate JWT for Conversion
    const conversionToken = jwt.sign(
      {
        aud: TIPTAP_CLOUD_CONFIG.conversionAppId,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        iss: 'https://cloud.tiptap.dev',
      },
      TIPTAP_CLOUD_CONFIG.conversionSecret,
      { algorithm: 'HS256' }
    );

    return NextResponse.json({
      documentToken,
      aiToken,
      conversionToken,
    });
  } catch (error) {
    console.error('Error generating JWT:', error);
    return NextResponse.json({ error: 'Failed to generate tokens' }, { status: 500 });
  }
}
// src/app/api/tiptap-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple JWT implementation without external library
function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createJWT(payload: any, secret: string): string {
  const header = {
    typ: 'JWT',
    alg: 'HS256'
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, userName } = await request.json();

    // Your Document Server Secret (not AI Secret)
    const secret = 'd796d28c7388b661bd27c84a73a8b2aa2f5bb55d5d26b21f096348391304807a';
    
    // Create JWT payload for Document Server
    const payload = {
      aud: 'j9yd36p9', // Document Server App ID
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      iss: 'https://cloud.tiptap.dev',
      sub: userId,
      name: userName
    };

    const token = createJWT(payload, secret);
    
    console.log('Generated JWT token for user:', userId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('JWT generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also handle GET for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Tiptap Auth API is working. Use POST to generate a token.',
    expectedPayload: {
      userId: 'string',
      userName: 'string'
    }
  });
}
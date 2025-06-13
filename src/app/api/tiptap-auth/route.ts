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
    const { userId, userName, documentId } = await request.json();

    // Document Server credentials (UPDATED)
    const documentSecret = '05cff228724828845c69f7a6f6397397574acc89590f438aac87c6fe39a9d48d';
    const documentAppId = 'w9ne2v89';
    
    // Document Management ID
    const docManagementId = '24964a9d372c048b1784a53a5f5b59de890a5069d41c3439359aa3062437963b';
    
    // AI credentials (UPDATED)
    const aiSecret = 'GNVLBYqJiRsk3NZHPsjpAl9m0Fgeqgzcwj5L2uiSp1obHR64TjV6CrRJVRY6w5to';
    const aiAppId = 'e976rxjm';
    
    // Conversion credentials (UPDATED)
    const conversionSecret = 'VgwMIjOaJItlLLEzoJMY5ePZbE0cllm1X34DXlJnGaKqIEqqzNVYP5ybZudfa7eF';
    const conversionAppId = 'e976rxjm';
    
    // Create JWT payload for Document Server
    const documentPayload = {
      aud: documentAppId,
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      iss: 'https://cloud.tiptap.dev',
      sub: userId,
      name: userName,
      ...(documentId && { document: documentId })
    };

    // Create JWT payload for AI
    const aiPayload = {
      aud: aiAppId,
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      iss: 'https://cloud.tiptap.dev',
      sub: userId,
      name: userName
    };

    // Create JWT payload for Conversion
    const conversionPayload = {
      aud: conversionAppId,
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      iss: 'https://cloud.tiptap.dev',
      sub: userId,
      name: userName
    };

    const documentToken = createJWT(documentPayload, documentSecret);
    const aiToken = createJWT(aiPayload, aiSecret);
    const conversionToken = createJWT(conversionPayload, conversionSecret);
    
    console.log('Generated JWT tokens for user:', userId);

    return NextResponse.json({ 
      // Document Server
      appId: documentAppId,
      token: documentToken, // Keep for backward compatibility
      documentToken,
      docManagementId, // For document management
      
      // AI
      aiAppId,
      aiToken,
      
      // Conversion
      conversionAppId,
      conversionToken,
      
      // Legacy support
      documentId: documentId || 'default'
    });
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
    message: 'Tiptap Auth API is working. Use POST to generate tokens.',
    expectedPayload: {
      userId: 'string',
      userName: 'string',
      documentId: 'string (optional)'
    },
    features: {
      documentServer: 'w9ne2v89',
      contentAI: 'e976rxjm',
      conversion: 'e976rxjm',
      docManagement: '24964a9d372c048b1784a53a5f5b59de890a5069d41c3439359aa3062437963b'
    }
  });
}
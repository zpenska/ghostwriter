// src/app/api/tiptap-jwt/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    // Your Tiptap app secret (keep this secure - use environment variables in production)
    const appSecret = process.env.TIPTAP_APP_SECRET || 'd796d28c7388b661bd27c84a73a8b2aa2f5bb55d5d26b21f096348391304807a';
    
    // Generate JWT token
    const token = jwt.sign(
      {
        // Add any custom claims here if needed
      },
      appSecret,
      {
        algorithm: 'HS256',
        expiresIn: '24h', // Token expires in 24 hours
      }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating JWT:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
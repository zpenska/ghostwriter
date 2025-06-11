// Tiptap Cloud Configuration with your actual credentials
export const TIPTAP_CLOUD_CONFIG = {
    // Document Server
    appId: 'j9yd36p9',
    appSecret: process.env.TIPTAP_APP_SECRET || 'd796d28c7388b661bd27c84a73a8b2aa2f5bb55d5d26b21f096348391304807a',
    
    // Content AI
    aiAppId: 'jkver1dm',
    aiSecret: process.env.TIPTAP_AI_SECRET || 'IJZWrFYTgJMh4scmhn3Y3aYGugYP6GkRNEqFrm6c3UNFr97gEVYLp98WbqJghjlk',
    
    // Conversion (Import/Export)
    conversionAppId: 'jkver1dm',
    conversionSecret: process.env.TIPTAP_CONVERSION_SECRET || 'jlqNBjExF3Mdthfhw5FYnFroV4deKepQeajsfVB8nufiG3hOYL1p1OVDBbovEe24',
    
    // URLs
    baseUrl: 'https://cloud.tiptap.dev',
    collaborationUrl: 'wss://cloud.tiptap.dev',
    
    // Your webhook endpoint (if you have one)
    webhookUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/tiptap-webhook` : '',
  };
  
  // JWT generation helper
  export function generateJWT(payload: any, secret: string): string {
    // This is a placeholder - in production, use a proper JWT library
    // For now, you can use the example JWTs provided
    return 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';
  }

    // Collaboration endpoints
    collaborationUrl: 'wss://j9yd36p9.collab.tiptap.cloud',
    apiUrl: 'https://j9yd36p9.collab.tiptap.cloud/api',
    
    
    // Default collaboration settings
    defaultCollaboration: {
      maxVersions: 100,
      throttle: 500,
      clientId: 'ghostwriter',
    }
  };
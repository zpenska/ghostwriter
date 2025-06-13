// src/app/api/casper-ai/route.ts
import { NextRequest, NextResponse } from 'next/server';

console.log('🚀 Casper AI Route loaded');

// Initialize OpenAI with better error handling
let openai: any = null;

async function initializeOpenAI() {
  if (openai) return openai;
  
  try {
    const { default: OpenAI } = await import('openai');
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    if (!apiKey.startsWith('sk-')) {
      throw new Error('OPENAI_API_KEY appears to be invalid (should start with sk-)');
    }
    
    openai = new OpenAI({ apiKey });
    console.log('✅ OpenAI initialized successfully');
    return openai;
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI:', error);
    throw error;
  }
}

// Initialize Firebase Admin with better error handling
let firestore: any = null;

async function initializeFirestore() {
  if (firestore) return firestore;
  
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    
    if (!getApps().length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!projectId || !clientEmail || !privateKey) {
        console.warn('⚠️ Firebase credentials incomplete, skipping Firestore initialization');
        return null;
      }
      
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    
    firestore = getFirestore();
    console.log('✅ Firestore initialized successfully');
    return firestore;
  } catch (error) {
    console.warn('⚠️ Firestore initialization failed, continuing without variables:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  console.log('📝 POST request received at /api/casper-ai');
  
  try {
    // 1. Parse request body with error handling
    let body;
    try {
      body = await req.json();
      console.log('✅ Request body parsed successfully');
      console.log('📊 Request structure:', {
        hasMessages: !!body.messages,
        messageCount: body.messages?.length || 0,
        hasEditorHtml: !!body.editorHtml,
        hasSelection: !!body.selectionMemory,
        clinicalContext: body.clinicalContext,
        hipaaMode: body.hipaaMode
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json({ 
        reply: 'Invalid request format',
        error: true 
      }, { status: 400 });
    }

    // 2. Initialize OpenAI
    console.log('🤖 Initializing OpenAI...');
    let openaiClient;
    try {
      openaiClient = await initializeOpenAI();
    } catch (openaiError) {
      console.error('❌ OpenAI initialization failed:', openaiError);
      return NextResponse.json({ 
        reply: 'AI service is not available. Please check configuration.',
        error: true 
      }, { status: 500 });
    }

    // 3. Extract and validate request data
    const {
      messages = [],
      editorHtml = '',
      selectionMemory = '',
      clinicalContext = false,
      hipaaMode = false
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('❌ No messages provided');
      return NextResponse.json({ 
        reply: 'No messages provided',
        error: true 
      }, { status: 400 });
    }

    // 4. Try to load variables from Firestore (optional)
    console.log('🔍 Loading variables from Firestore...');
    let variableList: any[] = [];
    let codeList: any[] = [];

    try {
      const db = await initializeFirestore();
      
      if (db) {
        // Load variables
        const variableSnapshot = await db.collection('casper-variables').get();
        variableList = variableSnapshot.docs.map((doc: any) => doc.data());
        
        // Load medical codes if clinical context is requested
        if (clinicalContext) {
          const codeSnapshot = await db.collection('casper-codes').limit(10).get();
          codeList = codeSnapshot.docs.map((doc: any) => doc.data());
        }
        
        console.log('✅ Loaded variables and codes from Firestore');
      }
    } catch (firestoreError) {
      console.warn('⚠️ Firestore query failed, using fallback variables:', firestoreError);
    }

    // 5. Prepare default variables if none loaded from Firestore
    const formattedVariables = variableList.length > 0 
      ? variableList.map(v => `- {{${v.variable}}}: ${v.description}`).join('\n')
      : `Available variables:
- {{member_name}}: Patient's full name
- {{provider_name}}: Healthcare provider name
- {{service_date}}: Date of service
- {{member_id}}: Patient member ID
- {{diagnosis_code}}: Primary diagnosis code (ICD-10)
- {{procedure_code}}: Procedure code (CPT/HCPCS)
- {{facility_name}}: Healthcare facility name
- {{current_date}}: Today's date
- {{case_number}}: Case reference number`;

    const formattedCodes = codeList.length > 0
      ? codeList.map(c => `- ${c.code}: ${c.description} (${c.type})`).join('\n')
      : '';

    // 6. Build system prompt
    const systemPrompt = `You are Casper, a clinical AI assistant for generating and editing healthcare letters.

Your responsibilities:
- Generate professional clinical correspondence
- Use healthcare variables appropriately (wrapped in double curly braces)
- Maintain HIPAA compliance when hipaaMode is enabled
- Provide content in HTML format suitable for insertion into a rich text editor
- Use proper HTML tags: <p>, <strong>, <em>, <ul>, <li>, etc.

${formattedVariables}

${clinicalContext && formattedCodes ? `\nMedical codes reference:\n${formattedCodes}` : ''}

Current context:
- Document content: ${editorHtml || '[Empty document]'}
- Selected text: ${selectionMemory || '[No selection]'}
- HIPAA mode: ${hipaaMode ? 'Enabled' : 'Disabled'}

Instructions:
- Always respond with HTML content that can be inserted into the editor
- Use variables by wrapping them in double curly braces: {{variable_name}}
- Keep responses professional and clinical
- If generating a complete letter, include proper structure with variables
- For partial content, ensure it flows well with existing content`;

    console.log('📝 System prompt prepared');

    // 7. Process messages - handle both old and new formats and fix role names
    let processedMessages;
    
    // Check if messages already include system message
    const hasSystemMessage = messages.some((msg: any) => msg.role === 'system');
    
    if (hasSystemMessage) {
      // New format - messages include system context
      processedMessages = messages;
    } else {
      // Old format - add system message
      processedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];
    }

    // Fix role names - convert 'ai' to 'assistant' for OpenAI API compatibility
    processedMessages = processedMessages.map((msg: any) => ({
      ...msg,
      role: msg.role === 'ai' ? 'assistant' : msg.role
    }));

    console.log('📤 Prepared messages for OpenAI:', {
      messageCount: processedMessages.length,
      hasSystem: processedMessages.some((m: any) => m.role === 'system'),
      lastUserMessage: processedMessages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content?.substring(0, 100)
    });

    // 8. Make OpenAI request
    console.log('🚀 Sending request to OpenAI...');
    let response;
    try {
      response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: processedMessages,
        temperature: 0.7,
        max_tokens: 1500,
      });
      console.log('✅ OpenAI response received');
    } catch (openaiError: any) {
      console.error('❌ OpenAI API error:', openaiError);
      console.error('OpenAI error details:', {
        message: openaiError.message,
        type: openaiError.type,
        code: openaiError.code,
        status: openaiError.status
      });
      
      let errorMessage = 'AI service error: ';
      if (openaiError.code === 'insufficient_quota') {
        errorMessage += 'API quota exceeded. Please try again later.';
      } else if (openaiError.code === 'invalid_api_key') {
        errorMessage += 'API key is invalid.';
      } else if (openaiError.status === 429) {
        errorMessage += 'Too many requests. Please wait a moment and try again.';
      } else {
        errorMessage += openaiError.message || 'Unknown error occurred.';
      }
      
      return NextResponse.json({ 
        reply: errorMessage,
        error: true 
      }, { status: 500 });
    }

    // 9. Process and return response
    const reply = response.choices[0].message?.content?.trim() || 'Sorry, I could not generate a response.';
    console.log('📤 Reply generated, length:', reply.length);
    console.log('📤 Reply preview:', reply.substring(0, 200) + '...');

    // Determine if this is HTML content to insert
    const isHtmlContent = reply.includes('<') && reply.includes('>');
    
    let result: any = {
      reply: isHtmlContent ? 'Content generated and ready to insert!' : reply,
    };

    if (isHtmlContent) {
      result.insertHtml = reply;
      console.log('📋 HTML content flagged for insertion');
    }

    console.log('✅ Request completed successfully');
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('💥 FATAL ERROR in Casper AI API:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    
    return NextResponse.json({ 
      reply: 'A server error occurred. Please try again in a moment.',
      error: true,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5) // Limit stack trace
      } : undefined
    }, { status: 500 });
  }
}

// Add a GET method for testing
export async function GET() {
  console.log('🔍 GET request to /api/casper-ai for testing');
  
  return NextResponse.json({ 
    status: 'Casper AI API is running',
    timestamp: new Date().toISOString(),
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openAIKeyFormat: process.env.OPENAI_API_KEY?.startsWith('sk-') ? 'Valid format' : 'Invalid format',
      hasFirebaseProject: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebaseEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebaseKey: !!process.env.FIREBASE_PRIVATE_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
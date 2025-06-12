// src/lib/services/tiptap-ai-service.ts

interface AIRequest {
    prompt: string;
    text?: string;
    operation?: 'rewrite' | 'expand' | 'shorten' | 'fix' | 'translate' | 'generate';
    language?: string;
    tone?: string;
  }
  
  interface AIResponse {
    text: string;
    error?: string;
  }
  
  class TipTapAIService {
    private appId: string;
    private token: string;
    private baseUrl: string;
  
    constructor() {
      this.appId = process.env.NEXT_PUBLIC_TIPTAP_AI_APP_ID || 'jkver1dm';
      this.token = process.env.NEXT_PUBLIC_TIPTAP_AI_SECRET || 'IJZWrFYTgJMh4scmhn3Y3aYGugYP6GkRNEqFrm6c3UNFr97gEVYLp98WbqJghjlk';
      this.baseUrl = 'https://api.tiptap.dev/v1';
    }
  
    async generateContent(request: AIRequest): Promise<AIResponse> {
      try {
        const endpoint = `${this.baseUrl}/ai/generate`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'X-App-Id': this.appId,
          },
          body: JSON.stringify({
            model: 'gpt-4',
            prompt: request.prompt,
            context: request.text || '',
            operation: request.operation || 'generate',
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });
  
        if (!response.ok) {
          const error = await response.text();
          console.error('TipTap AI Error:', error);
          throw new Error(`AI request failed: ${response.status}`);
        }
  
        const data = await response.json();
        return {
          text: data.text || data.content || data.result,
        };
      } catch (error) {
        console.error('TipTap AI Service Error:', error);
        return {
          text: '',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    }
  
    // Specific methods for different operations
    async rewriteText(text: string, prompt: string): Promise<AIResponse> {
      return this.generateContent({
        prompt,
        text,
        operation: 'rewrite',
      });
    }
  
    async expandText(text: string): Promise<AIResponse> {
      return this.generateContent({
        prompt: 'Expand this text with more detail and context',
        text,
        operation: 'expand',
      });
    }
  
    async shortenText(text: string): Promise<AIResponse> {
      return this.generateContent({
        prompt: 'Make this text more concise while keeping the key points',
        text,
        operation: 'shorten',
      });
    }
  
    async fixGrammar(text: string): Promise<AIResponse> {
      return this.generateContent({
        prompt: 'Fix grammar and spelling errors',
        text,
        operation: 'fix',
      });
    }
  
    async generateTemplate(templateType: string, context?: string): Promise<AIResponse> {
      const prompts: Record<string, string> = {
        'prior-auth': 'Generate a professional prior authorization approval letter for healthcare',
        'appeal-response': 'Generate a professional appeal response letter for healthcare claim',
        'denial-explanation': 'Generate a clear and compliant explanation for healthcare coverage denial',
      };
  
      return this.generateContent({
        prompt: prompts[templateType] || `Generate a ${templateType} template`,
        text: context,
        operation: 'generate',
      });
    }
  }
  
  export const tiptapAI = new TipTapAIService();
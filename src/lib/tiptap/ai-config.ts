import AI from '@tiptap-pro/extension-ai';
import AiChanges from '@tiptap-pro/extension-ai-changes';
import AiSuggestion from '@tiptap-pro/extension-ai-suggestion';
import AiAgent, { AiAgentProvider } from '@tiptap-pro/extension-ai-agent';

// Create the AI Agent Provider
export const createAiAgentProvider = () => {
  return new AiAgentProvider({
    appId: 'jkver1dm',
    token: 'IJZWrFYTgJMh4scmhn3Y3aYGugYP6GkRNEqFrm6c3UNFr97gEVYLp98WbqJghjlk',
  });
};

// Configure Tiptap Content AI with all features
export const configureTiptapAI = () => {
  return AI.configure({
    appId: 'jkver1dm',
    token: 'IJZWrFYTgJMh4scmhn3Y3aYGugYP6GkRNEqFrm6c3UNFr97gEVYLp98WbqJghjlk',
    baseUrl: 'https://api.tiptap.dev/v1',
    autocompletion: true,
    defaultModel: 'gpt-4',
    
    // AI Generation capabilities
    generation: {
      endpoint: '/generate',
      defaultOptions: {
        temperature: 0.7,
        maxTokens: 1000,
      },
    },
  });
};

// Configure AI Agent
export const configureAiAgent = (provider: AiAgentProvider) => {
  return AiAgent.configure({
    provider,
    // Optional: Add custom commands
    commands: {
      // Healthcare-specific commands
      priorAuth: {
        label: 'Generate Prior Authorization',
        prompt: healthcarePrompts.priorAuth.prompt,
      },
      appealLetter: {
        label: 'Generate Appeal Letter',
        prompt: healthcarePrompts.appealLetter.prompt,
      },
    },
  });
};

// Configure AI Changes for tracking AI modifications
export const configureAiChanges = () => {
  return AiChanges.configure({
    authorId: 'ai-assistant',
    authorName: 'AI Assistant',
    trackChanges: true,
  });
};

// Configure AI Suggestions
export const configureAiSuggestion = () => {
  return AiSuggestion.configure({
    suggestion: {
      char: '++',
      startOfLine: false,
      decorationClass: 'ai-suggestion',
      command: ({ editor, range, props }) => {
        // Delete the trigger chars
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .run();
        
        // The AI suggestion will appear automatically
      },
    },
  });
};

// Healthcare-specific AI prompts
export const healthcarePrompts = {
  priorAuth: {
    title: 'Prior Authorization Letter',
    prompt: `Generate a professional prior authorization letter for medical services. Include:
    - Patient information section with placeholders
    - Medical necessity statement
    - Clinical justification with evidence
    - Treatment plan details
    - Expected outcomes
    - Provider credentials
    Use variables like {{PatientName}}, {{DOB}}, {{MemberID}}, {{Diagnosis}}, {{Treatment}}`,
  },
  appealLetter: {
    title: 'Appeal Letter',
    prompt: `Create a comprehensive appeal letter template including:
    - Reference to denial ({{DenialDate}}, {{DenialNumber}})
    - Strong medical necessity argument
    - Supporting clinical evidence and guidelines
    - Patient impact statement
    - Request for reconsideration
    - Contact information for follow-up`,
  },
  benefitExplanation: {
    title: 'Member Benefit Explanation',
    prompt: `Write a clear member benefit explanation including:
    - Coverage details in simple language
    - Cost-sharing breakdown (deductible, copay, coinsurance)
    - In-network vs out-of-network benefits
    - How to access covered services
    - Important limitations and exclusions`,
  },
  clinicalNotes: {
    title: 'Clinical Documentation',
    prompt: `Generate clinical documentation template with:
    - Chief complaint: {{ChiefComplaint}}
    - History of present illness
    - Review of systems
    - Physical examination findings
    - Assessment and plan
    - Follow-up instructions`,
  },
  providerCommunication: {
    title: 'Provider Communication',
    prompt: `Create a professional provider-to-provider communication template including:
    - Patient identification ({{PatientName}}, {{MRN}})
    - Reason for communication
    - Clinical summary
    - Requested action or consultation
    - Supporting documentation references
    - Contact information for questions`,
  },
  memberNotice: {
    title: 'Member Notice Letter',
    prompt: `Generate a member-friendly notice letter with:
    - Clear subject line
    - Action required (if any)
    - Important dates and deadlines
    - Step-by-step instructions
    - Resources for assistance
    - Contact information
    Use simple, non-medical language`,
  },
};
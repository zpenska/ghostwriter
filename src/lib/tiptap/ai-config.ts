// Healthcare-specific AI prompts for Ghostwriter
export const healthcarePrompts = [
  {
    label: 'Professional Tone',
    category: 'Tone',
    icon: '📝',
    description: 'Rewrite in professional clinical tone',
    prompt: 'Rewrite the following text in a professional clinical tone suitable for healthcare correspondence: {selectedText}'
  },
  {
    label: 'Patient-Friendly',
    category: 'Tone',
    icon: '👥',
    description: 'Simplify for patient understanding',
    prompt: 'Rewrite the following text to be easily understood by patients, avoiding medical jargon: {selectedText}'
  },
  {
    label: 'Add Empathy',
    category: 'Tone',
    icon: '💚',
    description: 'Add empathetic language',
    prompt: 'Add empathetic and compassionate language to the following text while maintaining professionalism: {selectedText}'
  },
  {
    label: 'HIPAA Review',
    category: 'Compliance',
    icon: '🔒',
    description: 'Check for HIPAA compliance',
    prompt: 'Review the following text for HIPAA compliance and identify any potential PHI that should be removed or generalized: {selectedText}'
  },
  {
    label: 'Regulatory Check',
    category: 'Compliance',
    icon: '📋',
    description: 'Check regulatory compliance',
    prompt: 'Review this text for healthcare regulatory compliance and suggest any necessary modifications: {selectedText}'
  },
  {
    label: 'Denial Explanation',
    category: 'Templates',
    icon: '❌',
    description: 'Generate denial explanation',
    prompt: 'Generate a clear and compliant explanation for a coverage denial based on: {selectedText}'
  },
  {
    label: 'Appeal Response',
    category: 'Templates',
    icon: '📨',
    description: 'Draft appeal response',
    prompt: 'Draft a professional response to an appeal regarding: {selectedText}'
  },
  {
    label: 'Prior Auth',
    category: 'Templates',
    icon: '✅',
    description: 'Prior authorization letter',
    prompt: 'Create a prior authorization approval letter for: {selectedText}'
  },
  {
    label: 'Summarize',
    category: 'Editing',
    icon: '📄',
    description: 'Create concise summary',
    prompt: 'Provide a concise summary of the following text: {selectedText}'
  },
  {
    label: 'Expand Details',
    category: 'Editing',
    icon: '➕',
    description: 'Add more detail',
    prompt: 'Expand on the following text with more relevant clinical details: {selectedText}'
  },
  {
    label: 'Fix Grammar',
    category: 'Editing',
    icon: '✏️',
    description: 'Correct grammar and spelling',
    prompt: 'Fix any grammar, spelling, or punctuation errors in: {selectedText}'
  },
  {
    label: 'Medical Accuracy',
    category: 'Review',
    icon: '🏥',
    description: 'Check medical accuracy',
    prompt: 'Review the following text for medical accuracy and suggest corrections if needed: {selectedText}'
  },
  {
    label: 'ICD-10 Codes',
    category: 'Coding',
    icon: '🔢',
    description: 'Suggest relevant ICD-10 codes',
    prompt: 'Suggest relevant ICD-10 codes for the conditions mentioned in: {selectedText}'
  },
  {
    label: 'CPT Codes',
    category: 'Coding',
    icon: '💉',
    description: 'Suggest relevant CPT codes',
    prompt: 'Suggest relevant CPT/HCPCS codes for the procedures mentioned in: {selectedText}'
  },
];
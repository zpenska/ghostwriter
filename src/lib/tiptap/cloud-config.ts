// src/lib/tiptap/cloud-config.ts
// TipTap Cloud Configuration with your actual credentials
export const TIPTAP_CLOUD_CONFIG = {
  // Document Server
  appId: process.env.TIPTAP_APP_ID || 'w9ne2v89',
  appSecret: process.env.TIPTAP_APP_SECRET || '05cff228724828845c69f7a6f6397397574acc89590f438aac87c6fe39a9d48d',
  
  // Document Management
  docManagementId: process.env.TIPTAP_DOC_MANAGEMENT_ID || '24964a9d372c048b1784a53a5f5b59de890a5069d41c3439359aa3062437963b',

  // Content AI
  aiAppId: process.env.TIPTAP_AI_APP_ID || 'e976rxjm',
  aiSecret: process.env.TIPTAP_AI_SECRET || 'GNVLBYqJiRsk3NZHPsjpAl9m0Fgeqgzcwj5L2uiSp1obHR64TjV6CrRJVRY6w5to',

  // Conversion (Import/Export)
  conversionAppId: process.env.TIPTAP_CONVERSION_APP_ID || 'e976rxjm',
  conversionSecret: process.env.TIPTAP_CONVERSION_SECRET || 'VgwMIjOaJItlLLEzoJMY5ePZbE0cllm1X34DXlJnGaKqIEqqzNVYP5ybZudfa7eF',

  // URLs
  baseUrl: 'https://cloud.tiptap.dev/',
  collaborationUrl: 'wss://cloud.tiptap.dev',
  apiUrl: 'https://api.tiptap.dev/v1',

  // Your webhook endpoint (if you have one)
  webhookUrl: process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/tiptap-webhook` 
    : '',
};

// Export individual configurations for easy access
export const DOCUMENT_CONFIG = {
  appId: TIPTAP_CLOUD_CONFIG.appId,
  secret: TIPTAP_CLOUD_CONFIG.appSecret,
  managementId: TIPTAP_CLOUD_CONFIG.docManagementId,
};

export const AI_CONFIG = {
  appId: TIPTAP_CLOUD_CONFIG.aiAppId,
  secret: TIPTAP_CLOUD_CONFIG.aiSecret,
};

export const CONVERSION_CONFIG = {
  appId: TIPTAP_CLOUD_CONFIG.conversionAppId,
  secret: TIPTAP_CLOUD_CONFIG.conversionSecret,
};
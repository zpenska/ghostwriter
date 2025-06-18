import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface EnhancedCasperVariable {
  key: string;
  name: string;
  description: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  group: string;
  healthcareCategory?: 'member' | 'claim' | 'provider' | 'diagnosis' | 'service' | 'authorization' | 'appeal' | 'payment';
  medicalCodeType?: 'icd10' | 'cpt' | 'hcpcs' | 'ndc' | 'loinc';
  required?: boolean;
  sensitive?: boolean; // PHI/PII indicator
  format?: string; // For dates, numbers, etc.
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  examples?: string[];
  complianceNotes?: string;
}

// Healthcare variable mappings based on your XSD schema
const healthcareVariableMappings: Record<string, Partial<EnhancedCasperVariable>> = {
  // Member Information
  'member.firstName': {
    healthcareCategory: 'member',
    sensitive: true,
    dataType: 'string',
    validation: { minLength: 1, maxLength: 50 },
    description: 'Member first name'
  },
  'member.lastName': {
    healthcareCategory: 'member',
    sensitive: true,
    dataType: 'string',
    validation: { minLength: 1, maxLength: 50 },
    description: 'Member last name'
  },
  'member.birthDate': {
    healthcareCategory: 'member',
    sensitive: true,
    dataType: 'date',
    format: 'YYYY-MM-DD',
    description: 'Member date of birth'
  },
  'member.id': {
    healthcareCategory: 'member',
    sensitive: true,
    dataType: 'string',
    description: 'Unique member identifier'
  },
  'member.genderAssignedAtBirthCode': {
    healthcareCategory: 'member',
    dataType: 'string',
    examples: ['M', 'F', 'U'],
    description: 'Gender assigned at birth code'
  },
  'member.preferredLanguageCode': {
    healthcareCategory: 'member',
    dataType: 'string',
    examples: ['en', 'es', 'fr'],
    complianceNotes: 'Required for language-specific communications',
    description: 'Member preferred language'
  },

  // Claim Information
  'claim.number': {
    healthcareCategory: 'claim',
    dataType: 'string',
    description: 'Unique claim identifier'
  },
  'claim.status': {
    healthcareCategory: 'claim',
    dataType: 'string',
    examples: ['APPROVED', 'DENIED', 'PENDING', 'UNDER_REVIEW'],
    complianceNotes: 'Triggers different compliance requirements',
    description: 'Current claim status'
  },
  'claim.totalAmount': {
    healthcareCategory: 'claim',
    dataType: 'number',
    format: 'currency',
    description: 'Total claim amount'
  },
  'claim.lines': {
    healthcareCategory: 'claim',
    dataType: 'array',
    description: 'Array of claim line items'
  },

  // Request Information
  'request.claimNumber': {
    healthcareCategory: 'authorization',
    dataType: 'string',
    description: 'Authorization request claim number'
  },
  'request.dispositionCode': {
    healthcareCategory: 'authorization',
    dataType: 'string',
    examples: ['APPROVED', 'DENIED', 'MODIFIED'],
    description: 'Authorization disposition code'
  },
  'request.dispositionDesc': {
    healthcareCategory: 'authorization',
    dataType: 'string',
    description: 'Authorization disposition description'
  },
  'request.dueDateTime': {
    healthcareCategory: 'authorization',
    dataType: 'date',
    format: 'YYYY-MM-DD HH:mm:ss',
    complianceNotes: 'Critical for appeal rights timelines',
    description: 'Authorization due date and time'
  },
  'request.urgencyCode': {
    healthcareCategory: 'authorization',
    dataType: 'string',
    examples: ['URGENT', 'STANDARD'],
    complianceNotes: 'Affects required response timeframes',
    description: 'Request urgency level'
  },

  // Diagnosis Information
  'diagnosis.code': {
    healthcareCategory: 'diagnosis',
    dataType: 'string',
    medicalCodeType: 'icd10',
    validation: { pattern: '^[A-Z][0-9]{2}(\\.[0-9X]{1,3})?$' },
    description: 'ICD-10 diagnosis code'
  },
  'diagnosis.description': {
    healthcareCategory: 'diagnosis',
    dataType: 'string',
    description: 'Diagnosis description'
  },
  'diagnosis.isPrimary': {
    healthcareCategory: 'diagnosis',
    dataType: 'boolean',
    description: 'Whether this is the primary diagnosis'
  },

  // Service Information
  'service.code': {
    healthcareCategory: 'service',
    dataType: 'string',
    medicalCodeType: 'cpt',
    validation: { pattern: '^[0-9]{5}$' },
    description: 'CPT service code'
  },
  'service.description': {
    healthcareCategory: 'service',
    dataType: 'string',
    description: 'Service description'
  },
  'service.amount': {
    healthcareCategory: 'service',
    dataType: 'number',
    format: 'currency',
    description: 'Service amount'
  },
  'service.units': {
    healthcareCategory: 'service',
    dataType: 'number',
    description: 'Number of service units'
  },

  // Provider Information
  'provider.firstName': {
    healthcareCategory: 'provider',
    dataType: 'string',
    description: 'Provider first name'
  },
  'provider.lastName': {
    healthcareCategory: 'provider',
    dataType: 'string',
    description: 'Provider last name'
  },
  'provider.npi': {
    healthcareCategory: 'provider',
    dataType: 'string',
    validation: { pattern: '^[0-9]{10}$' },
    description: 'National Provider Identifier'
  },
  'provider.organizationName': {
    healthcareCategory: 'provider',
    dataType: 'string',
    description: 'Provider organization name'
  },

  // Appeal Information
  'appeal.id': {
    healthcareCategory: 'appeal',
    dataType: 'string',
    description: 'Appeal identifier'
  },
  'appeal.levelCode': {
    healthcareCategory: 'appeal',
    dataType: 'string',
    examples: ['FIRST_LEVEL', 'SECOND_LEVEL', 'EXTERNAL_REVIEW'],
    description: 'Appeal level code'
  },
  'appeal.dueDateTime': {
    healthcareCategory: 'appeal',
    dataType: 'date',
    format: 'YYYY-MM-DD HH:mm:ss',
    complianceNotes: 'Critical for appeal submission deadlines',
    description: 'Appeal due date and time'
  },
  'appeal.statusCode': {
    healthcareCategory: 'appeal',
    dataType: 'string',
    examples: ['PENDING', 'UNDER_REVIEW', 'COMPLETED'],
    description: 'Appeal status code'
  },

  // Payment Information
  'payment.amount': {
    healthcareCategory: 'payment',
    dataType: 'number',
    format: 'currency',
    description: 'Payment amount'
  },
  'payment.statusCode': {
    healthcareCategory: 'payment',
    dataType: 'string',
    examples: ['PAID', 'DENIED', 'PENDING'],
    description: 'Payment status code'
  },

  // Additional healthcare variables
  'denialReason': {
    healthcareCategory: 'authorization',
    dataType: 'string',
    examples: ['Medical Necessity', 'Not Covered', 'Prior Authorization Required'],
    description: 'Reason for denial'
  },
  'urgencyCode': {
    healthcareCategory: 'authorization',
    dataType: 'string',
    examples: ['URGENT', 'STANDARD'],
    description: 'Urgency code for the request'
  },
  'decision': {
    healthcareCategory: 'authorization',
    dataType: 'string',
    examples: ['APPROVED', 'DENIED', 'ADVERSE'],
    description: 'Authorization decision'
  },
  'status': {
    healthcareCategory: 'claim',
    dataType: 'string',
    examples: ['APPROVED', 'DENIED', 'PENDING'],
    description: 'General status field'
  }
};

// Group variables by healthcare category
const healthcareGroups = {
  'Member Information': ['member', 'subscriber'],
  'Claim Details': ['claim', 'request'],
  'Medical Information': ['diagnosis', 'service', 'treatment'],
  'Provider Information': ['provider', 'facility'],
  'Authorization': ['authorization', 'preauth'],
  'Appeals': ['appeal', 'reconsideration'],
  'Payment': ['payment', 'billing'],
  'Compliance': ['compliance', 'regulatory']
};

/**
 * Enhanced variable context loader with healthcare categorization
 */
export async function getEnhancedCasperVariableContext(): Promise<EnhancedCasperVariable[]> {
  try {
    // First, try to get variables from Firestore
    const variablesRef = collection(db, 'variables');
    const variablesSnapshot = await getDocs(variablesRef);
    
    let variables: EnhancedCasperVariable[] = [];
    
    if (!variablesSnapshot.empty) {
      // Load from Firestore if available
      variables = variablesSnapshot.docs.map(doc => ({
        key: doc.id,
        ...doc.data()
      })) as EnhancedCasperVariable[];
    } else {
      // Generate from healthcare mappings if no Firestore data
      variables = generateHealthcareVariables();
    }

    // Enhance variables with healthcare metadata
    const enhancedVariables = variables.map(variable => {
      const mapping = healthcareVariableMappings[variable.key];
      const enhanced: EnhancedCasperVariable = {
        ...variable,
        ...mapping,
        // Determine group based on healthcare category
        group: determineVariableGroup(variable.key, variable.healthcareCategory)
      };

      return enhanced;
    });

    // Sort by group, then by healthcare category, then alphabetically
    return enhancedVariables.sort((a, b) => {
      if (a.group !== b.group) {
        return a.group.localeCompare(b.group);
      }
      if (a.healthcareCategory && b.healthcareCategory && a.healthcareCategory !== b.healthcareCategory) {
        return a.healthcareCategory.localeCompare(b.healthcareCategory);
      }
      return a.name.localeCompare(b.name);
    });

  } catch (error) {
    console.error('Error loading enhanced variable context:', error);
    // Fallback to basic healthcare variables
    return generateHealthcareVariables();
  }
}

/**
 * Generate healthcare variables from XSD schema patterns
 */
function generateHealthcareVariables(): EnhancedCasperVariable[] {
  const variables: EnhancedCasperVariable[] = [];

  // Generate variables for each mapping
  Object.entries(healthcareVariableMappings).forEach(([key, mapping]) => {
    const nameParts = key.split('.');
    const name = nameParts[nameParts.length - 1];
    
    variables.push({
      key,
      name: formatVariableName(name),
      description: mapping.description || `${formatVariableName(name)} value`,
      dataType: mapping.dataType || 'string',
      group: determineVariableGroup(key, mapping.healthcareCategory),
      ...mapping
    });
  });

  return variables;
}

/**
 * Format variable name for display
 */
function formatVariableName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Determine variable group based on key and category
 */
function determineVariableGroup(key: string, category?: string): string {
  if (category) {
    for (const [groupName, categories] of Object.entries(healthcareGroups)) {
      if (categories.includes(category)) {
        return groupName;
      }
    }
  }

  // Fallback to key-based grouping
  const prefix = key.split('.')[0];
  for (const [groupName, categories] of Object.entries(healthcareGroups)) {
    if (categories.includes(prefix)) {
      return groupName;
    }
  }

  return 'Other';
}

/**
 * Get variables for a specific healthcare category
 */
export async function getVariablesByHealthcareCategory(
  category: string
): Promise<EnhancedCasperVariable[]> {
  const allVariables = await getEnhancedCasperVariableContext();
  return allVariables.filter(v => v.healthcareCategory === category);
}

/**
 * Get variables that are commonly used for specific logic types
 */
export async function getVariablesForLogicType(
  logicType: 'condition' | 'calculation' | 'repeater'
): Promise<EnhancedCasperVariable[]> {
  const allVariables = await getEnhancedCasperVariableContext();
  
  switch (logicType) {
    case 'condition':
      // Variables commonly used in conditions
      return allVariables.filter(v => 
        v.dataType === 'boolean' || 
        v.key.includes('status') || 
        v.key.includes('code') ||
        v.examples && v.examples.length > 0
      );
    
    case 'calculation':
      // Numeric variables for calculations
      return allVariables.filter(v => 
        v.dataType === 'number' || 
        v.format === 'currency' ||
        v.key.includes('amount') ||
        v.key.includes('cost') ||
        v.key.includes('units')
      );
    
    case 'repeater':
      // Array variables for loops
      return allVariables.filter(v => 
        v.dataType === 'array' ||
        v.key.includes('lines') ||
        v.key.includes('items') ||
        v.key.includes('services')
      );
    
    default:
      return allVariables;
  }
}

/**
 * Validate medical code format
 */
export function validateMedicalCode(code: string, codeType: string): boolean {
  const patterns = {
    icd10: /^[A-Z][0-9]{2}(\.[0-9X]{1,3})?$/,
    cpt: /^[0-9]{5}$/,
    hcpcs: /^[A-Z][0-9]{4}$/,
    ndc: /^[0-9]{4,5}-[0-9]{3,4}-[0-9]{1,2}$/,
    loinc: /^[0-9]{1,5}-[0-9]$/
  };

  const pattern = patterns[codeType as keyof typeof patterns];
  return pattern ? pattern.test(code) : false;
}

/**
 * Get compliance requirements for specific variables
 */
export function getVariableComplianceRequirements(
  variable: EnhancedCasperVariable
): string[] {
  const requirements: string[] = [];

  if (variable.sensitive) {
    requirements.push('PHI/PII protection required');
  }

  if (variable.healthcareCategory === 'claim' && variable.key.includes('status')) {
    requirements.push('Appeal rights notice may be required');
  }

  if (variable.medicalCodeType) {
    requirements.push(`${variable.medicalCodeType.toUpperCase()} code validation required`);
  }

  if (variable.complianceNotes) {
    requirements.push(variable.complianceNotes);
  }

  return requirements;
}
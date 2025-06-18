// src/lib/firebase/loaders/getCasperVariableContext.ts
import { CasperVariable } from '@/types/logic';

export async function getCasperVariableContext(): Promise<CasperVariable[]> {
  try {
    // In a real app, this would load from Firestore
    // For now, we'll provide fallback data directly
    return [
      {
        key: 'member.name',
        name: 'Member Name',
        description: 'Full name of the healthcare member',
        group: 'Member',
        dataType: 'string',
        required: true
      },
      {
        key: 'member.language',
        name: 'Member Language',
        description: 'Preferred language code (en, es, fr)',
        group: 'Member',
        dataType: 'string',
        defaultValue: 'en'
      },
      {
        key: 'member.age',
        name: 'Member Age',
        description: 'Age of the member in years',
        group: 'Member',
        dataType: 'number'
      },
      {
        key: 'member.dateOfBirth',
        name: 'Date of Birth',
        description: 'Member\'s date of birth',
        group: 'Member',
        dataType: 'date'
      },
      {
        key: 'claim.id',
        name: 'Claim ID',
        description: 'Unique identifier for the claim',
        group: 'Claim',
        dataType: 'string',
        required: true
      },
      {
        key: 'claim.status',
        name: 'Claim Status',
        description: 'Current status of the claim',
        group: 'Claim',
        dataType: 'string',
        enumValues: ['approved', 'denied', 'pending', 'processing']
      },
      {
        key: 'claim.lines',
        name: 'Claim Line Items',
        description: 'Array of individual claim line items',
        group: 'Claim',
        dataType: 'array'
      },
      {
        key: 'claim.totalAmount',
        name: 'Total Claim Amount',
        description: 'Total monetary amount of the claim',
        group: 'Claim',
        dataType: 'number'
      },
      {
        key: 'provider.name',
        name: 'Provider Name',
        description: 'Name of the healthcare provider',
        group: 'Provider',
        dataType: 'string'
      },
      {
        key: 'urgency',
        name: 'Urgency Flag',
        description: 'Whether this requires urgent processing',
        group: 'Processing',
        dataType: 'boolean',
        defaultValue: false
      }
    ];
  } catch (error) {
    console.error('Error loading Casper variable context:', error);
    
    // Minimal fallback data
    return [
      {
        key: 'member.name',
        name: 'Member Name',
        description: 'Full name of the healthcare member',
        group: 'Member',
        dataType: 'string',
        required: true
      },
      {
        key: 'member.language',
        name: 'Member Language',
        description: 'Preferred language code (en, es, fr)',
        group: 'Member',
        dataType: 'string',
        defaultValue: 'en'
      },
      {
        key: 'claim.status',
        name: 'Claim Status',
        description: 'Current status of the claim',
        group: 'Claim',
        dataType: 'string',
        enumValues: ['approved', 'denied', 'pending']
      }
    ];
  }
}

// src/lib/firebase/loaders/getBlockContext.ts
import { CasperBlock } from '@/types/logic';

export async function getBlockContext(): Promise<CasperBlock[]> {
  try {
    // In a real app, this would load from Firestore
    // For now, we'll provide fallback data directly
    return [
      {
        id: 'spanish-footer',
        name: 'Spanish Footer',
        category: 'Localization',
        description: 'Footer content in Spanish language',
        content: 'Para más información, visite nuestro sitio web o llame al servicio al cliente.'
      },
      {
        id: 'english-footer',
        name: 'English Footer',
        category: 'Localization',
        description: 'Footer content in English language',
        content: 'For more information, visit our website or call customer service.'
      },
      {
        id: 'appeal-rights-notice',
        name: 'Appeal Rights Notice',
        category: 'Legal',
        description: 'Information about member appeal rights',
        content: 'You have the right to appeal this decision within 60 days of receiving this notice.'
      },
      {
        id: 'under18-notice',
        name: 'Pediatric Notice',
        category: 'Special Populations',
        description: 'Special notice for members under 18',
        content: 'Special considerations apply for pediatric members. Please contact our pediatric care coordination team.'
      },
      {
        id: 'line-item-row',
        name: 'Service Line Item',
        category: 'Claims',
        description: 'Individual claim line item display',
        content: 'Service: {{service.name}} | Date: {{service.date}} | Amount: {{service.amount}}'
      },
      {
        id: 'approval-summary',
        name: 'Approval Summary',
        category: 'Claims',
        description: 'Summary of approved services',
        content: 'Your claim has been approved for the amount of {{claim.approvedAmount}}.'
      },
      {
        id: 'denial-reason',
        name: 'Denial Reason',
        category: 'Claims',
        description: 'Explanation for claim denial',
        content: 'This claim was denied for the following reason: {{claim.denialReason}}'
      }
    ];
  } catch (error) {
    console.error('Error loading block context:', error);
    
    // Minimal fallback data
    return [
      {
        id: 'spanish-footer',
        name: 'Spanish Footer',
        category: 'Localization',
        description: 'Footer content in Spanish language',
        content: 'Para más información, visite nuestro sitio web.'
      },
      {
        id: 'english-footer',
        name: 'English Footer',
        category: 'Localization',
        description: 'Footer content in English language',
        content: 'For more information, visit our website.'
      },
      {
        id: 'appeal-rights-notice',
        name: 'Appeal Rights Notice',
        category: 'Legal',
        description: 'Information about member appeal rights',
        content: 'You have the right to appeal this decision within 60 days.'
      }
    ];
  }
}

// src/lib/firebase/loaders/getTemplateData.ts
import { Template } from '@/types/logic';

export async function getTemplateData(templateId: string): Promise<Template | null> {
  try {
    // In a real app, this would load from Firestore
    console.log('Loading template data for:', templateId);
    
    // Mock template data for testing
    const mockTemplate: Template = {
      id: templateId,
      name: 'Healthcare Logic Template',
      description: 'Template for healthcare logic rules',
      category: 'Healthcare',
      usedVariables: [
        {
          key: 'member.name',
          name: 'Member Name',
          description: 'Full name of the healthcare member',
          group: 'Member',
          dataType: 'string',
          required: true
        },
        {
          key: 'member.language',
          name: 'Member Language',
          description: 'Preferred language code',
          group: 'Member',
          dataType: 'string'
        },
        {
          key: 'claim.status',
          name: 'Claim Status',
          description: 'Current status of the claim',
          group: 'Claim',
          dataType: 'string'
        }
      ],
      usedBlocks: [
        {
          id: 'spanish-footer',
          name: 'Spanish Footer',
          category: 'Localization',
          description: 'Footer content in Spanish'
        },
        {
          id: 'appeal-rights-notice',
          name: 'Appeal Rights Notice',
          category: 'Legal',
          description: 'Information about member appeal rights'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };

    return mockTemplate;
  } catch (error) {
    console.error('Error loading template data:', error);
    return null;
  }
}
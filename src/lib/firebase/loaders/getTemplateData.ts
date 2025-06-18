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
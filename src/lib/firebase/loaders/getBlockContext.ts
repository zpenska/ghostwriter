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
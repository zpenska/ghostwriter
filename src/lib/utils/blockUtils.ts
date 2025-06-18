// src/lib/utils/blockUtils.ts

// Type definitions
export interface BlockPosition {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    zIndex?: number;
  }
  
  export interface BlockPlacement {
    location: string;
    position: BlockPosition;
    containerClass: string;
    description: string;
  }
  
  export interface BlockValidation {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  }
  
  export interface VariableValidation {
    valid: string[];
    invalid: string[];
  }
  
  // Utility function to remove duplicates from array (TypeScript ES5 compatible)
  export const removeDuplicates = <T>(array: T[]): T[] => {
    return array.filter((item, index) => array.indexOf(item) === index);
  };
  
  // Block placement configurations
  export const BLOCK_PLACEMENTS: Record<string, BlockPlacement> = {
    'body': {
      location: 'body',
      position: { x: 0, y: 0 },
      containerClass: 'inline-block w-full',
      description: 'Inline content within document body'
    },
    'header-left': {
      location: 'header-left',
      position: { x: 0, y: 0 },
      containerClass: 'absolute top-0 left-0',
      description: 'Top left corner of document'
    },
    'header-center': {
      location: 'header-center',
      position: { x: 50, y: 0 },
      containerClass: 'absolute top-0 left-1/2 transform -translate-x-1/2',
      description: 'Top center of document'
    },
    'header-right': {
      location: 'header-right',
      position: { x: 100, y: 0 },
      containerClass: 'absolute top-0 right-0',
      description: 'Top right corner of document'
    },
    'footer-left': {
      location: 'footer-left',
      position: { x: 0, y: 100 },
      containerClass: 'absolute bottom-0 left-0',
      description: 'Bottom left corner of document'
    },
    'footer-center': {
      location: 'footer-center',
      position: { x: 50, y: 100 },
      containerClass: 'absolute bottom-0 left-1/2 transform -translate-x-1/2',
      description: 'Bottom center of document'
    },
    'footer-right': {
      location: 'footer-right',
      position: { x: 100, y: 100 },
      containerClass: 'absolute bottom-0 right-0',
      description: 'Bottom right corner of document'
    },
    'sidebar-left': {
      location: 'sidebar-left',
      position: { x: 0, y: 50 },
      containerClass: 'absolute left-0 top-1/2 transform -translate-y-1/2',
      description: 'Left side of document'
    },
    'sidebar-right': {
      location: 'sidebar-right',
      position: { x: 100, y: 50 },
      containerClass: 'absolute right-0 top-1/2 transform -translate-y-1/2',
      description: 'Right side of document'
    },
    'custom': {
      location: 'custom',
      position: { x: 0, y: 0 },
      containerClass: 'relative',
      description: 'User-defined placement'
    }
  };
  
  // Variable extraction utilities
  export const extractVariablesFromContent = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variableRegex) || [];
    const variables = matches.map(match => match.replace(/[{}]/g, '').trim());
    
    // Remove duplicates
    return removeDuplicates(variables);
  };
  
  export const validateVariables = (variables: string[], availableVariables: string[]): VariableValidation => {
    const valid: string[] = [];
    const invalid: string[] = [];
    
    variables.forEach(variable => {
      if (availableVariables.includes(variable)) {
        valid.push(variable);
      } else {
        invalid.push(variable);
      }
    });
    
    return { valid, invalid };
  };
  
  // Block content suggestions based on category and location
  export const getBlockContentSuggestions = (category: string, location: string): string[] => {
    const suggestions: Record<string, Record<string, string[]>> = {
      'header': {
        'header-left': [
          'Organization logo with {{plan_name}}',
          'Company letterhead with contact info',
          'Medical facility branding'
        ],
        'header-center': [
          'Centered company name and address',
          'Official healthcare plan header',
          'Professional letterhead design'
        ],
        'header-right': [
          'Contact information block',
          'Customer service details',
          'Date and reference information'
        ]
      },
      'footer': {
        'footer-left': [
          'Compliance statements',
          'Privacy notices',
          'Regulatory information'
        ],
        'footer-center': [
          'Company address and contact',
          'Website and social media',
          'Professional credentials'
        ],
        'footer-right': [
          'Appeal rights information',
          'Customer service contact',
          'TTY/TDD accessibility info'
        ]
      },
      'address': {
        'body': [
          'Member mailing address with {{member_name}}, {{member_address_line1}}',
          'Provider office address with {{provider_name}}, {{facility_name}}',
          'Return address with plan information'
        ]
      },
      'signature': {
        'body': [
          'Professional signature with {{reviewer_name}}',
          'Physician signature block with credentials',
          'Authorized representative signature'
        ]
      },
      'disclaimer': {
        'footer-center': [
          'HIPAA compliance and appeal rights',
          'Medical necessity determination language',
          'Privacy and confidentiality notices'
        ]
      }
    };
    
    return suggestions[category]?.[location] || [
      'Custom content for your specific needs',
      'Professional healthcare communication',
      'Compliant medical correspondence'
    ];
  };
  
  // Block validation utilities
  export const validateBlockContent = (content: string): BlockValidation => {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check for common issues
    if (content.length < 10) {
      warnings.push('Block content is very short');
      suggestions.push('Consider adding more descriptive content');
    }
    
    if (content.length > 5000) {
      warnings.push('Block content is very long');
      suggestions.push('Consider breaking into smaller, more focused blocks');
    }
    
    // Check for unmatched braces (broken variables)
    const unmatchedBraces = content.match(/\{[^}]*$|\}[^{]*\{/g);
    if (unmatchedBraces) {
      warnings.push('Unmatched braces detected - check variable syntax');
      suggestions.push('Ensure all variables use {{variable_name}} format');
    }
    
    // Check for HTML issues
    const htmlTags = content.match(/<[^>]*>/g) || [];
    const openTags: string[] = [];
    const closedTags: string[] = [];
    
    htmlTags.forEach(tag => {
      if (tag.startsWith('</')) {
        closedTags.push(tag.replace('</', '').replace('>', ''));
      } else if (!tag.endsWith('/>')) {
        const tagName = tag.replace('<', '').replace('>', '').split(' ')[0];
        openTags.push(tagName);
      }
    });
    
    const unclosedTags = openTags.filter(tag => !closedTags.includes(tag));
    if (unclosedTags.length > 0) {
      warnings.push(`Unclosed HTML tags: ${unclosedTags.join(', ')}`);
      suggestions.push('Ensure all HTML tags are properly closed');
    }
    
    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  };
  
  // Block template generation
  export const generateBlockTemplate = (category: string, location: string, variables: string[]): string => {
    const templates: Record<string, Record<string, string>> = {
      'header': {
        'header-left': `
          <div class="letterhead-logo">
            <img src="/logo-placeholder.png" alt="{{plan_name}} Logo" class="h-16 w-auto">
            <div class="mt-2">
              <h1 class="text-lg font-bold text-gray-900">{{plan_name}}</h1>
              <p class="text-sm text-gray-600">{{appeals_address}}</p>
            </div>
          </div>
        `,
        'header-center': `
          <div class="text-center letterhead-header">
            <h1 class="text-xl font-bold text-gray-900">{{plan_name}}</h1>
            <p class="text-sm text-gray-600 mt-1">{{appeals_address}}</p>
            <p class="text-sm text-gray-600">Phone: {{customer_service_phone}} | TTY: 711</p>
          </div>
        `,
        'header-right': `
          <div class="text-right contact-info">
            <p class="text-sm font-semibold">Customer Service</p>
            <p class="text-sm">{{customer_service_phone}}</p>
            <p class="text-sm">TTY: 711</p>
            <p class="text-sm mt-2">{{current_date}}</p>
          </div>
        `
      },
      'footer': {
        'footer-center': `
          <div class="text-center text-xs text-gray-600 mt-8 pt-4 border-t border-gray-300">
            <p class="mb-2">
              <strong>{{plan_name}}</strong><br>
              {{appeals_address}}
            </p>
            <p class="mb-2">
              Customer Service: {{customer_service_phone}} | Appeals: {{appeals_phone}} | Fax: {{appeals_fax}}
            </p>
            <p class="text-xs">
              This review is a medical necessity determination only. Benefits are subject to eligibility 
              at the time of service and benefit limitations. For appeal rights, see enclosed documentation.
            </p>
          </div>
        `
      },
      'address': {
        'body': `
          <div class="recipient-address mb-4">
            <p class="font-semibold">{{member_name}}</p>
            <p>{{member_address_line1}}</p>
            {{#if member_address_line2}}<p>{{member_address_line2}}</p>{{/if}}
            <p>{{member_city}}, {{member_state}} {{member_zip}}</p>
          </div>
        `
      },
      'signature': {
        'body': `
          <div class="signature-block mt-6">
            <p class="mb-4">Sincerely,</p>
            <div class="mt-8">
              <p class="font-semibold">{{reviewer_name}}</p>
              <p class="text-sm text-gray-600">Medical Director</p>
              <p class="text-sm text-gray-600">{{plan_name}}</p>
              <p class="text-sm text-gray-600 mt-2">
                For questions, please call {{customer_service_phone}}
              </p>
            </div>
          </div>
        `
      },
      'disclaimer': {
        'footer-center': `
          <div class="disclaimer text-xs text-gray-600 mt-6 p-4 bg-gray-50 rounded">
            <p class="mb-2">
              <strong>IMPORTANT:</strong> This determination is based on medical necessity using nationally 
              accepted standards. This is not a guarantee of payment. Benefits are subject to eligibility 
              and benefit limitations.
            </p>
            <p class="mb-2">
              If you disagree with this determination, you have the right to request an appeal. 
              Appeals must be submitted within 90 days to: {{appeals_address}}
            </p>
            <p>
              For questions about this determination, please contact Customer Service at {{customer_service_phone}} 
              (TTY: 711), Monday through Friday, 9:00 AM to 5:00 PM EST.
            </p>
          </div>
        `
      }
    };
    
    const template = templates[category]?.[location] || `
      <div class="custom-block">
        <p>Custom {{category}} block content for {{location}} placement.</p>
        <p>Available variables: ${variables.map(v => `{{${v}}}`).join(', ')}</p>
      </div>
    `;
    
    return template.trim();
  };
  
  // Block positioning utilities for template editor
  export const calculateBlockPosition = (location: string, containerWidth: number, containerHeight: number): BlockPosition => {
    const placement = BLOCK_PLACEMENTS[location];
    if (!placement) return { x: 0, y: 0 };
    
    const x = (placement.position.x || 0) * containerWidth / 100;
    const y = (placement.position.y || 0) * containerHeight / 100;
    
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: placement.position.width,
      height: placement.position.height,
      zIndex: placement.position.zIndex || 1
    };
  };
  
  // Export for template insertion
  export const formatBlockForInsertion = (block: any, targetLocation?: string): {
    html: string;
    cssClass: string;
    position: BlockPosition;
  } => {
    const location = targetLocation || block.defaultLocation || 'body';
    const placement = BLOCK_PLACEMENTS[location];
    
    return {
      html: block.content,
      cssClass: placement.containerClass,
      position: placement.position
    };
  };
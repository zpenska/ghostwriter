export interface ComplianceRule {
    id: string;
    name: string;
    description: string;
    category: 'federal' | 'state' | 'internal' | 'best_practice';
    regulation?: string;
    triggerCondition: string;
    requiredActions: ComplianceAction[];
    blocking: boolean;
    autoFix?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    effectiveDate?: string;
    expirationDate?: string;
  }
  
  export interface ComplianceAction {
    type: 'insert_component' | 'require_field' | 'validation' | 'notification' | 'workflow';
    componentId?: string;
    fieldName?: string;
    validationRule?: string;
    message?: string;
    parameters?: Record<string, any>;
  }
  
  export interface ComplianceViolation {
    ruleId: string;
    ruleName: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
    autoFixAvailable: boolean;
  }
  
  /**
   * Healthcare Compliance Rules Database
   * Based on ERISA, ACA, CMS, and state regulations
   */
  export const healthcareComplianceRules: ComplianceRule[] = [
    // ERISA Section 503 - Appeal Rights
    {
      id: 'erisa_appeal_rights',
      name: 'ERISA Appeal Rights Notice',
      description: 'Required appeal rights notice for all adverse benefit determinations',
      category: 'federal',
      regulation: 'ERISA Section 503, 29 CFR 2560.503-1',
      triggerCondition: `
        {{claim.status}} === 'DENIED' || 
        {{decision}} === 'ADVERSE' || 
        {{dispositionCode}} === 'DENIED' ||
        {{request.dispositionCode}} === 'DENIED'
      `,
      requiredActions: [
        {
          type: 'insert_component',
          componentId: 'appeal-rights-notice',
          parameters: {
            includeExpeditedRights: true,
            includeExternalReview: true
          }
        }
      ],
      blocking: true,
      autoFix: "insertComponent('appeal-rights-notice')",
      priority: 'critical'
    },
  
    // Medical Necessity Determinations
    {
      id: 'medical_necessity_disclosure',
      name: 'Medical Necessity Disclosure',
      description: 'Required disclosure for medical necessity determinations',
      category: 'federal',
      regulation: 'CMS Guidelines, Medicare Advantage Requirements',
      triggerCondition: `
        {{denialReason}}.toLowerCase().includes('medical necessity') ||
        {{denialReason}}.toLowerCase().includes('not medically necessary') ||
        {{dispositionDesc}}.toLowerCase().includes('medical necessity')
      `,
      requiredActions: [
        {
          type: 'insert_component',
          componentId: 'medical-necessity-disclaimer'
        },
        {
          type: 'insert_component',
          componentId: 'cms-guidance',
          parameters: {
            serviceType: '{{service.type}}',
            criteriaUsed: true
          }
        }
      ],
      blocking: false,
      autoFix: "insertComponent('medical-necessity-disclaimer')",
      priority: 'high'
    },
  
    // Expedited Review Requirements
    {
      id: 'expedited_review_timelines',
      name: 'Expedited Review Timelines',
      description: 'Required expedited review information for urgent requests',
      category: 'federal',
      regulation: 'ERISA Expedited Review Requirements, 29 CFR 2560.503-1(f)(2)',
      triggerCondition: `
        {{urgencyCode}} === 'URGENT' || 
        {{expedited}} === true ||
        {{request.urgencyCode}} === 'URGENT'
      `,
      requiredActions: [
        {
          type: 'insert_component',
          componentId: 'expedited-review-timelines',
          parameters: {
            includeBusinessDayRequirement: true,
            include72HourRule: true
          }
        }
      ],
      blocking: true,
      autoFix: "insertComponent('expedited-review-timelines')",
      priority: 'critical'
    },
  
    // Peer-to-Peer Review Information
    {
      id: 'peer_to_peer_info',
      name: 'Peer-to-Peer Review Information',
      description: 'Information about peer-to-peer review availability',
      category: 'best_practice',
      regulation: 'Industry Best Practice',
      triggerCondition: `
        ({{requestType}} === 'PRIOR_AUTH' || {{requestType}} === 'CONCURRENT_REVIEW') &&
        {{status}} === 'DENIED' &&
        {{provider.type}} === 'PHYSICIAN'
      `,
      requiredActions: [
        {
          type: 'insert_component',
          componentId: 'peer-to-peer-info',
          parameters: {
            timeLimit: '7 calendar days',
            phoneNumber: '{{peerToPeerPhone}}'
          }
        }
      ],
      blocking: false,
      autoFix: "insertComponent('peer-to-peer-info')",
      priority: 'medium'
    },
  
    // Language Access Requirements
    {
      id: 'language_access',
      name: 'Language Access Requirements',
      description: 'Ensure appropriate language support for non-English speakers',
      category: 'federal',
      regulation: 'Section 1557 of the Affordable Care Act',
      triggerCondition: `
        {{member.preferredLanguageCode}} !== 'en' &&
        {{member.preferredLanguageCode}} !== null
      `,
      requiredActions: [
        {
          type: 'validation',
          validationRule: 'template_available_in_language',
          message: 'Template must be available in member preferred language'
        },
        {
          type: 'insert_component',
          componentId: 'interpreter-services-notice'
        }
      ],
      blocking: true,
      priority: 'high'
    },
  
    // Benefit Limitations Notice
    {
      id: 'benefit_limitations',
      name: 'Benefit Limitations Notice',
      description: 'Required notice about benefit limitations and exclusions',
      category: 'internal',
      regulation: 'Internal Policy',
      triggerCondition: `
        {{claim.status}} === 'APPROVED' ||
        {{dispositionCode}} === 'APPROVED'
      `,
      requiredActions: [
        {
          type: 'insert_component',
          componentId: 'benefit-limitations-notice'
        }
      ],
      blocking: false,
      priority: 'low'
    },
  
    // Provider Network Notice
    {
      id: 'provider_network_notice',
      name: 'Provider Network Notice',
      description: 'Notice about in-network vs out-of-network providers',
      category: 'internal',
      regulation: 'Network Adequacy Requirements',
      triggerCondition: `
        {{provider.networkStatus}} === 'OUT_OF_NETWORK' ||
        {{denialReason}}.toLowerCase().includes('out of network')
      `,
      requiredActions: [
        {
          type: 'insert_component',
          componentId: 'provider-network-notice',
          parameters: {
            includeNetworkDirectory: true,
            includeProviderSearch: true
          }
        }
      ],
      blocking: false,
      priority: 'medium'
    },
  
    // External Review Rights
    {
      id: 'external_review_rights',
      name: 'External Review Rights',
      description: 'Information about external review process',
      category: 'federal',
      regulation: 'Section 2719 of the Public Health Service Act',
      triggerCondition: `
        {{appeal.levelCode}} === 'FINAL' ||
        {{finalDenial}} === true
      `,
      requiredActions: [
        {
          type: 'insert_component',
          componentId: 'external-review-notice',
          parameters: {
            includeStateContact: true,
            includeFederalContact: true
          }
        }
      ],
      blocking: true,
      autoFix: "insertComponent('external-review-notice')",
      priority: 'critical'
    },
  
    // Prescription Drug Coverage
    {
      id: 'prescription_drug_coverage',
      name: 'Prescription Drug Coverage Notice',
      description: 'Special requirements for prescription drug denials',
      category: 'federal',
      regulation: 'Medicare Part D Requirements',
      triggerCondition: `
        {{service.type}} === 'PRESCRIPTION' ||
        {{service.category}} === 'PHARMACY' ||
        {{service.code}}.match(/^J[0-9]{4}$/)
      `,
      requiredActions: [
        {
          type: 'insert_component',
          componentId: 'prescription-drug-notice',
          parameters: {
            includeFormularyInfo: true,
            includeCoverageGap: true
          }
        }
      ],
      blocking: false,
      priority: 'medium'
    },
  
    // Mental Health Parity
    {
      id: 'mental_health_parity',
      name: 'Mental Health Parity Notice',
      description: 'Ensure parity requirements for mental health services',
      category: 'federal',
      regulation: 'Mental Health Parity and Addiction Equity Act',
      triggerCondition: `
        {{diagnosis.code}}.match(/^F[0-9]{2}/) ||
        {{service.type}} === 'MENTAL_HEALTH' ||
        {{service.type}} === 'SUBSTANCE_ABUSE'
      `,
      requiredActions: [
        {
          type: 'validation',
          validationRule: 'mental_health_parity_check',
          message: 'Mental health benefits must be equivalent to medical/surgical benefits'
        }
      ],
      blocking: false,
      priority: 'high'
    },
  
    // Emergency Services
    {
      id: 'emergency_services_notice',
      name: 'Emergency Services Notice',
      description: 'Special protections for emergency services',
      category: 'federal',
      regulation: 'No Surprises Act, Emergency Medical Treatment and Labor Act',
      triggerCondition: `
        {{service.type}} === 'EMERGENCY' ||
        {{placeOfServiceCode}} === '23' ||
        {{diagnosis.code}}.match(/^(S|T)[0-9]{2}/)
      `,
      requiredActions: [
        {
          type: 'insert_component',
          componentId: 'emergency-services-notice',
          parameters: {
            includeNoSurprisesAct: true,
            includeBalanceBilling: true
          }
        }
      ],
      blocking: false,
      priority: 'high'
    }
  ];
  
  /**
   * Compliance Rules Engine
   */
  export class ComplianceRulesEngine {
    private rules: ComplianceRule[];
  
    constructor(customRules?: ComplianceRule[]) {
      this.rules = [...healthcareComplianceRules, ...(customRules || [])];
    }
  
    /**
     * Evaluate template data against all applicable compliance rules
     */
    evaluateCompliance(templateData: Record<string, any>): ComplianceViolation[] {
      const violations: ComplianceViolation[] = [];
  
      for (const rule of this.rules) {
        try {
          if (this.evaluateCondition(rule.triggerCondition, templateData)) {
            const violation = this.checkRuleCompliance(rule, templateData);
            if (violation) {
              violations.push(violation);
            }
          }
        } catch (error) {
          console.error(`Error evaluating rule ${rule.id}:`, error);
        }
      }
  
      return violations.sort((a, b) => {
        const severityOrder = { error: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    }
  
    /**
     * Get all rules that would be triggered by the given data
     */
    getTriggeredRules(templateData: Record<string, any>): ComplianceRule[] {
      return this.rules.filter(rule => {
        try {
          return this.evaluateCondition(rule.triggerCondition, templateData);
        } catch (error) {
          console.error(`Error evaluating condition for rule ${rule.id}:`, error);
          return false;
        }
      });
    }
  
    /**
     * Get rules filtered by category
     */
    getRulesByCategory(category: string): ComplianceRule[] {
      return this.rules.filter(rule => rule.category === category);
    }
  
    /**
     * Get blocking rules (rules that prevent template from being used)
     */
    getBlockingRules(): ComplianceRule[] {
      return this.rules.filter(rule => rule.blocking);
    }
  
    /**
     * Check if template data complies with a specific rule
     */
    private checkRuleCompliance(rule: ComplianceRule, templateData: Record<string, any>): ComplianceViolation | null {
      // For now, we assume the rule is violated if triggered
      // In a more sophisticated implementation, you would check if the required actions are present
      
      const severity = rule.blocking ? 'error' : (rule.priority === 'critical' ? 'error' : 'warning');
      
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        severity,
        message: `${rule.description}${rule.regulation ? ` (${rule.regulation})` : ''}`,
        suggestion: this.generateSuggestion(rule),
        autoFixAvailable: !!rule.autoFix
      };
    }
  
    /**
     * Generate suggestion text for compliance violation
     */
    private generateSuggestion(rule: ComplianceRule): string {
      const actions = rule.requiredActions.map(action => {
        switch (action.type) {
          case 'insert_component':
            return `Insert ${action.componentId} component`;
          case 'require_field':
            return `Ensure ${action.fieldName} field is present`;
          case 'validation':
            return `Validate ${action.validationRule}`;
          default:
            return action.message || 'Take required action';
        }
      });
  
      return actions.join(', ');
    }
  
    /**
     * Evaluate a condition string against template data
     */
    private evaluateCondition(condition: string, data: Record<string, any>): boolean {
      try {
        // Simple condition evaluation - replace variables and evaluate
        let evaluableCondition = condition.trim();
        
        // Replace variable references with actual values
        const variableRegex = /\{\{([^}]+)\}\}/g;
        evaluableCondition = evaluableCondition.replace(variableRegex, (match, variablePath) => {
          const value = this.getNestedValue(data, variablePath.trim());
          
          if (typeof value === 'string') {
            return `"${value}"`;
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
          } else if (value === null || value === undefined) {
            return 'null';
          } else {
            return JSON.stringify(value);
          }
        });
  
        // Replace JavaScript methods with safe equivalents
        evaluableCondition = evaluableCondition
          .replace(/\.includes\(/g, '.indexOf(') // Convert includes to indexOf for safety
          .replace(/\.toLowerCase\(\)/g, '.toLowerCase()');
  
        // Simple evaluation for basic conditions
        if (evaluableCondition.includes('===') || evaluableCondition.includes('!==')) {
          // Handle simple equality checks
          return this.evaluateSimpleCondition(evaluableCondition);
        }
  
        // For complex conditions, use Function constructor (safer than eval)
        const func = new Function('return ' + evaluableCondition);
        return Boolean(func());
      } catch (error) {
        console.error('Error evaluating condition:', condition, error);
        return false;
      }
    }
  
    /**
     * Evaluate simple conditions safely
     */
    private evaluateSimpleCondition(condition: string): boolean {
      try {
        // Handle OR conditions
        if (condition.includes('||')) {
          const parts = condition.split('||');
          return parts.some(part => this.evaluateSimpleCondition(part.trim()));
        }
  
        // Handle AND conditions
        if (condition.includes('&&')) {
          const parts = condition.split('&&');
          return parts.every(part => this.evaluateSimpleCondition(part.trim()));
        }
  
        // Handle simple equality
        if (condition.includes('===')) {
          const [left, right] = condition.split('===').map(s => s.trim());
          return this.normalizeValue(left) === this.normalizeValue(right);
        }
  
        if (condition.includes('!==')) {
          const [left, right] = condition.split('!==').map(s => s.trim());
          return this.normalizeValue(left) !== this.normalizeValue(right);
        }
  
        return false;
      } catch (error) {
        console.error('Error evaluating simple condition:', condition, error);
        return false;
      }
    }
  
    /**
     * Normalize values for comparison
     */
    private normalizeValue(value: string): any {
      value = value.trim();
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
      }
  
      // Handle null
      if (value === 'null') {
        return null;
      }
  
      // Handle boolean
      if (value === 'true') return true;
      if (value === 'false') return false;
  
      // Handle numbers
      if (!isNaN(Number(value))) {
        return Number(value);
      }
  
      return value;
    }
  
    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue(obj: any, path: string): any {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
      }, obj);
    }
  
    /**
     * Auto-fix compliance violations where possible
     */
    async autoFixViolations(violations: ComplianceViolation[], templateId: string): Promise<string[]> {
      const appliedFixes: string[] = [];
  
      for (const violation of violations) {
        if (violation.autoFixAvailable) {
          const rule = this.rules.find(r => r.id === violation.ruleId);
          if (rule?.autoFix) {
            try {
              // In a real implementation, you would apply the fix to the template
              // For now, we just log what would be done
              console.log(`Auto-fixing violation: ${violation.ruleName}`);
              console.log(`Fix: ${rule.autoFix}`);
              appliedFixes.push(`${violation.ruleName}: ${rule.autoFix}`);
            } catch (error) {
              console.error(`Error applying auto-fix for ${violation.ruleName}:`, error);
            }
          }
        }
      }
  
      return appliedFixes;
    }
  
    /**
     * Generate compliance report
     */
    generateComplianceReport(templateData: Record<string, any>): {
      compliant: boolean;
      violations: ComplianceViolation[];
      triggeredRules: ComplianceRule[];
      blockingViolations: ComplianceViolation[];
      summary: string;
    } {
      const violations = this.evaluateCompliance(templateData);
      const triggeredRules = this.getTriggeredRules(templateData);
      const blockingViolations = violations.filter(v => v.severity === 'error');
  
      const compliant = blockingViolations.length === 0;
      const totalViolations = violations.length;
      const warningsCount = violations.filter(v => v.severity === 'warning').length;
      const errorsCount = violations.filter(v => v.severity === 'error').length;
  
      let summary = `Compliance Check: ${compliant ? 'PASSED' : 'FAILED'}`;
      if (totalViolations > 0) {
        summary += ` (${errorsCount} errors, ${warningsCount} warnings)`;
      }
  
      return {
        compliant,
        violations,
        triggeredRules,
        blockingViolations,
        summary
      };
    }
  }
  
  /**
   * Default instance of the compliance rules engine
   */
  export const defaultComplianceEngine = new ComplianceRulesEngine();
  
  /**
   * Helper function to check template compliance
   */
  export function checkTemplateCompliance(templateData: Record<string, any>) {
    return defaultComplianceEngine.generateComplianceReport(templateData);
  }
  
  /**
   * Helper function to get healthcare-specific compliance rules
   */
  export function getHealthcareComplianceRules(): ComplianceRule[] {
    return healthcareComplianceRules.filter(rule => 
      rule.category === 'federal' || 
      rule.regulation?.includes('ERISA') ||
      rule.regulation?.includes('CMS')
    );
  }
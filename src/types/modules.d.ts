// src/types/modules.d.ts

declare module '@/data/templates.json' {
    interface TemplateData {
      templates: Array<{
        id: string;
        name: string;
        description: string;
        category: string;
        usedVariables: Array<{
          key: string;
          name: string;
          description: string;
          group?: string;
        }>;
        usedBlocks: Array<{
          id: string;
          name: string;
          category: string;
          description?: string;
        }>;
        createdAt: string;
        updatedAt: string;
        status: string;
      }>;
      globalVariables: Array<{
        key: string;
        name: string;
        description: string;
        group?: string;
        dataType?: string;
        required?: boolean;
        defaultValue?: any;
        enumValues?: string[];
      }>;
      globalBlocks: Array<{
        id: string;
        name: string;
        category: string;
        description?: string;
        content?: string;
      }>;
    }
  
    const data: TemplateData;
    export default data;
  }
// src/lib/services/template-service.ts
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    getDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  
  export interface Template {
    id?: string;
    name: string;
    description?: string;
    content: string; // HTML content from editor
    collectionId: string;
    collectionName: string;
    category: 'denial' | 'approval' | 'appeal' | 'prior-auth' | 'general';
    status: 'draft' | 'published' | 'archived';
    variables: string[]; // Array of variable keys used in template
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
    lastModifiedBy: string;
    version: number;
    tags: string[];
    isActive: boolean;
  }
  
  export interface TemplateCollection {
    id?: string;
    name: string;
    description?: string;
    color: string; // Hex color for UI
    icon: string; // Icon name for UI
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
    templateCount: number;
    isActive: boolean;
  }
  
  export class TemplateService {
    private templatesCollection = 'templates';
    private collectionsCollection = 'template-collections';
  
    // Collection Management
    async createCollection(collectionData: Omit<TemplateCollection, 'id' | 'createdAt' | 'updatedAt' | 'templateCount'>): Promise<string> {
      try {
        const docRef = await addDoc(collection(db, this.collectionsCollection), {
          ...collectionData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          templateCount: 0,
          isActive: collectionData.isActive ?? true // Default to true if not provided
        });
        
        console.log('✅ Collection created:', docRef.id);
        return docRef.id;
      } catch (error) {
        console.error('❌ Error creating collection:', error);
        throw error;
      }
    }
  
    async updateCollection(id: string, updates: Partial<TemplateCollection>): Promise<void> {
      try {
        const docRef = doc(db, this.collectionsCollection, id);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ Collection updated:', id);
      } catch (error) {
        console.error('❌ Error updating collection:', error);
        throw error;
      }
    }
  
    async getCollections(): Promise<TemplateCollection[]> {
      try {
        const q = query(
          collection(db, this.collectionsCollection),
          where('isActive', '==', true),
          orderBy('name')
        );
        
        const querySnapshot = await getDocs(q);
        const collections: TemplateCollection[] = [];
        
        querySnapshot.forEach((doc) => {
          collections.push({
            id: doc.id,
            ...doc.data()
          } as TemplateCollection);
        });
        
        console.log('✅ Collections loaded:', collections.length);
        return collections;
      } catch (error) {
        console.error('❌ Error loading collections:', error);
        throw error;
      }
    }
  
    async deleteCollection(id: string): Promise<void> {
      try {
        // Soft delete - mark as inactive
        const docRef = doc(db, this.collectionsCollection, id);
        await updateDoc(docRef, {
          isActive: false,
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ Collection deleted:', id);
      } catch (error) {
        console.error('❌ Error deleting collection:', error);
        throw error;
      }
    }
  
    // Template Management
    async saveTemplate(templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<string> {
      try {
        const docRef = await addDoc(collection(db, this.templatesCollection), {
          ...templateData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          version: 1,
          isActive: true
        });
        
        // Update collection template count
        await this.updateCollectionCount(templateData.collectionId);
        
        console.log('✅ Template saved:', docRef.id);
        return docRef.id;
      } catch (error) {
        console.error('❌ Error saving template:', error);
        throw error;
      }
    }
  
    async updateTemplate(id: string, updates: Partial<Template>, incrementVersion = true): Promise<void> {
      try {
        const docRef = doc(db, this.templatesCollection, id);
        
        // Get current version if incrementing
        let versionUpdate = {};
        if (incrementVersion) {
          const currentDoc = await getDoc(docRef);
          const currentVersion = currentDoc.data()?.version || 1;
          versionUpdate = { version: currentVersion + 1 };
        }
        
        await updateDoc(docRef, {
          ...updates,
          ...versionUpdate,
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ Template updated:', id);
      } catch (error) {
        console.error('❌ Error updating template:', error);
        throw error;
      }
    }
  
    async getTemplate(id: string): Promise<Template | null> {
      try {
        const docRef = doc(db, this.templatesCollection, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data()
          } as Template;
        }
        
        return null;
      } catch (error) {
        console.error('❌ Error loading template:', error);
        throw error;
      }
    }
  
    async getTemplatesByCollection(collectionId: string): Promise<Template[]> {
      try {
        const q = query(
          collection(db, this.templatesCollection),
          where('collectionId', '==', collectionId),
          where('isActive', '==', true),
          orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const templates: Template[] = [];
        
        querySnapshot.forEach((doc) => {
          templates.push({
            id: doc.id,
            ...doc.data()
          } as Template);
        });
        
        console.log('✅ Templates loaded for collection:', templates.length);
        return templates;
      } catch (error) {
        console.error('❌ Error loading templates:', error);
        throw error;
      }
    }
  
    async getAllTemplates(): Promise<Template[]> {
      try {
        const q = query(
          collection(db, this.templatesCollection),
          where('isActive', '==', true),
          orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const templates: Template[] = [];
        
        querySnapshot.forEach((doc) => {
          templates.push({
            id: doc.id,
            ...doc.data()
          } as Template);
        });
        
        console.log('✅ All templates loaded:', templates.length);
        return templates;
      } catch (error) {
        console.error('❌ Error loading all templates:', error);
        throw error;
      }
    }
  
    async deleteTemplate(id: string): Promise<void> {
      try {
        // Get template data first to update collection count
        const template = await this.getTemplate(id);
        
        // Soft delete - mark as inactive
        const docRef = doc(db, this.templatesCollection, id);
        await updateDoc(docRef, {
          isActive: false,
          updatedAt: serverTimestamp()
        });
        
        // Update collection template count
        if (template) {
          await this.updateCollectionCount(template.collectionId);
        }
        
        console.log('✅ Template deleted:', id);
      } catch (error) {
        console.error('❌ Error deleting template:', error);
        throw error;
      }
    }
  
    async duplicateTemplate(id: string, newName: string): Promise<string> {
      try {
        const originalTemplate = await this.getTemplate(id);
        if (!originalTemplate) {
          throw new Error('Template not found');
        }
        
        const duplicateData = {
          ...originalTemplate,
          name: newName,
          status: 'draft' as const
        };
        
        // Remove id and timestamp fields
        delete duplicateData.id;
        delete (duplicateData as any).createdAt;
        delete (duplicateData as any).updatedAt;
        delete (duplicateData as any).version;
        
        return await this.saveTemplate(duplicateData);
      } catch (error) {
        console.error('❌ Error duplicating template:', error);
        throw error;
      }
    }
  
    // Helper method to update collection template count
    private async updateCollectionCount(collectionId: string): Promise<void> {
      try {
        const templates = await this.getTemplatesByCollection(collectionId);
        const docRef = doc(db, this.collectionsCollection, collectionId);
        await updateDoc(docRef, {
          templateCount: templates.length,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('❌ Error updating collection count:', error);
      }
    }
  
    // Extract variables from template content
    extractVariables(content: string): string[] {
      const variableRegex = /\{\{([^}]+)\}\}/g;
      const variables: string[] = [];
      let match;
      
      while ((match = variableRegex.exec(content)) !== null) {
        const variable = match[1].trim();
        if (!variables.includes(variable)) {
          variables.push(variable);
        }
      }
      
      return variables;
    }
  
    // Search templates
    async searchTemplates(searchTerm: string, collectionId?: string): Promise<Template[]> {
      try {
        let q = query(
          collection(db, this.templatesCollection),
          where('isActive', '==', true)
        );
        
        if (collectionId) {
          q = query(q, where('collectionId', '==', collectionId));
        }
        
        const querySnapshot = await getDocs(q);
        const templates: Template[] = [];
        
        querySnapshot.forEach((doc) => {
          const template = {
            id: doc.id,
            ...doc.data()
          } as Template;
          
          // Simple text search in name, description, and content
          const searchLower = searchTerm.toLowerCase();
          if (
            template.name.toLowerCase().includes(searchLower) ||
            template.description?.toLowerCase().includes(searchLower) ||
            template.content.toLowerCase().includes(searchLower) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchLower))
          ) {
            templates.push(template);
          }
        });
        
        console.log('✅ Search completed:', templates.length, 'results');
        return templates;
      } catch (error) {
        console.error('❌ Error searching templates:', error);
        throw error;
      }
    }
  }
  
  // Export singleton instance
  export const templateService = new TemplateService();
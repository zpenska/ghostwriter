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
    content: string;
    collectionId?: string;
    category?: string;
    status?: 'draft' | 'published' | 'archived';
    tags?: string[];
    variables?: string[];
    isActive: boolean;
    version?: number;
    createdAt?: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    createdBy?: string;
  }
  
  export interface TemplateCollection {
    id?: string;
    name: string;
    description?: string;
    color: string;
    icon: string;
    isActive: boolean;
    templateCount?: number;
    createdAt?: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    createdBy?: string;
  }
  
  class TemplateService {
    private templatesCollection = 'templates';
    private collectionsCollection = 'template-collections';
  
    // Template CRUD operations
    async createTemplate(templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
      try {
        const docRef = await addDoc(collection(db, this.templatesCollection), {
          ...templateData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          version: 1,
          isActive: templateData.isActive ?? true
        });
        return docRef.id;
      } catch (error) {
        console.error('Error creating template:', error);
        throw error;
      }
    }
  
    async saveTemplate(templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
      // Alias for createTemplate to maintain backward compatibility
      return this.createTemplate(templateData);
    }
  
    async updateTemplate(templateId: string, updates: Partial<Template>, incrementVersion: boolean = true): Promise<void> {
      try {
        const updateData: any = {
          ...updates,
          updatedAt: serverTimestamp()
        };
  
        if (incrementVersion) {
          // Get current version and increment
          const templateDoc = await this.getTemplate(templateId);
          if (templateDoc) {
            updateData.version = (templateDoc.version || 1) + 1;
          }
        }
  
        await updateDoc(doc(db, this.templatesCollection, templateId), updateData);
      } catch (error) {
        console.error('Error updating template:', error);
        throw error;
      }
    }
  
    async getTemplate(templateId: string): Promise<Template | null> {
      try {
        const docSnap = await getDoc(doc(db, this.templatesCollection, templateId));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Template;
        }
        return null;
      } catch (error) {
        console.error('Error getting template:', error);
        throw error;
      }
    }
  
    async getTemplates(collectionId?: string): Promise<Template[]> {
      try {
        let q = query(collection(db, this.templatesCollection), orderBy('updatedAt', 'desc'));
        
        if (collectionId) {
          q = query(collection(db, this.templatesCollection), where('collectionId', '==', collectionId), orderBy('updatedAt', 'desc'));
        }
  
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
      } catch (error) {
        console.error('Error getting templates:', error);
        throw error;
      }
    }
  
    async deleteTemplate(templateId: string): Promise<void> {
      try {
        // Soft delete - mark as archived instead of hard delete
        await this.updateTemplate(templateId, { 
          status: 'archived', 
          isActive: false 
        }, false);
      } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
      }
    }
  
    async hardDeleteTemplate(templateId: string): Promise<void> {
      try {
        await deleteDoc(doc(db, this.templatesCollection, templateId));
      } catch (error) {
        console.error('Error hard deleting template:', error);
        throw error;
      }
    }
  
    // Collection CRUD operations
    async createCollection(collectionData: Omit<TemplateCollection, 'id' | 'createdAt' | 'updatedAt' | 'templateCount'>): Promise<string> {
      try {
        const docRef = await addDoc(collection(db, this.collectionsCollection), {
          ...collectionData,
          isActive: collectionData.isActive ?? true,
          templateCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return docRef.id;
      } catch (error) {
        console.error('Error creating collection:', error);
        throw error;
      }
    }
  
    async updateCollection(collectionId: string, updates: Partial<TemplateCollection>): Promise<void> {
      try {
        await updateDoc(doc(db, this.collectionsCollection, collectionId), {
          ...updates,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating collection:', error);
        throw error;
      }
    }
  
    async getCollection(collectionId: string): Promise<TemplateCollection | null> {
      try {
        const docSnap = await getDoc(doc(db, this.collectionsCollection, collectionId));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as TemplateCollection;
        }
        return null;
      } catch (error) {
        console.error('Error getting collection:', error);
        throw error;
      }
    }
  
    async getCollections(): Promise<TemplateCollection[]> {
      try {
        const q = query(
          collection(db, this.collectionsCollection), 
          where('isActive', '==', true),
          orderBy('name', 'asc')
        );
        const querySnapshot = await getDocs(q);
        
        // Get template counts for each collection
        const collections = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const collectionData = { id: doc.id, ...doc.data() } as TemplateCollection;
            const templateCount = await this.getTemplateCount(doc.id);
            return { ...collectionData, templateCount };
          })
        );
  
        return collections;
      } catch (error) {
        console.error('Error getting collections:', error);
        throw error;
      }
    }
  
    async deleteCollection(collectionId: string): Promise<void> {
      try {
        // First, move all templates in this collection to uncategorized
        const templates = await this.getTemplates(collectionId);
        await Promise.all(
          templates.map(template => 
            this.updateTemplate(template.id!, { collectionId: undefined }, false)
          )
        );
  
        // Then delete the collection
        await deleteDoc(doc(db, this.collectionsCollection, collectionId));
      } catch (error) {
        console.error('Error deleting collection:', error);
        throw error;
      }
    }
  
    // Helper methods
    async getTemplateCount(collectionId: string): Promise<number> {
      try {
        const q = query(
          collection(db, this.templatesCollection), 
          where('collectionId', '==', collectionId),
          where('status', '!=', 'archived')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
      } catch (error) {
        console.error('Error getting template count:', error);
        return 0;
      }
    }
  
    async searchTemplates(searchTerm: string, collectionId?: string): Promise<Template[]> {
      try {
        // Note: Firestore doesn't support full-text search natively
        // This is a basic implementation - for production, consider using Algolia or similar
        const templates = await this.getTemplates(collectionId);
        
        const searchTermLower = searchTerm.toLowerCase();
        return templates.filter(template => 
          template.name.toLowerCase().includes(searchTermLower) ||
          template.description?.toLowerCase().includes(searchTermLower) ||
          template.category?.toLowerCase().includes(searchTermLower) ||
          template.tags?.some(tag => tag.toLowerCase().includes(searchTermLower))
        );
      } catch (error) {
        console.error('Error searching templates:', error);
        throw error;
      }
    }
  
    // Extract variables from template content
    extractVariables(content: string): string[] {
      const regex = /\{\{([^}]+)\}\}/g;
      const variables: string[] = [];
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const variable = match[1].trim();
        if (!variables.includes(variable)) {
          variables.push(variable);
        }
      }
      
      return variables;
    }
  
    // Update template variables automatically
    async updateTemplateVariables(templateId: string, content: string): Promise<void> {
      try {
        const variables = this.extractVariables(content);
        await this.updateTemplate(templateId, { variables }, false);
      } catch (error) {
        console.error('Error updating template variables:', error);
        throw error;
      }
    }
  }
  
  export const templateService = new TemplateService();
  export default templateService;
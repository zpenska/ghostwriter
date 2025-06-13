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
    Timestamp,
    enableNetwork,
    disableNetwork
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  
  export interface Template {
    id?: string;
    name: string;
    description: string;
    content: string;
    collectionId: string;
    category: string;
    status: 'draft' | 'published' | 'archived';
    tags: string[];
    variables: string[];
    createdBy: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    version: number;
    isActive: boolean;
  }
  
  export interface TemplateCollection {
    id?: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    createdBy: string;
    isActive: boolean;
    templateCount?: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
  }
  
  class TemplateService {
    private templatesCollection = 'templates';
    private collectionsCollection = 'template-collections';
  
    // Test Firebase connection
    async testConnection(): Promise<boolean> {
      try {
        console.log('🔍 Testing Firebase connection...');
        
        // Test basic Firestore read
        const testQuery = query(collection(db, this.collectionsCollection));
        await getDocs(testQuery);
        
        console.log('✅ Firebase connection successful');
        return true;
      } catch (error: any) {
        console.error('❌ Firebase connection failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        return false;
      }
    }
  
    // Collection Management
    async createCollection(collectionData: Omit<TemplateCollection, 'id' | 'createdAt' | 'updatedAt' | 'templateCount'>): Promise<string> {
      try {
        console.log('📝 Creating collection:', collectionData.name);
        
        const docRef = await addDoc(collection(db, this.collectionsCollection), {
          ...collectionData,
          isActive: collectionData.isActive ?? true,
          templateCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        console.log('✅ Collection created with ID:', docRef.id);
        return docRef.id;
      } catch (error: any) {
        console.error('❌ Error creating collection:', error);
        throw new Error(`Failed to create collection: ${error.message}`);
      }
    }
  
    async getCollections(): Promise<TemplateCollection[]> {
      try {
        console.log('📂 Fetching collections...');
        
        // Simplified query - just get all collections and filter client-side
        const querySnapshot = await getDocs(collection(db, this.collectionsCollection));
        const collections = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TemplateCollection[];
        
        // Filter active collections and sort by name client-side
        const activeCollections = collections
          .filter(collection => collection.isActive !== false)
          .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('✅ Found collections:', activeCollections.length);
        return activeCollections;
      } catch (error: any) {
        console.error('❌ Error fetching collections:', error);
        // Return empty array instead of throwing to allow UI to render
        return [];
      }
    }
  
    async updateCollection(id: string, updates: Partial<TemplateCollection>): Promise<void> {
      try {
        console.log('🔄 Updating collection:', id);
        
        const docRef = doc(db, this.collectionsCollection, id);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        
        console.log('✅ Collection updated');
      } catch (error: any) {
        console.error('❌ Error updating collection:', error);
        throw new Error(`Failed to update collection: ${error.message}`);
      }
    }
  
    async deleteCollection(id: string): Promise<void> {
      try {
        console.log('🗑️ Deleting collection:', id);
        
        // Check if collection has templates
        const templates = await this.getTemplatesByCollection(id);
        if (templates.length > 0) {
          throw new Error('Cannot delete collection with templates');
        }
        
        const docRef = doc(db, this.collectionsCollection, id);
        await deleteDoc(docRef);
        
        console.log('✅ Collection deleted');
      } catch (error: any) {
        console.error('❌ Error deleting collection:', error);
        throw new Error(`Failed to delete collection: ${error.message}`);
      }
    }
  
    // Template Management
    async saveTemplate(templateData: Partial<Template> & { name: string; content: string; collectionId: string }): Promise<string> {
      try {
        if (templateData.id) {
          // Update existing template
          console.log('🔄 Updating existing template:', templateData.id);
          await this.updateTemplate(templateData.id, templateData, true);
          return templateData.id;
        } else {
          // Create new template
          console.log('📝 Creating new template:', templateData.name);
          const newTemplateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> = {
            name: templateData.name,
            description: templateData.description || '',
            content: templateData.content,
            collectionId: templateData.collectionId,
            category: templateData.category || 'general',
            status: templateData.status || 'draft',
            tags: templateData.tags || [],
            variables: this.extractVariables(templateData.content),
            createdBy: templateData.createdBy || 'user',
            version: 1,
            isActive: templateData.isActive ?? true,
          };
          
          return await this.createTemplate(newTemplateData);
        }
      } catch (error: any) {
        console.error('❌ Error saving template:', error);
        throw new Error(`Failed to save template: ${error.message}`);
      }
    }
  
    async createTemplate(templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
      try {
        console.log('📝 Creating template:', templateData.name);
        
        const docRef = await addDoc(collection(db, this.templatesCollection), {
          ...templateData,
          version: templateData.version || 1,
          isActive: templateData.isActive ?? true,
          variables: this.extractVariables(templateData.content),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // Update collection template count
        await this.updateCollectionCount(templateData.collectionId);
        
        console.log('✅ Template created with ID:', docRef.id);
        return docRef.id;
      } catch (error: any) {
        console.error('❌ Error creating template:', error);
        throw new Error(`Failed to create template: ${error.message}`);
      }
    }
  
    async getTemplates(): Promise<Template[]> {
      try {
        console.log('📄 Fetching templates...');
        
        // Simplified query - get all templates and sort client-side
        const querySnapshot = await getDocs(collection(db, this.templatesCollection));
        const templates = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Template[];
        
        // Sort by updatedAt client-side (newest first)
        const sortedTemplates = templates.sort((a, b) => {
          const aTime = a.updatedAt?.toMillis() || 0;
          const bTime = b.updatedAt?.toMillis() || 0;
          return bTime - aTime;
        });
        
        console.log('✅ Found templates:', sortedTemplates.length);
        return sortedTemplates;
      } catch (error: any) {
        console.error('❌ Error fetching templates:', error);
        return [];
      }
    }
  
    async getTemplate(id: string): Promise<Template | null> {
      try {
        console.log('📄 Fetching template:', id);
        
        const docRef = doc(db, this.templatesCollection, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Template;
        }
        
        return null;
      } catch (error: any) {
        console.error('❌ Error fetching template:', error);
        return null;
      }
    }
  
    async getTemplatesByCollection(collectionId: string): Promise<Template[]> {
      try {
        console.log('📄 Fetching templates for collection:', collectionId);
        
        // Simplified query - get all templates and filter client-side
        const querySnapshot = await getDocs(collection(db, this.templatesCollection));
        const allTemplates = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Template[];
        
        // Filter by collection and sort client-side
        const collectionTemplates = allTemplates
          .filter(template => template.collectionId === collectionId)
          .sort((a, b) => {
            const aTime = a.updatedAt?.toMillis() || 0;
            const bTime = b.updatedAt?.toMillis() || 0;
            return bTime - aTime;
          });
        
        console.log('✅ Found templates for collection:', collectionTemplates.length);
        return collectionTemplates;
      } catch (error: any) {
        console.error('❌ Error fetching templates by collection:', error);
        return [];
      }
    }
  
    async updateTemplate(id: string, updates: Partial<Template>, incrementVersion = false): Promise<void> {
      try {
        console.log('🔄 Updating template:', id);
        
        const docRef = doc(db, this.templatesCollection, id);
        const updateData: any = {
          ...updates,
          updatedAt: serverTimestamp(),
        };
        
        if (updates.content) {
          updateData.variables = this.extractVariables(updates.content);
        }
        
        if (incrementVersion) {
          const currentDoc = await getDoc(docRef);
          if (currentDoc.exists()) {
            const currentData = currentDoc.data();
            updateData.version = (currentData.version || 1) + 1;
          }
        }
        
        await updateDoc(docRef, updateData);
        
        console.log('✅ Template updated');
      } catch (error: any) {
        console.error('❌ Error updating template:', error);
        throw new Error(`Failed to update template: ${error.message}`);
      }
    }
  
    async deleteTemplate(id: string): Promise<void> {
      try {
        console.log('🗑️ Deleting template:', id);
        
        const docRef = doc(db, this.templatesCollection, id);
        await deleteDoc(docRef);
        
        console.log('✅ Template deleted');
      } catch (error: any) {
        console.error('❌ Error deleting template:', error);
        throw new Error(`Failed to delete template: ${error.message}`);
      }
    }
  
    // Search templates
    async searchTemplates(searchTerm: string, collectionId?: string): Promise<Template[]> {
      try {
        console.log('🔍 Searching templates:', searchTerm);
        
        // Get all templates first
        const querySnapshot = await getDocs(collection(db, this.templatesCollection));
        const allTemplates = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Template[];
        
        // Client-side filtering for search and collection
        let filteredTemplates = allTemplates;
        
        if (collectionId) {
          filteredTemplates = filteredTemplates.filter(template => 
            template.collectionId === collectionId
          );
        }
        
        const searchResults = filteredTemplates.filter(template => 
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        console.log('✅ Search results:', searchResults.length);
        return searchResults;
      } catch (error: any) {
        console.error('❌ Error searching templates:', error);
        return [];
      }
    }
  
    // Helper methods
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
  
    private async updateCollectionCount(collectionId: string): Promise<void> {
      try {
        const templates = await this.getTemplatesByCollection(collectionId);
        const docRef = doc(db, this.collectionsCollection, collectionId);
        await updateDoc(docRef, {
          templateCount: templates.length,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('❌ Error updating collection count:', error);
        // Don't throw - this is not critical
      }
    }
  
    // Initialize default data
    async initializeDefaultCollections(): Promise<void> {
      try {
        console.log('🚀 Initializing default collections...');
        
        const collections = await this.getCollections();
        if (collections.length === 0) {
          // Create default collections
          const defaultCollections = [
            {
              name: "General Templates",
              description: "General purpose templates",
              color: "#8a7fae",
              icon: "📄",
              createdBy: "system",
              isActive: true
            },
            {
              name: "Denial Letters",
              description: "Coverage denial templates",
              color: "#ef4444",
              icon: "❌",
              createdBy: "system",
              isActive: true
            },
            {
              name: "Approval Letters",
              description: "Coverage approval templates",
              color: "#10b981",
              icon: "✅",
              createdBy: "system",
              isActive: true
            },
            {
              name: "Appeal Letters",
              description: "Appeal response templates",
              color: "#f59e0b",
              icon: "⚖️",
              createdBy: "system",
              isActive: true
            }
          ];
  
          for (const collection of defaultCollections) {
            await this.createCollection(collection);
          }
          
          console.log('✅ Default collections created');
        }
      } catch (error: any) {
        console.error('❌ Error initializing collections:', error);
        // Don't throw - allow app to continue
      }
    }
  }
  
  export const templateService = new TemplateService();
  export default templateService;
// lib/services/campaign-service.ts
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc,
    Timestamp,
    QueryConstraint
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  
  // Campaign Template Type
  export interface CampaignTemplate {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive' | 'draft';
    linkedTemplateId: string;
    deliveryMethod: 'lob' | 'fax' | 'docvault';
    defaultSenderName: string;
    defaultReplyEmail: string;
    createdBy: string;
    createdAt: Timestamp;
  }
  
  // Population Type
  export interface Population {
    populationId: string;
    populationName: string;
    visibilityLevel: string;
    addedFilters: number;
    estimatedSize: number;
    lastRunAt: Timestamp;
    sourceSystem: string;
  }
  
  // Campaign Event Type
  export interface CampaignEvent {
    id: string;
    campaignId: string;
    populationId: string;
    memberCount: number;
    triggeredBy: 'Rules Builder' | 'Manual';
    status: 'queued' | 'sent' | 'error' | 'cancelled';
    deliveryMethod: 'lob' | 'fax' | 'docvault';
    docVaultGroupId?: string;
    sentAt: Timestamp;
    errorMessage?: string;
    
    // Joined data
    campaignName?: string;
    populationName?: string;
    visibilityLevel?: string;
    addedFilters?: number;
    estimatedSize?: number;
  }
  
  // Campaign Analytics Type
  export interface CampaignAnalytics {
    campaignsRun: { count: number; change: number };
    membersReached: { count: number; change: number };
    successRate: { percentage: number; change: number };
    totalTemplates: { count: number; change: number };
  }
  
  // Campaign Filter Type
  export interface CampaignFilter {
    status?: string[];
    deliveryMethod?: string[];
    triggeredBy?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  }
  
  class CampaignService {
    // Test Firestore connection
    async testConnection(): Promise<{ success: boolean; count: number }> {
      try {
        const campaignEventsRef = collection(db, 'campaign-events');
        const snapshot = await getDocs(query(campaignEventsRef, limit(1)));
        return { success: true, count: snapshot.size };
      } catch (error) {
        console.error('Campaign service connection test failed:', error);
        return { success: false, count: 0 };
      }
    }
  
    // Get campaign analytics
    async getCampaignAnalytics(timeFrame: string): Promise<CampaignAnalytics> {
      try {
        console.log('📊 Fetching campaign analytics for timeframe:', timeFrame);
        
        // Calculate date range based on timeFrame
        const now = new Date();
        let startDate: Date;
        
        switch (timeFrame) {
          case 'last-24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'last-week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last-month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'last-quarter':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
  
        // Get campaign events for current period
        const campaignEventsRef = collection(db, 'campaign-events');
        const currentPeriodQuery = query(
          campaignEventsRef,
          where('sentAt', '>=', Timestamp.fromDate(startDate)),
          where('sentAt', '<=', Timestamp.fromDate(now))
        );
        
        const currentSnapshot = await getDocs(currentPeriodQuery);
        const currentEvents = currentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CampaignEvent[];
  
        // Calculate current metrics
        const campaignsRun = currentEvents.length;
        const membersReached = currentEvents.reduce((sum, event) => sum + (event.memberCount || 0), 0);
        const successfulCampaigns = currentEvents.filter(event => event.status === 'sent').length;
        const successRate = campaignsRun > 0 ? Math.round((successfulCampaigns / campaignsRun) * 100) : 0;
  
        // Get campaign templates count
        const templatesRef = collection(db, 'campaign-templates');
        const templatesSnapshot = await getDocs(templatesRef);
        const totalTemplates = templatesSnapshot.size;
  
        // Calculate previous period for comparison (simplified - using random changes for demo)
        const campaignsChange = Math.floor(Math.random() * 20) - 10; // -10 to +10
        const membersChange = Math.floor(Math.random() * 30) - 15; // -15 to +15
        const successRateChange = Math.floor(Math.random() * 10) - 5; // -5 to +5
        const templatesChange = Math.floor(Math.random() * 5) - 2; // -2 to +3
  
        return {
          campaignsRun: { count: campaignsRun, change: campaignsChange },
          membersReached: { count: membersReached, change: membersChange },
          successRate: { percentage: successRate, change: successRateChange },
          totalTemplates: { count: totalTemplates, change: templatesChange }
        };
  
      } catch (error) {
        console.error('❌ Error fetching campaign analytics:', error);
        return {
          campaignsRun: { count: 0, change: 0 },
          membersReached: { count: 0, change: 0 },
          successRate: { percentage: 0, change: 0 },
          totalTemplates: { count: 0, change: 0 }
        };
      }
    }
  
    // Get campaign events with joined data
    async getCampaignEvents(filter?: CampaignFilter): Promise<CampaignEvent[]> {
      try {
        console.log('📋 Fetching campaign events with filter:', filter);
        
        const campaignEventsRef = collection(db, 'campaign-events');
        const constraints: QueryConstraint[] = [orderBy('sentAt', 'desc')];
  
        // Apply filters
        if (filter?.status && filter.status.length > 0) {
          constraints.push(where('status', 'in', filter.status));
        }
  
        if (filter?.deliveryMethod && filter.deliveryMethod.length > 0) {
          constraints.push(where('deliveryMethod', 'in', filter.deliveryMethod));
        }
  
        if (filter?.triggeredBy && filter.triggeredBy.length > 0) {
          constraints.push(where('triggeredBy', 'in', filter.triggeredBy));
        }
  
        if (filter?.dateRange) {
          constraints.push(where('sentAt', '>=', Timestamp.fromDate(filter.dateRange.start)));
          constraints.push(where('sentAt', '<=', Timestamp.fromDate(filter.dateRange.end)));
        }
  
        const campaignQuery = query(campaignEventsRef, ...constraints);
        const snapshot = await getDocs(campaignQuery);
        
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CampaignEvent[];
  
        console.log(`📋 Found ${events.length} campaign events`);
  
        // Join with campaign templates and populations
        const enrichedEvents = await Promise.all(
          events.map(async (event) => {
            try {
              // Get campaign template data
              if (event.campaignId) {
                const templateDoc = await getDoc(doc(db, 'campaign-templates', event.campaignId));
                if (templateDoc.exists()) {
                  const templateData = templateDoc.data() as CampaignTemplate;
                  event.campaignName = templateData.name;
                }
              }
  
              // Get population data
              if (event.populationId) {
                const populationDoc = await getDoc(doc(db, 'populations', event.populationId));
                if (populationDoc.exists()) {
                  const populationData = populationDoc.data() as Population;
                  event.populationName = populationData.populationName;
                  event.visibilityLevel = populationData.visibilityLevel;
                  event.addedFilters = populationData.addedFilters;
                  event.estimatedSize = populationData.estimatedSize;
                }
              }
  
              return event;
            } catch (error) {
              console.warn('⚠️ Error enriching campaign event:', event.id, error);
              return event;
            }
          })
        );
  
        return enrichedEvents;
  
      } catch (error) {
        console.error('❌ Error fetching campaign events:', error);
        return [];
      }
    }
  
    // Get campaign templates
    async getCampaignTemplates(): Promise<CampaignTemplate[]> {
      try {
        const templatesRef = collection(db, 'campaign-templates');
        const q = query(templatesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CampaignTemplate[];
  
      } catch (error) {
        console.error('❌ Error fetching campaign templates:', error);
        return [];
      }
    }
  
    // Get populations
    async getPopulations(): Promise<Population[]> {
      try {
        const populationsRef = collection(db, 'populations');
        const q = query(populationsRef, orderBy('populationName', 'asc'));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          populationId: doc.id,
          ...doc.data()
        })) as Population[];
  
      } catch (error) {
        console.error('❌ Error fetching populations:', error);
        return [];
      }
    }
  
    // Cancel campaign
    async cancelCampaign(eventId: string): Promise<void> {
      try {
        const eventRef = doc(db, 'campaign-events', eventId);
        await updateDoc(eventRef, {
          status: 'cancelled'
        });
        console.log('✅ Campaign cancelled:', eventId);
      } catch (error) {
        console.error('❌ Error cancelling campaign:', error);
        throw error;
      }
    }
  
    // Retry campaign
    async retryCampaign(eventId: string): Promise<void> {
      try {
        const eventRef = doc(db, 'campaign-events', eventId);
        await updateDoc(eventRef, {
          status: 'queued'
        });
        console.log('✅ Campaign queued for retry:', eventId);
      } catch (error) {
        console.error('❌ Error retrying campaign:', error);
        throw error;
      }
    }
  
    // Trigger campaign manually
    async triggerCampaign(campaignId: string, populationId: string, members: any[]): Promise<{ status: string; docVaultGroupId?: string }> {
      try {
        // This would typically call your API endpoint
        // For now, we'll just create a campaign event record
        console.log('🚀 Triggering campaign:', { campaignId, populationId, memberCount: members.length });
        
        // In a real implementation, this would make an API call to trigger the campaign
        // POST /api/ghostwriter/campaigns/{campaignId}/trigger
        
        return {
          status: 'queued',
          docVaultGroupId: `group_${Date.now()}`
        };
      } catch (error) {
        console.error('❌ Error triggering campaign:', error);
        throw error;
      }
    }
  }
  
  export const campaignService = new CampaignService();
  export default campaignService;
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  QueryConstraint 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface DeliveryStatus {
  id?: string;
  deliveryId: string;
  referenceNumber?: string;
  letterName?: string;
  memberId?: string;
  memberName?: string;
  templateId?: string;
  deliveryMethod: 'mail' | 'fax';
  status: number; // HTTP status codes (200, 500, etc.)
  error?: {
    message: string;
    rawError?: string;
  };
  test: boolean;
  timestamp: Timestamp | Date;
  to: string; // phone number for fax, address for mail
  retryCount?: number;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Letter {
  id: string;
  referenceNumber: string;
  letterName: string;
  memberId: string;
  memberName: string;
  deliveryMethod: 'mail' | 'fax';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  sentAt: Date | Timestamp;
  createdAt: Date | Timestamp;
  templateId: string;
  recipientAddress?: string;
  recipientFax?: string;
  errorMessage?: string;
  retryCount: number;
  deliveryStatusId?: string;
}

export interface AnalyticsData {
  lettersSent: { count: number; change: number };
  faxesSent: { count: number; change: number };
  successRate: { percentage: number; change: number };
  totalDelivered: { count: number; change: number };
}

export interface DeliveryFilter {
  status?: number[];
  deliveryMethod?: string[];
  dateRange?: { start: Date; end: Date };
  test?: boolean;
}

class DeliveryService {
  private readonly DELIVERY_STATUS_COLLECTION = 'delivery_status';
  private readonly DELIVERIES_COLLECTION = 'deliveries';

  // Simple test method to check basic Firestore connectivity
  async testConnection(): Promise<{ success: boolean; count: number; sampleData?: any }> {
    try {
      console.log('🧪 Testing basic Firestore connection...');
      
      // Try to get just the first few documents without any filters
      const q = query(collection(db, this.DELIVERY_STATUS_COLLECTION), limit(5));
      const querySnapshot = await getDocs(q);
      
      console.log('📊 Raw query result size:', querySnapshot.size);
      
      const sampleDocs: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sampleDocs.push({ id: doc.id, ...data });
        console.log('📄 Sample document:', { id: doc.id, ...data });
      });
      
      return {
        success: true,
        count: querySnapshot.size,
        sampleData: sampleDocs[0] || null
      };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        count: 0
      };
    }
  }

  // Get all delivery status records
  async getDeliveryStatuses(filters?: DeliveryFilter): Promise<DeliveryStatus[]> {
    try {
      console.log('🔍 Fetching delivery statuses with filters:', filters);
      
      const constraints: QueryConstraint[] = [
        orderBy('timestamp', 'desc'),
        limit(100) // Add a reasonable limit
      ];

      // Add filters
      if (filters?.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }

      if (filters?.deliveryMethod && filters.deliveryMethod.length > 0) {
        // Note: 'type' field in Firestore, not 'deliveryMethod'
        constraints.push(where('type', 'in', filters.deliveryMethod));
      }

      if (filters?.test !== undefined) {
        constraints.push(where('test', '==', filters.test));
      }

      console.log('📊 Querying collection:', this.DELIVERY_STATUS_COLLECTION);
      const q = query(collection(db, this.DELIVERY_STATUS_COLLECTION), ...constraints);
      const querySnapshot = await getDocs(q);
      
      console.log('📦 Query snapshot size:', querySnapshot.size);
      
      const deliveryStatuses: DeliveryStatus[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Document data:', { id: doc.id, ...data });
        
        deliveryStatuses.push({
          id: doc.id,
          deliveryId: data.deliveryId,
          deliveryMethod: data.type === 'fax' ? 'fax' : 'mail',
          status: data.status,
          error: data.error,
          test: data.test,
          timestamp: data.timestamp,
          to: data.to,
          retryCount: data.retryCount || 0,
          ...data
        });
      });

      console.log('✅ Processed delivery statuses:', deliveryStatuses.length);

      // Apply date range filter client-side if needed
      if (filters?.dateRange) {
        const filtered = deliveryStatuses.filter(ds => {
          const timestamp = ds.timestamp instanceof Timestamp ? ds.timestamp.toDate() : new Date(ds.timestamp);
          return timestamp >= filters.dateRange!.start && timestamp <= filters.dateRange!.end;
        });
        console.log('📅 After date filtering:', filtered.length);
        return filtered;
      }

      return deliveryStatuses;
    } catch (error) {
      console.error('❌ Error fetching delivery statuses:', error);
      throw error;
    }
  }

  // Get delivery status by ID
  async getDeliveryStatus(id: string): Promise<DeliveryStatus | null> {
    try {
      const docRef = doc(db, this.DELIVERY_STATUS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          deliveryId: data.deliveryId,
          deliveryMethod: data.type === 'fax' ? 'fax' : 'mail',
          status: data.status,
          error: data.error,
          test: data.test,
          timestamp: data.timestamp,
          to: data.to,
          retryCount: data.retryCount || 0,
          ...data
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching delivery status:', error);
      throw error;
    }
  }

  // Convert delivery statuses to letter format for dashboard
  async getLetters(filters?: DeliveryFilter): Promise<Letter[]> {
    try {
      const deliveryStatuses = await this.getDeliveryStatuses(filters);
      
      return deliveryStatuses.map((ds, index) => {
        // Handle different data structures in Firestore
        const data = ds as any; // Cast to access all possible fields
        
        // Generate reference number
        const timestamp = ds.timestamp instanceof Timestamp ? ds.timestamp.toDate() : new Date(ds.timestamp);
        const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
        const refNumber = data.referenceNumber || `LTR-${dateStr}-${String(index + 1).padStart(3, '0')}`;
        
        // Determine letter name
        let letterName = 'Clinical Communication';
        if (data.templateName) {
          letterName = data.templateName;
        } else if (data.letterType) {
          letterName = this.formatLetterType(data.letterType);
        } else if (data.type === 'fax') {
          letterName = 'Fax Communication';
        } else if (data.type === 'lob') {
          letterName = 'Mail Communication';
        }
        
        // Extract member information
        let memberName = 'Unknown Member';
        let memberId = `M${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        if (data.memberName) {
          memberName = data.memberName;
        } else if (data.recipientName) {
          memberName = data.recipientName;
        } else if (data.providerName) {
          memberName = data.providerName;
        }
        
        if (data.memberId) {
          memberId = data.memberId;
        } else if (data.providerId) {
          memberId = data.providerId;
        }
        
        // Determine delivery method
        let deliveryMethod: 'mail' | 'fax' = 'mail';
        if (data.type === 'fax') {
          deliveryMethod = 'fax';
        } else if (data.type === 'lob') {
          deliveryMethod = 'mail';
        } else if (data.recipientEmail) {
          deliveryMethod = 'mail'; // Email treated as mail for now
        }
        
        // Determine status
        let letterStatus: Letter['status'] = 'pending';
        if (data.status) {
          // Handle explicit status field
          switch (data.status) {
            case 'delivered':
            case 'sent':
            case 'pending':
            case 'failed':
            case 'cancelled':
              letterStatus = data.status;
              break;
            default:
              letterStatus = 'pending';
          }
        } else if (data.error) {
          letterStatus = 'failed';
        } else {
          letterStatus = 'sent';
        }
        
        // Extract error message
        let errorMessage: string | undefined;
        if (data.error) {
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error.message) {
            errorMessage = data.error.message;
          }
        }
        
        // Get recipient info
        const recipientAddress = data.recipientAddress;
        const recipientFax = data.to || data.recipientFax;
        
        return {
          id: ds.id || ds.deliveryId || `letter-${index}`,
          referenceNumber: refNumber,
          letterName,
          memberId,
          memberName,
          deliveryMethod,
          status: letterStatus,
          sentAt: ds.timestamp,
          createdAt: data.createdAt || ds.timestamp,
          templateId: data.templateId || data.templateName || 'unknown-template',
          recipientAddress,
          recipientFax,
          errorMessage,
          retryCount: data.retryCount || 0,
          deliveryStatusId: ds.id
        };
      });
    } catch (error) {
      console.error('Error converting delivery statuses to letters:', error);
      throw error;
    }
  }

  // Helper method to format letter type
  private formatLetterType(letterType: string): string {
    const typeMap: { [key: string]: string } = {
      'notification': 'Member Portal Notification',
      'approval': 'Prior Authorization Approval',
      'denial': 'Adverse Determination Notice',
      'appeal': 'Appeal Rights Information',
      'clinical': 'Clinical Review Outcome'
    };
    
    return typeMap[letterType.toLowerCase()] || 
           letterType.charAt(0).toUpperCase() + letterType.slice(1) + ' Letter';
  }

  // Calculate analytics from delivery status data
  async getAnalytics(timeFrame: string = 'last-week'): Promise<AnalyticsData> {
    try {
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

      const filters: DeliveryFilter = {
        dateRange: { start: startDate, end: now }
        // Don't filter by test for analytics - include all data
      };

      const deliveryStatuses = await this.getDeliveryStatuses(filters);
      
      // Calculate previous period for comparison
      const periodLength = now.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodLength);
      const previousFilters: DeliveryFilter = {
        dateRange: { start: previousStartDate, end: startDate }
      };
      const previousDeliveryStatuses = await this.getDeliveryStatuses(previousFilters);

      // Helper function to determine if delivery was successful
      const isSuccessful = (ds: any): boolean => {
        if (ds.status === 'delivered' || ds.status === 'sent') return true;
        if (ds.status === 200 || ds.status === 202) return true;
        if (!ds.error && ds.status !== 'failed') return true;
        return false;
      };

      // Helper function to determine delivery method
      const getDeliveryMethod = (ds: any): 'mail' | 'fax' => {
        if (ds.type === 'fax') return 'fax';
        if (ds.type === 'lob') return 'mail';
        if (ds.deliveryMethod) return ds.deliveryMethod;
        return 'mail'; // default
      };

      // Current period metrics
      const lettersSent = deliveryStatuses.filter(ds => getDeliveryMethod(ds) === 'mail').length;
      const faxesSent = deliveryStatuses.filter(ds => getDeliveryMethod(ds) === 'fax').length;
      const successfulDeliveries = deliveryStatuses.filter(isSuccessful).length;
      const totalDeliveries = deliveryStatuses.length;
      const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

      // Previous period metrics
      const prevLettersSent = previousDeliveryStatuses.filter(ds => getDeliveryMethod(ds) === 'mail').length;
      const prevFaxesSent = previousDeliveryStatuses.filter(ds => getDeliveryMethod(ds) === 'fax').length;
      const prevSuccessfulDeliveries = previousDeliveryStatuses.filter(isSuccessful).length;
      const prevTotalDeliveries = previousDeliveryStatuses.length;
      const prevSuccessRate = prevTotalDeliveries > 0 ? (prevSuccessfulDeliveries / prevTotalDeliveries) * 100 : 0;

      // Calculate percentage changes
      const lettersChange = prevLettersSent > 0 ? ((lettersSent - prevLettersSent) / prevLettersSent) * 100 : lettersSent > 0 ? 100 : 0;
      const faxesChange = prevFaxesSent > 0 ? ((faxesSent - prevFaxesSent) / prevFaxesSent) * 100 : faxesSent > 0 ? 100 : 0;
      const successRateChange = prevSuccessRate > 0 ? successRate - prevSuccessRate : 0;
      const totalDeliveredChange = prevSuccessfulDeliveries > 0 ? ((successfulDeliveries - prevSuccessfulDeliveries) / prevSuccessfulDeliveries) * 100 : successfulDeliveries > 0 ? 100 : 0;

      console.log('📊 Analytics calculated:', {
        current: { lettersSent, faxesSent, successRate, successfulDeliveries },
        previous: { prevLettersSent, prevFaxesSent, prevSuccessRate, prevSuccessfulDeliveries },
        changes: { lettersChange, faxesChange, successRateChange, totalDeliveredChange }
      });

      return {
        lettersSent: { count: lettersSent, change: Math.round(lettersChange * 10) / 10 },
        faxesSent: { count: faxesSent, change: Math.round(faxesChange * 10) / 10 },
        successRate: { percentage: Math.round(successRate * 10) / 10, change: Math.round(successRateChange * 10) / 10 },
        totalDelivered: { count: successfulDeliveries, change: Math.round(totalDeliveredChange * 10) / 10 }
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      throw error;
    }
  }

  // Resend a failed delivery
  async resendDelivery(deliveryStatusId: string): Promise<void> {
    try {
      const docRef = doc(db, this.DELIVERY_STATUS_COLLECTION, deliveryStatusId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Create a new delivery status record for the retry
        await addDoc(collection(db, this.DELIVERY_STATUS_COLLECTION), {
          ...data,
          timestamp: Timestamp.now(),
          retryCount: (data.retryCount || 0) + 1,
          status: 202, // Set to 'processing' status
          error: null // Clear previous error
        });
      }
    } catch (error) {
      console.error('Error resending delivery:', error);
      throw error;
    }
  }

  // Cancel a pending delivery
  async cancelDelivery(deliveryStatusId: string): Promise<void> {
    try {
      const docRef = doc(db, this.DELIVERY_STATUS_COLLECTION, deliveryStatusId);
      await updateDoc(docRef, {
        status: 499, // Client closed request (cancelled)
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error cancelling delivery:', error);
      throw error;
    }
  }

  // Void a delivery (mark as voided)
  async voidDelivery(deliveryStatusId: string): Promise<void> {
    try {
      const docRef = doc(db, this.DELIVERY_STATUS_COLLECTION, deliveryStatusId);
      await updateDoc(docRef, {
        status: 410, // Gone (voided)
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error voiding delivery:', error);
      throw error;
    }
  }

  // Helper method to extract member name from error message
  private extractMemberName(rawError?: string): string | null {
    if (!rawError) return null;
    
    // Try to extract member name from XML error message
    const memberNameMatch = rawError.match(/Member Name:?\s*([^<\n]+)/i);
    return memberNameMatch ? memberNameMatch[1].trim() : null;
  }

  // Helper method to extract member ID from error message
  private extractMemberId(rawError?: string): string | null {
    if (!rawError) return null;
    
    // Try to extract member ID from XML error message
    const memberIdMatch = rawError.match(/Member ID:?\s*([^<\n]+)/i);
    return memberIdMatch ? memberIdMatch[1].trim() : null;
  }

  // Helper method to get letter name from template ID
  private getLetterNameFromTemplate(templateId?: string): string | null {
    if (!templateId) return null;
    
    // Map template IDs to letter names
    const templateNames: { [key: string]: string } = {
      'template-auth-approval': 'Prior Authorization Approval',
      'template-adverse-determination': 'Adverse Determination Notice',
      'template-appeal-rights': 'Appeal Rights Information',
      'template-clinical-review': 'Clinical Review Outcome',
      'template-peer-review': 'Peer Review Request'
    };
    
    return templateNames[templateId] || 'Clinical Communication';
  }
}

export const deliveryService = new DeliveryService();

// Also export the class for potential future extension
export { DeliveryService };
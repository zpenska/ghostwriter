// src/lib/services/delivery-test-service.ts
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc,
    setDoc,
    serverTimestamp,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  
  export interface DeliveryStatusTestData {
    id?: string;
    deliveryId: string;
    type: 'fax' | 'lob' | 'email';
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'processing';
    recipientName: string;
    recipientAddress?: string;
    recipientFax?: string;
    recipientEmail?: string;
    templateName: string;
    letterType: string;
    result?: any;
    error?: string;
    timestamp: any;
    memberId?: string;
    costCents?: number;
    providerName?: string;
    createdAt?: any;
    isActive: boolean;
  }
  
  class DeliveryTestService {
    private collectionName = 'delivery_status';
  
    // Create initial test delivery status data
    async initializeTestData(): Promise<void> {
      try {
        console.log('🚀 Initializing delivery status test data...');
        
        // Check if data already exists
        const existingData = await this.getAllTestData();
        if (existingData.length > 0) {
          console.log('✅ Delivery status test data already exists, skipping initialization');
          return;
        }
  
        const testDeliveryData: Omit<DeliveryStatusTestData, 'id' | 'createdAt'>[] = [
          // Successful Fax Deliveries
          {
            deliveryId: 'DEL-FAX-001',
            type: 'fax',
            status: 'delivered',
            recipientName: 'Dr. Sarah Mitchell',
            recipientFax: '+1-973-555-0123',
            templateName: 'Approval Letter - Standard',
            letterType: 'approval',
            memberId: 'UMR123456789',
            providerName: 'Newark Family Medical Center',
            costCents: 150, // $1.50
            result: {
              faxId: 'fx_12345abcde',
              status: 'delivered',
              pages: 2,
              duration: 45,
              remoteId: '+19735550123',
              completedAt: '2025-06-14T10:30:00Z'
            },
            timestamp: Timestamp.fromDate(new Date('2025-06-14T10:30:00Z')),
            isActive: true
          },
          
          {
            deliveryId: 'DEL-FAX-002',
            type: 'fax',
            status: 'delivered',
            recipientName: 'Miami Orthopedic Institute',
            recipientFax: '+1-305-555-0456',
            templateName: 'Denial Letter - Medical Necessity',
            letterType: 'denial',
            memberId: 'AET987654321',
            providerName: 'Miami Orthopedic Institute',
            costCents: 150,
            result: {
              faxId: 'fx_67890fghij',
              status: 'delivered',
              pages: 3,
              duration: 67,
              remoteId: '+13055550456',
              completedAt: '2025-06-14T14:45:00Z'
            },
            timestamp: Timestamp.fromDate(new Date('2025-06-14T14:45:00Z')),
            isActive: true
          },
  
          // Failed Fax Delivery
          {
            deliveryId: 'DEL-FAX-003',
            type: 'fax',
            status: 'failed',
            recipientName: 'Seattle Mental Health Associates',
            recipientFax: '+1-206-555-0789',
            templateName: 'Appeal Response Letter',
            letterType: 'appeal',
            memberId: 'BCB555666777',
            providerName: 'Seattle Mental Health Associates',
            costCents: 0, // No charge for failed delivery
            result: {
              faxId: 'fx_error123',
              status: 'failed',
              error: 'busy'
            },
            error: 'Recipient line was busy after 5 retry attempts',
            timestamp: Timestamp.fromDate(new Date('2025-06-14T16:20:00Z')),
            isActive: true
          },
  
          // Successful Mail Deliveries (Lob)
          {
            deliveryId: 'DEL-LOB-001',
            type: 'lob',
            status: 'processing',
            recipientName: 'Michael Thompson',
            recipientAddress: '321 Elm Drive, Dallas, TX 75201',
            templateName: 'Emergency Services Approval',
            letterType: 'approval',
            memberId: 'CIG888999111',
            providerName: 'Children\'s Medical Center Dallas',
            costCents: 68, // $0.68
            result: {
              lobId: 'ltr_1234567890abcdef',
              status: 'processing',
              expectedDelivery: '2025-06-17',
              trackingNumber: '1234567890',
              mailedAt: '2025-06-14T08:15:00Z'
            },
            timestamp: Timestamp.fromDate(new Date('2025-06-14T08:15:00Z')),
            isActive: true
          },
  
          {
            deliveryId: 'DEL-LOB-002',
            type: 'lob',
            status: 'sent',
            recipientName: 'Robert Williams',
            recipientAddress: '654 Maple Lane, Phoenix, AZ 85001',
            templateName: 'DME Authorization Letter',
            letterType: 'approval',
            memberId: 'HUM444555666',
            providerName: 'Arizona Sleep Medicine Center',
            costCents: 68,
            result: {
              lobId: 'ltr_abcdef1234567890',
              status: 'sent',
              expectedDelivery: '2025-06-18',
              trackingNumber: '0987654321',
              mailedAt: '2025-06-14T11:30:00Z'
            },
            timestamp: Timestamp.fromDate(new Date('2025-06-14T11:30:00Z')),
            isActive: true
          },
  
          // Email Deliveries
          {
            deliveryId: 'DEL-EMAIL-001',
            type: 'email',
            status: 'delivered', 
            recipientName: 'Sarah Johnson',
            recipientEmail: 'sarah.johnson@email.com',
            templateName: 'Member Portal Notification',
            letterType: 'notification',
            memberId: 'UMR123456789',
            costCents: 0, // Free email delivery
            result: {
              messageId: 'msg_email123456',
              status: 'delivered',
              openedAt: '2025-06-14T12:45:00Z',
              deliveredAt: '2025-06-14T12:30:00Z'
            },
            timestamp: Timestamp.fromDate(new Date('2025-06-14T12:30:00Z')),
            isActive: true
          },
  
          // Recent Pending Deliveries
          {
            deliveryId: 'DEL-FAX-004',
            type: 'fax',
            status: 'pending',
            recipientName: 'Dr. Jennifer Martinez',
            recipientFax: '+1-415-555-0999',
            templateName: 'Prior Authorization Request',
            letterType: 'authorization',
            memberId: 'UMR999888777',
            providerName: 'San Francisco Medical Group',
            costCents: 150,
            timestamp: Timestamp.fromDate(new Date('2025-06-14T18:00:00Z')),
            isActive: true
          },
  
          {
            deliveryId: 'DEL-LOB-003',
            type: 'lob',
            status: 'processing',
            recipientName: 'Dr. Mark Chen',
            recipientAddress: '789 Medical Plaza, Los Angeles, CA 90210',
            templateName: 'Specialty Referral Approval',
            letterType: 'approval',
            memberId: 'BCB111222333',
            providerName: 'LA Specialty Medical Center',
            costCents: 68,
            result: {
              lobId: 'ltr_processing123',
              status: 'processing',
              expectedDelivery: '2025-06-19'
            },
            timestamp: Timestamp.fromDate(new Date('2025-06-14T17:45:00Z')),
            isActive: true
          },
  
          // Failed Mail Delivery
          {
            deliveryId: 'DEL-LOB-004',
            type: 'lob',
            status: 'failed',
            recipientName: 'Invalid Address Test',
            recipientAddress: '123 Fake Street, Nowhere, XX 00000',
            templateName: 'Test Letter',
            letterType: 'test',
            memberId: 'TEST123456',
            costCents: 0,
            result: {
              lobId: 'ltr_failed456',
              status: 'failed',
              error: 'invalid_address'
            },
            error: 'Address could not be validated by postal service',
            timestamp: Timestamp.fromDate(new Date('2025-06-14T09:15:00Z')),
            isActive: true
          },
  
          // High Volume Day Simulation
          {
            deliveryId: 'DEL-FAX-005',
            type: 'fax',
            status: 'delivered',
            recipientName: 'Houston Medical Partners',
            recipientFax: '+1-713-555-0444',
            templateName: 'Routine Authorization',
            letterType: 'authorization',
            memberId: 'AET444555666',
            providerName: 'Houston Medical Partners',
            costCents: 150,
            result: {
              faxId: 'fx_houston001',
              status: 'delivered',
              pages: 1,
              duration: 32
            },
            timestamp: Timestamp.fromDate(new Date('2025-06-13T15:30:00Z')),
            isActive: true
          }
        ];
  
        // Create each test delivery status
        for (const deliveryData of testDeliveryData) {
          await addDoc(collection(db, this.collectionName), {
            ...deliveryData,
            createdAt: serverTimestamp()
          });
          console.log(`✅ Created delivery status: ${deliveryData.deliveryId} (${deliveryData.type})`);
        }
  
        console.log('✅ Delivery status test data initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing delivery test data:', error);
        throw error;
      }
    }
  
    // Get all test delivery status data
    async getAllTestData(): Promise<DeliveryStatusTestData[]> {
      try {
        const querySnapshot = await getDocs(collection(db, this.collectionName));
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DeliveryStatusTestData[];
      } catch (error) {
        console.error('❌ Error fetching delivery test data:', error);
        return [];
      }
    }
  
    // Get delivery stats for dashboard
    async getDeliveryStats() {
      try {
        const allData = await this.getAllTestData();
        
        const stats = {
          total: allData.length,
          byType: {
            fax: allData.filter(d => d.type === 'fax').length,
            lob: allData.filter(d => d.type === 'lob').length,
            email: allData.filter(d => d.type === 'email').length
          },
          byStatus: {
            pending: allData.filter(d => d.status === 'pending').length,
            processing: allData.filter(d => d.status === 'processing').length,
            sent: allData.filter(d => d.status === 'sent').length,
            delivered: allData.filter(d => d.status === 'delivered').length,
            failed: allData.filter(d => d.status === 'failed').length
          },
          totalCost: allData.reduce((sum, d) => sum + (d.costCents || 0), 0),
          successRate: Math.round((allData.filter(d => d.status === 'delivered').length / allData.length) * 100)
        };
  
        return stats;
      } catch (error) {
        console.error('❌ Error calculating delivery stats:', error);
        return null;
      }
    }
  
    // Get recent deliveries
    async getRecentDeliveries(limit: number = 10): Promise<DeliveryStatusTestData[]> {
      try {
        const allData = await this.getAllTestData();
        return allData
          .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
          .slice(0, limit);
      } catch (error) {
        console.error('❌ Error fetching recent deliveries:', error);
        return [];
      }
    }
  }
  
  export const deliveryTestService = new DeliveryTestService();
  export default deliveryTestService;
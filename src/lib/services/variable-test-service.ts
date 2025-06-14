// src/lib/services/variable-test-service.ts
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc,
    setDoc,
    serverTimestamp 
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  
  export interface VariableTestData {
    id?: string;
    name: string;
    description: string;
    data: Record<string, any>;
    createdAt?: any;
    isActive: boolean;
  }
  
  class VariableTestService {
    private collectionName = 'variable-test-data';
  
    // Create initial test data sets
    async initializeTestData(): Promise<void> {
      try {
        console.log('🚀 Initializing variable test data...');
        
        // Check if data already exists
        const existingData = await this.getAllTestData();
        if (existingData.length > 0) {
          console.log('✅ Test data already exists, skipping initialization');
          return;
        }
  
        const testDataSets: Omit<VariableTestData, 'id' | 'createdAt'>[] = [
          {
            name: "Standard Approval Case",
            description: "Typical approval scenario for outpatient services",
            isActive: true,
            data: {
              // Member Information
              firstName: "Sarah",
              lastName: "Johnson", 
              middleName: "Marie",
              memberId: "UMR123456789",
              birthDate: "1985-03-15",
              genderCode: "F",
              genderDesc: "Female",
              ssn: "123-45-6789",
              
              // Address
              addressLine1: "123 Main Street",
              addressLine2: "Apt 4B", 
              city: "Newark",
              stateCode: "NJ",
              postalCode: "07102",
              countryCode: "US",
              
              // Contact
              phoneNumber: "(973) 555-0123",
              emailAddress: "sarah.johnson@email.com",
              
              // Insurance
              clientCode: "UMR",
              clientDesc: "United Healthcare",
              planCode: "HMO-GOLD",
              planDesc: "Gold HMO Plan",
              
              // Service
              code: "99213",
              desc: "Office visit - established patient",
              statusCode: "APPROVED",
              statusDesc: "Approved",
              
              // Language
              preferredLanguageCode: "EN",
              preferredLanguageDesc: "English"
            }
          },
          
          {
            name: "Denial Case - Spanish Speaker",
            description: "Denial scenario for Spanish-speaking member",
            isActive: true,
            data: {
              // Member Information
              firstName: "Carlos",
              lastName: "Rodriguez",
              middleName: "Antonio", 
              memberId: "AET987654321",
              birthDate: "1972-11-08",
              genderCode: "M",
              genderDesc: "Male",
              
              // Address
              addressLine1: "456 Oak Avenue",
              city: "Miami",
              stateCode: "FL", 
              postalCode: "33101",
              countryCode: "US",
              
              // Contact
              phoneNumber: "(305) 555-0456",
              emailAddress: "carlos.rodriguez@email.com",
              
              // Insurance
              clientCode: "AET",
              clientDesc: "Aetna Better Health",
              planCode: "MCD-STD",
              planDesc: "Medicaid Standard Plan",
              
              // Service
              code: "27447",
              desc: "Knee arthroplasty",
              statusCode: "DENIED",
              statusDesc: "Denied",
              reasonCode: "MED-NEC",
              reasonDesc: "Medical necessity not established",
              
              // Language
              preferredLanguageCode: "ES", 
              preferredLanguageDesc: "Spanish"
            }
          },
          
          {
            name: "Behavioral Health Appeal",
            description: "Appeal scenario for behavioral health services",
            isActive: true,
            data: {
              // Member Information
              firstName: "Jennifer",
              lastName: "Chen",
              memberId: "BCB555666777",
              birthDate: "1990-07-22",
              genderCode: "F",
              genderDesc: "Female",
              
              // Address
              addressLine1: "789 Pine Street",
              addressLine2: "Unit 12",
              city: "Seattle", 
              stateCode: "WA",
              postalCode: "98101",
              
              // Insurance
              clientCode: "BCB",
              clientDesc: "Blue Cross Blue Shield",
              planCode: "PPO-PREM",
              planDesc: "Premium PPO Plan",
              
              // Service
              code: "90834",
              desc: "Psychotherapy, 45 minutes",
              statusCode: "APPEAL",
              statusDesc: "Under Appeal Review",
              classificationCode: "BH",
              classificationDesc: "Behavioral Health",
              
              // Language
              preferredLanguageCode: "EN",
              preferredLanguageDesc: "English"
            }
          },
          
          {
            name: "Pediatric Emergency",
            description: "Urgent authorization for pediatric emergency services", 
            isActive: true,
            data: {
              // Member Information (Minor)
              firstName: "Michael",
              lastName: "Thompson",
              memberId: "CIG888999111",
              birthDate: "2015-12-03",
              genderCode: "M",
              genderDesc: "Male",
              
              // Address
              addressLine1: "321 Elm Drive",
              city: "Dallas",
              stateCode: "TX",
              postalCode: "75201",
              
              // Insurance
              clientCode: "CIG",
              clientDesc: "Cigna HealthCare", 
              planCode: "HMO-FAM",
              planDesc: "Family HMO Plan",
              relationshipCode: "02",
              relationshipDesc: "Child",
              
              // Service
              code: "99285",
              desc: "Emergency department visit",
              statusCode: "APPROVED",
              statusDesc: "Approved",
              urgencyCode: "URG",
              urgencyDesc: "Urgent Review",
              
              // Diagnosis
              diagnosis: "R50.9 - Fever NOS"
            }
          },
          
          {
            name: "DME Authorization",
            description: "Durable Medical Equipment authorization case",
            isActive: true,
            data: {
              // Member Information
              firstName: "Robert",
              lastName: "Williams",
              memberId: "HUM444555666",
              birthDate: "1965-04-18",
              genderCode: "M",
              genderDesc: "Male",
              
              // Address
              addressLine1: "654 Maple Lane",
              city: "Phoenix",
              stateCode: "AZ",
              postalCode: "85001",
              
              // Insurance  
              clientCode: "HUM",
              clientDesc: "Humana Inc",
              planCode: "MA-ADV",
              planDesc: "Medicare Advantage Plan",
              
              // Service
              code: "E0601",
              desc: "CPAP device",
              statusCode: "APPROVED", 
              statusDesc: "Approved",
              placeOfServiceCode: "12",
              placeOfServiceDesc: "Home",
              
              // Diagnosis
              diagnosis: "G47.33 - Obstructive sleep apnea"
            }
          }
        ];
  
        // Create each test data set
        for (const testData of testDataSets) {
          await addDoc(collection(db, this.collectionName), {
            ...testData,
            createdAt: serverTimestamp()
          });
          console.log(`✅ Created test case: ${testData.name}`);
        }
  
        console.log('✅ Variable test data initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing test data:', error);
        throw error;
      }
    }
  
    // Get all test data sets
    async getAllTestData(): Promise<VariableTestData[]> {
      try {
        const querySnapshot = await getDocs(collection(db, this.collectionName));
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VariableTestData[];
      } catch (error) {
        console.error('❌ Error fetching test data:', error);
        return [];
      }
    }
  
    // Get specific test data by ID
    async getTestData(id: string): Promise<VariableTestData | null> {
      try {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as VariableTestData;
        }
        return null;
      } catch (error) {
        console.error('❌ Error fetching test data:', error);
        return null;
      }
    }
  
    // Get test data by name
    async getTestDataByName(name: string): Promise<VariableTestData | null> {
      try {
        const allData = await this.getAllTestData();
        return allData.find(data => data.name === name) || null;
      } catch (error) {
        console.error('❌ Error fetching test data by name:', error);
        return null;
      }
    }
  
    // Get variable value from test data
    getVariableValue(testData: VariableTestData, variableName: string): string {
      const cleanVariableName = variableName.replace(/[{}]/g, '');
      return testData.data[cleanVariableName] || `{{${cleanVariableName}}}`;
    }
  
    // Replace all variables in content with test data
    replaceVariablesInContent(content: string, testData: VariableTestData): string {
      return content.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
        const value = this.getVariableValue(testData, variableName.trim());
        return value.startsWith('{{') ? match : value;
      });
    }
  }
  
  export const variableTestService = new VariableTestService();
  export default variableTestService;
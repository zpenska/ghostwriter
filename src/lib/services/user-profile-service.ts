// src/lib/services/user-profile-service.ts
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  import { User } from 'firebase/auth';
  
  // Types defined here - single source of truth
  export interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
    jobTitle?: string;
    department?: string;
    bio?: string;
    lastLoginAt?: any; // Firestore timestamp
    createdAt?: any; // Firestore timestamp
    updatedAt?: any; // Firestore timestamp
    notificationSettings?: NotificationSettings;
    securitySettings?: SecuritySettings;
  }
  
  export interface NotificationSettings {
    emailNotifications: boolean;
    letterDeliveryAlerts: boolean;
    weeklyReports: boolean;
    systemUpdates: boolean;
    failureAlerts: boolean;
    successAlerts: boolean;
  }
  
  export interface SecuritySettings {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  }
  
  class UserProfileService {
    private getUserProfileRef(uid: string) {
      return doc(db, 'user_profiles', uid);
    }
  
    async createUserProfile(user: User, additionalData: Partial<UserProfile> = {}): Promise<UserProfile> {
      const userProfileRef = this.getUserProfileRef(user.uid);
      
      const defaultProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        jobTitle: '',
        department: '',
        bio: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        notificationSettings: {
          emailNotifications: true,
          letterDeliveryAlerts: true,
          weeklyReports: false,
          systemUpdates: true,
          failureAlerts: true,
          successAlerts: false
        },
        securitySettings: {
          twoFactorEnabled: false,
          sessionTimeout: 60,
          loginAlerts: true
        },
        ...additionalData
      };
  
      try {
        await setDoc(userProfileRef, defaultProfile, { merge: true });
        console.log('✅ User profile created successfully');
        return defaultProfile;
      } catch (error) {
        console.error('❌ Error creating user profile:', error);
        throw error;
      }
    }
  
    async getUserProfile(uid: string): Promise<UserProfile | null> {
      try {
        const userProfileRef = this.getUserProfileRef(uid);
        const userProfileSnap = await getDoc(userProfileRef);
  
        if (userProfileSnap.exists()) {
          const data = userProfileSnap.data() as UserProfile;
          console.log('✅ User profile loaded successfully');
          return data;
        } else {
          console.log('⚠️ No user profile found');
          return null;
        }
      } catch (error) {
        console.error('❌ Error getting user profile:', error);
        throw error;
      }
    }
  
    async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
      try {
        const userProfileRef = this.getUserProfileRef(uid);
        const updateData = {
          ...updates,
          updatedAt: serverTimestamp()
        };
  
        await updateDoc(userProfileRef, updateData);
        console.log('✅ User profile updated successfully');
      } catch (error) {
        console.error('❌ Error updating user profile:', error);
        throw error;
      }
    }
  
    async updateLastLoginTime(uid: string): Promise<void> {
      try {
        const userProfileRef = this.getUserProfileRef(uid);
        await updateDoc(userProfileRef, {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('✅ Last login time updated');
      } catch (error) {
        console.error('❌ Error updating last login time:', error);
        // Don't throw error for this non-critical operation
      }
    }
  
    async updateNotificationSettings(uid: string, settings: NotificationSettings): Promise<void> {
      try {
        const userProfileRef = this.getUserProfileRef(uid);
        await updateDoc(userProfileRef, {
          notificationSettings: settings,
          updatedAt: serverTimestamp()
        });
        console.log('✅ Notification settings updated successfully');
      } catch (error) {
        console.error('❌ Error updating notification settings:', error);
        throw error;
      }
    }
  
    async updateSecuritySettings(uid: string, settings: SecuritySettings): Promise<void> {
      try {
        const userProfileRef = this.getUserProfileRef(uid);
        await updateDoc(userProfileRef, {
          securitySettings: settings,
          updatedAt: serverTimestamp()
        });
        console.log('✅ Security settings updated successfully');
      } catch (error) {
        console.error('❌ Error updating security settings:', error);
        throw error;
      }
    }
  
    async deleteUserProfile(uid: string): Promise<void> {
      try {
        const userProfileRef = this.getUserProfileRef(uid);
        await updateDoc(userProfileRef, {
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('✅ User profile marked as deleted');
      } catch (error) {
        console.error('❌ Error deleting user profile:', error);
        throw error;
      }
    }
  
    // Search users by email or name (for admin features)
    async searchUsers(searchTerm: string): Promise<UserProfile[]> {
      try {
        const usersRef = collection(db, 'user_profiles');
        
        // Search by email
        const emailQuery = query(
          usersRef, 
          where('email', '>=', searchTerm),
          where('email', '<=', searchTerm + '\uf8ff')
        );
        
        // Search by display name
        const nameQuery = query(
          usersRef, 
          where('displayName', '>=', searchTerm),
          where('displayName', '<=', searchTerm + '\uf8ff')
        );
  
        const [emailResults, nameResults] = await Promise.all([
          getDocs(emailQuery),
          getDocs(nameQuery)
        ]);
  
        const users: UserProfile[] = [];
        const seenUids = new Set();
  
        // Combine results and avoid duplicates
        emailResults.forEach(doc => {
          if (!seenUids.has(doc.id)) {
            users.push(doc.data() as UserProfile);
            seenUids.add(doc.id);
          }
        });
  
        nameResults.forEach(doc => {
          if (!seenUids.has(doc.id)) {
            users.push(doc.data() as UserProfile);
            seenUids.add(doc.id);
          }
        });
  
        console.log(`✅ Found ${users.length} users matching "${searchTerm}"`);
        return users;
      } catch (error) {
        console.error('❌ Error searching users:', error);
        throw error;
      }
    }
  
    // Get all users (for admin dashboard)
    async getAllUsers(limit: number = 50): Promise<UserProfile[]> {
      try {
        const usersRef = collection(db, 'user_profiles');
        const usersSnap = await getDocs(query(usersRef));
        
        const users: UserProfile[] = [];
        usersSnap.forEach(doc => {
          users.push(doc.data() as UserProfile);
        });
  
        console.log(`✅ Loaded ${users.length} user profiles`);
        return users.slice(0, limit);
      } catch (error) {
        console.error('❌ Error getting all users:', error);
        throw error;
      }
    }
  
    // Test connection to Firestore
    async testConnection(): Promise<{ success: boolean; message: string }> {
      try {
        // Try to read from a test document
        const testDocRef = doc(db, 'test', 'connection');
        await getDoc(testDocRef);
        
        return {
          success: true,
          message: 'Firestore connection successful'
        };
      } catch (error) {
        console.error('❌ Firestore connection test failed:', error);
        return {
          success: false,
          message: `Firestore connection failed: ${error}`
        };
      }
    }
  }
  
  // Export singleton instance
  export const userProfileService = new UserProfileService();
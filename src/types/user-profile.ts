// src/lib/types/user-profile.ts

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
  
  export interface AuthContextType {
    user: any | null; // Firebase User type
    userProfile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
    updateNotificationSettings: (settings: NotificationSettings) => Promise<void>;
    updateSecuritySettings: (settings: SecuritySettings) => Promise<void>;
    refreshUserProfile: () => Promise<void>;
    getUserInitials: () => string;
    getUserDisplayName: () => string;
  }
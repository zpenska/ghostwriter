// src/lib/hooks/useAuth.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { userProfileService, type UserProfile, type NotificationSettings, type SecuritySettings } from '@/lib/services/user-profile-service';

interface AuthContextType {
  user: User | null;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await loadUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (user: User): Promise<void> => {
    try {
      console.log('🔄 Loading user profile for:', user.uid);
      
      // Try to load existing profile
      let profile = await userProfileService.getUserProfile(user.uid);
      
      if (!profile) {
        console.log('📝 Creating new user profile...');
        // Create new profile if doesn't exist
        profile = await userProfileService.createUserProfile(user);
      } else {
        // Update last login time
        await userProfileService.updateLastLoginTime(user.uid);
      }
      
      setUserProfile(profile);
      console.log('✅ User profile loaded successfully');
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      
      // Fallback to a basic profile if Firestore fails
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        jobTitle: '',
        department: '',
        bio: '',
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
        }
      };
      
      setUserProfile(fallbackProfile);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user || !userProfile) {
      throw new Error('No user logged in');
    }

    try {
      console.log('🔄 Updating user profile...', updates);
      
      // Update in Firestore
      await userProfileService.updateUserProfile(user.uid, updates);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      
      console.log('✅ User profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  };

  const updateNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
    if (!user || !userProfile) {
      throw new Error('No user logged in');
    }

    try {
      console.log('🔄 Updating notification settings...', settings);
      
      // Update in Firestore
      await userProfileService.updateNotificationSettings(user.uid, settings);
      
      // Update local state
      setUserProfile((prev: UserProfile | null) => prev ? { ...prev, notificationSettings: settings } : null);
      
      console.log('✅ Notification settings updated successfully');
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      throw error;
    }
  };

  const updateSecuritySettings = async (settings: SecuritySettings): Promise<void> => {
    if (!user || !userProfile) {
      throw new Error('No user logged in');
    }

    try {
      console.log('🔄 Updating security settings...', settings);
      
      // Update in Firestore
      await userProfileService.updateSecuritySettings(user.uid, settings);
      
      // Update local state
      setUserProfile((prev: UserProfile | null) => prev ? { ...prev, securitySettings: settings } : null);
      
      console.log('✅ Security settings updated successfully');
    } catch (error) {
      console.error('❌ Error updating security settings:', error);
      throw error;
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (!user) return;
    
    try {
      console.log('🔄 Refreshing user profile...');
      await loadUserProfile(user);
    } catch (error) {
      console.error('❌ Error refreshing user profile:', error);
      throw error;
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      router.push('/login');
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  };

  const getUserInitials = (): string => {
    if (!user) return 'U';
    
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  };

  const getUserDisplayName = (): string => {
    if (!user) return 'User';
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signOut: handleSignOut,
    updateUserProfile,
    updateNotificationSettings,
    updateSecuritySettings,
    refreshUserProfile,
    getUserInitials,
    getUserDisplayName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  return { user, loading };
}

// Helper function to get user initials from any user object
export function getUserInitials(user: User | UserProfile | null): string {
  if (!user) return 'U';
  
  const displayName = user.displayName;
  const email = user.email;
  
  if (displayName) {
    return displayName
      .split(' ')
      .map((name: string) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  if (email) {
    return email[0].toUpperCase();
  }
  
  return 'U';
}

// Helper function to format user display name
export function getUserDisplayName(user: User | UserProfile | null): string {
  if (!user) return 'User';
  
  const displayName = user.displayName;
  const email = user.email;
  
  return displayName || email?.split('@')[0] || 'User';
}
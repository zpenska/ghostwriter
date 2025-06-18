'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  updateProfile, 
  updatePassword, 
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase/config';
import {
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  PhotoIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Simple blocks
const Avatar = ({ src, initials, className, ...props }: {
  src?: string | null;
  initials?: string;
  className?: string;
  [key: string]: any;
}) => (
  <div
    className={`inline-flex items-center justify-center rounded-full bg-gray-500 text-white font-medium overflow-hidden ${className}`}
    {...props}
  >
    {src ? (
      <img src={src} alt="" className="w-full h-full object-cover" />
    ) : (
      <span className="text-sm font-semibold">{initials}</span>
    )}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', disabled = false, ...props }: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) => {
  const baseClasses = "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  
  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }: {
  className?: string;
  [key: string]: any;
}) => (
  <input
    className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm ${className}`}
    {...props}
  />
);

const Switch = ({ checked, onChange, className = '', ...props }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  [key: string]: any;
}) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
      checked ? 'bg-gray-600' : 'bg-gray-200'
    } ${className}`}
    onClick={() => onChange(!checked)}
    {...props}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const Textarea = ({ className = '', ...props }: {
  className?: string;
  [key: string]: any;
}) => (
  <textarea
    className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm ${className}`}
    {...props}
  />
);

// Interfaces
interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  jobTitle?: string;
  department?: string;
  bio?: string;
  updatedAt?: any;
  notificationSettings?: NotificationSettings;
  securitySettings?: SecuritySettings;
}

interface NotificationSettings {
  emailNotifications: boolean;
  letterDeliveryAlerts: boolean;
  weeklyReports: boolean;
  systemUpdates: boolean;
  failureAlerts: boolean;
  successAlerts: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
}

export default function UserSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile state
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    photoURL: '',
    phoneNumber: '',
    jobTitle: '',
    department: '',
    bio: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    letterDeliveryAlerts: true,
    weeklyReports: false,
    systemUpdates: true,
    failureAlerts: true,
    successAlerts: false
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    loginAlerts: true
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setProfile(prev => ({
          ...prev,
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || '',
        }));
        loadUserProfile(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'password', name: 'Password', icon: KeyIcon }
  ];

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadUserProfile = async (uid: string) => {
    try {
      const userRef = doc(db, 'user_profiles', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        
        // Update form state
        setProfile(prev => ({
          ...prev,
          phoneNumber: data.phoneNumber || '',
          jobTitle: data.jobTitle || '',
          department: data.department || '',
          bio: data.bio || '',
        }));
        
        if (data.notificationSettings) {
          setNotifications(data.notificationSettings);
        }
        
        if (data.securitySettings) {
          setSecurity(data.securitySettings);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'Image must be less than 2MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Create a reference to the storage location
      const fileExtension = file.name.split('.').pop();
      const fileName = `profile-photos/${user.uid}/avatar.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update local state with the new photo URL
      setProfile(prev => ({ ...prev, photoURL: downloadURL }));
      
      showMessage('success', 'Photo uploaded successfully! Click "Save Changes" to save.');
      
    } catch (error) {
      showMessage('error', `Failed to upload photo: ${error}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !profile.photoURL) return;

    setUploadingPhoto(true);

    try {
      // If it's a Firebase Storage URL, delete the file
      if (profile.photoURL.includes('firebase')) {
        const photoRef = ref(storage, `profile-photos/${user.uid}/avatar.jpg`);
        try {
          await deleteObject(photoRef);
        } catch (error) {
          // File might not exist, that's okay
        }
      }

      // Update local state
      setProfile(prev => ({ ...prev, photoURL: '' }));
      
      showMessage('success', 'Photo removed! Click "Save Changes" to save.');
      
    } catch (error) {
      showMessage('error', `Failed to remove photo: ${error}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveUserProfile = async () => {
    if (!user) {
      showMessage('error', 'No user signed in');
      return;
    }

    setLoading(true);

    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profile.displayName,
        photoURL: profile.photoURL
      });

      // Save to Firestore
      const userRef = doc(db, 'user_profiles', user.uid);
      const profileData: UserProfile = {
        uid: user.uid,
        displayName: profile.displayName,
        email: profile.email,
        photoURL: profile.photoURL,
        phoneNumber: profile.phoneNumber,
        jobTitle: profile.jobTitle,
        department: profile.department,
        bio: profile.bio,
        updatedAt: serverTimestamp(),
        notificationSettings: notifications,
        securitySettings: security
      };

      await setDoc(userRef, profileData, { merge: true });
      showMessage('success', 'Profile updated successfully');

    } catch (error) {
      showMessage('error', `Failed to save profile: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const userRef = doc(db, 'user_profiles', user.uid);
      await setDoc(userRef, {
        notificationSettings: notifications,
        updatedAt: serverTimestamp()
      }, { merge: true });

      showMessage('success', 'Notification settings saved');
    } catch (error) {
      showMessage('error', 'Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSecuritySettings = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const userRef = doc(db, 'user_profiles', user.uid);
      await setDoc(userRef, {
        securitySettings: security,
        updatedAt: serverTimestamp()
      }, { merge: true });

      showMessage('success', 'Security settings saved');
    } catch (error) {
      showMessage('error', 'Failed to save security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (user?.email) {
        const credential = EmailAuthProvider.credential(user.email, passwords.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, passwords.newPassword);
      }
      
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password updated successfully');
    } catch (error) {
      showMessage('error', 'Failed to update password. Check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      if (user?.email) {
        await sendPasswordResetEmail(auth, user.email);
        showMessage('success', 'Password reset email sent');
      }
    } catch (error) {
      showMessage('error', 'Failed to send password reset email');
    }
  };

  const getUserInitials = () => {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-2 text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Inter',_system-ui,_sans-serif]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="py-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-gray-400 mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600">Manage your account preferences and security settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`border-l-4 p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-400' 
            : 'bg-red-50 border-red-400'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <CheckIcon className="h-5 w-5 text-green-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Navigation */}
          <aside className="lg:col-span-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                      activeTab === tab.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${
                      activeTab === tab.id ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <span className="truncate">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="lg:col-span-9 mt-8 lg:mt-0">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar
                        src={profile.photoURL}
                        initials={getUserInitials()}
                        className="w-20 h-20 bg-gray-500 text-white text-lg"
                      />
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex space-x-3 mb-2">
                        <Button
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                        >
                          <PhotoIcon className="w-4 h-4 mr-2" />
                          {uploadingPhoto ? 'Uploading...' : 'Upload new photo'}
                        </Button>
                        {profile.photoURL && (
                          <Button
                            variant="secondary"
                            onClick={handleRemovePhoto}
                            disabled={uploadingPhoto}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <p className="text-sm text-gray-500">
                        JPG, GIF or PNG. Max size of 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <Input
                        type="text"
                        value={profile.displayName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, displayName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <Input
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed here</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <Input
                        type="tel"
                        value={profile.phoneNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, phoneNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <Input
                        type="text"
                        value={profile.jobTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, jobTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <Input
                        type="text"
                        value={profile.department}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, department: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <Textarea
                      rows={3}
                      value={profile.bio}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us a little about yourself..."
                    />
                  </div>
                  <div className="mt-6">
                    <Button onClick={saveUserProfile} disabled={loading}>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onChange={(checked: boolean) => setNotifications({ ...notifications, emailNotifications: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Letter Delivery Alerts</h4>
                      <p className="text-sm text-gray-500">Get notified when letters are delivered or fail</p>
                    </div>
                    <Switch
                      checked={notifications.letterDeliveryAlerts}
                      onChange={(checked: boolean) => setNotifications({ ...notifications, letterDeliveryAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Weekly Reports</h4>
                      <p className="text-sm text-gray-500">Receive weekly analytics summaries</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onChange={(checked: boolean) => setNotifications({ ...notifications, weeklyReports: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">System Updates</h4>
                      <p className="text-sm text-gray-500">Get notified about system maintenance and updates</p>
                    </div>
                    <Switch
                      checked={notifications.systemUpdates}
                      onChange={(checked: boolean) => setNotifications({ ...notifications, systemUpdates: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Failure Alerts</h4>
                      <p className="text-sm text-gray-500">Immediate alerts for delivery failures</p>
                    </div>
                    <Switch
                      checked={notifications.failureAlerts}
                      onChange={(checked: boolean) => setNotifications({ ...notifications, failureAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Success Alerts</h4>
                      <p className="text-sm text-gray-500">Get notified of successful deliveries</p>
                    </div>
                    <Switch
                      checked={notifications.successAlerts}
                      onChange={(checked: boolean) => setNotifications({ ...notifications, successAlerts: checked })}
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button onClick={saveNotificationSettings} disabled={loading}>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Notification Settings'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Switch
                        checked={security.twoFactorEnabled}
                        onChange={(checked: boolean) => setSecurity({ ...security, twoFactorEnabled: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Login Alerts</h4>
                        <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                      </div>
                      <Switch
                        checked={security.loginAlerts}
                        onChange={(checked: boolean) => setSecurity({ ...security, loginAlerts: checked })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm max-w-xs"
                      >
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={480}>8 hours</option>
                        <option value={0}>Never</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button onClick={saveSecuritySettings} disabled={loading}>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Security Settings'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Password</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <Input
                      type="password"
                      value={passwords.currentPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <Input
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <Input
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button onClick={handleChangePassword} disabled={loading}>
                      <KeyIcon className="w-4 h-4 mr-2" />
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                    <Button variant="secondary" onClick={handleResetPassword}>
                      Send Reset Email
                    </Button>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Password Requirements</h4>
                      <ul className="mt-1 text-sm text-blue-700 list-disc list-inside space-y-1">
                        <li>At least 8 characters long</li>
                        <li>Contains at least one uppercase letter</li>
                        <li>Contains at least one lowercase letter</li>
                        <li>Contains at least one number</li>
                        <li>Contains at least one special character</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
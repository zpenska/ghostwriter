'use client';

import { useState } from 'react';
import { 
  CogIcon,
  UsersIcon,
  ClockIcon,
  ArrowPathIcon,
  BellIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Mock user data
const mockUsers = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@company.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Mike Chen', email: 'mike@company.com', role: 'editor', status: 'active' },
  { id: 3, name: 'Emily Davis', email: 'emily@company.com', role: 'viewer', status: 'inactive' }
];

const mockNotificationEmails = [
  'admin@company.com',
  'support@company.com'
];

export default function GhostwriterSettings() {
  const [activeTab, setActiveTab] = useState('permissions');
  const [users, setUsers] = useState(mockUsers);
  const [scheduleSettings, setScheduleSettings] = useState({
    enableDelay: false,
    delayHours: 0,
    delayMinutes: 30,
    enableDailySchedule: true,
    dailySendTime: '09:00',
    timezone: 'America/New_York'
  });
  const [retrySettings, setRetrySettings] = useState({
    enableRetries: true,
    maxRetries: 3,
    retryInterval: 30,
    notificationEmails: [...mockNotificationEmails],
    notifyOnFirstFailure: true,
    notifyOnAllFailures: false
  });
  const [newEmail, setNewEmail] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'viewer' });

  const tabs = [
    { id: 'permissions', name: 'User Permissions', icon: UsersIcon },
    { id: 'schedule', name: 'Schedule Settings', icon: ClockIcon },
    { id: 'retry', name: 'Retry & Notifications', icon: ArrowPathIcon }
  ];

  const handleSaveSettings = () => {
    // Implementation for saving settings
    console.log('Saving settings:', { scheduleSettings, retrySettings });
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      const user = {
        id: users.length + 1,
        ...newUser,
        status: 'active'
      };
      setUsers([...users, user]);
      setNewUser({ name: '', email: '', role: 'viewer' });
      setShowAddUser(false);
    }
  };

  const handleRemoveUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleAddNotificationEmail = () => {
    if (newEmail && !retrySettings.notificationEmails.includes(newEmail)) {
      setRetrySettings({
        ...retrySettings,
        notificationEmails: [...retrySettings.notificationEmails, newEmail]
      });
      setNewEmail('');
    }
  };

  const handleRemoveNotificationEmail = (email: string) => {
    setRetrySettings({
      ...retrySettings,
      notificationEmails: retrySettings.notificationEmails.filter(e => e !== email)
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-white font-['Inter',_system-ui,_sans-serif]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="py-6">
            <div className="flex items-center">
              <CogIcon className="h-8 w-8 text-gray-400 mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your Ghostwriter configuration and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                        <p className="mt-1 text-sm text-gray-600">Manage user access and permissions for your organization</p>
                      </div>
                      <button
                        onClick={() => setShowAddUser(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add User
                      </button>
                    </div>
                  </div>

                  {showAddUser && (
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                            placeholder="Enter full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          onClick={() => setShowAddUser(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddUser}
                          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                        >
                          Add User
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleRemoveUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-start">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Role Permissions</h4>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p><strong>Admin:</strong> Full access to all features, settings, and user management</p>
                        <p><strong>Editor:</strong> Can create, edit, and send letters but cannot manage users or settings</p>
                        <p><strong>Viewer:</strong> Can view letters and analytics but cannot make changes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Delivery Schedule</h3>
                    <p className="mt-1 text-sm text-gray-600">Configure when and how letters are sent to your print vendors</p>
                  </div>

                  <div className="mt-6 space-y-6">
                    {/* Global Delay Setting */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            id="enable-delay"
                            type="checkbox"
                            checked={scheduleSettings.enableDelay}
                            onChange={(e) => setScheduleSettings({ 
                              ...scheduleSettings, 
                              enableDelay: e.target.checked 
                            })}
                            className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                          />
                          <label htmlFor="enable-delay" className="ml-3 text-sm font-medium text-gray-900">
                            Enable Global Delay
                          </label>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">Add a delay between letter generation and delivery</p>
                      
                      {scheduleSettings.enableDelay && (
                        <div className="mt-4 grid grid-cols-2 gap-4 max-w-md">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                            <select
                              value={scheduleSettings.delayHours}
                              onChange={(e) => setScheduleSettings({ 
                                ...scheduleSettings, 
                                delayHours: parseInt(e.target.value) 
                              })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>{i}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                            <select
                              value={scheduleSettings.delayMinutes}
                              onChange={(e) => setScheduleSettings({ 
                                ...scheduleSettings, 
                                delayMinutes: parseInt(e.target.value) 
                              })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                            >
                              {[0, 15, 30, 45].map(min => (
                                <option key={min} value={min}>{min}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            id="enable-daily-schedule"
                            type="checkbox"
                            checked={scheduleSettings.enableDailySchedule}
                            onChange={(e) => setScheduleSettings({ 
                              ...scheduleSettings, 
                              enableDailySchedule: e.target.checked 
                            })}
                            className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                          />
                          <label htmlFor="enable-daily-schedule" className="ml-3 text-sm font-medium text-gray-900">
                            Daily Send Schedule
                          </label>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">Send all letters at a specific time each day</p>

                      {scheduleSettings.enableDailySchedule && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Send Time</label>
                            <input
                              type="time"
                              value={scheduleSettings.dailySendTime}
                              onChange={(e) => setScheduleSettings({ 
                                ...scheduleSettings, 
                                dailySendTime: e.target.value 
                              })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                            <select
                              value={scheduleSettings.timezone}
                              onChange={(e) => setScheduleSettings({ 
                                ...scheduleSettings, 
                                timezone: e.target.value 
                              })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                            >
                              <option value="America/New_York">Eastern Time</option>
                              <option value="America/Chicago">Central Time</option>
                              <option value="America/Denver">Mountain Time</option>
                              <option value="America/Los_Angeles">Pacific Time</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Schedule Preview</h4>
                      <div className="mt-1 text-sm text-blue-700">
                        {scheduleSettings.enableDelay && scheduleSettings.enableDailySchedule ? (
                          <p>Letters will be delayed by {scheduleSettings.delayHours}h {scheduleSettings.delayMinutes}m, then sent daily at {formatTime(scheduleSettings.dailySendTime)}</p>
                        ) : scheduleSettings.enableDelay ? (
                          <p>Letters will be delayed by {scheduleSettings.delayHours}h {scheduleSettings.delayMinutes}m before sending</p>
                        ) : scheduleSettings.enableDailySchedule ? (
                          <p>Letters will be sent daily at {formatTime(scheduleSettings.dailySendTime)}</p>
                        ) : (
                          <p>Letters will be sent immediately upon generation</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'retry' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Retry Logic</h3>
                    <p className="mt-1 text-sm text-gray-600">Configure how failed letter deliveries are handled</p>
                  </div>

                  <div className="mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id="enable-retries"
                          type="checkbox"
                          checked={retrySettings.enableRetries}
                          onChange={(e) => setRetrySettings({ 
                            ...retrySettings, 
                            enableRetries: e.target.checked 
                          })}
                          className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                        />
                        <label htmlFor="enable-retries" className="ml-3 text-sm font-medium text-gray-900">
                          Enable Automatic Retries
                        </label>
                      </div>
                    </div>

                    {retrySettings.enableRetries && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Retries</label>
                          <select
                            value={retrySettings.maxRetries}
                            onChange={(e) => setRetrySettings({ 
                              ...retrySettings, 
                              maxRetries: parseInt(e.target.value) 
                            })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                          >
                            {[1, 2, 3, 4, 5].map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Retry Interval (minutes)</label>
                          <select
                            value={retrySettings.retryInterval}
                            onChange={(e) => setRetrySettings({ 
                              ...retrySettings, 
                              retryInterval: parseInt(e.target.value) 
                            })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                          >
                            <option value={15}>15</option>
                            <option value={30}>30</option>
                            <option value={60}>60</option>
                            <option value={120}>120</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Failure Notifications</h3>
                    <p className="mt-1 text-sm text-gray-600">Configure who gets notified when letter deliveries fail</p>
                  </div>

                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Notification Recipients</label>
                      <div className="space-y-2">
                        {retrySettings.notificationEmails.map((email, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                            <span className="text-sm text-gray-900">{email}</span>
                            <button
                              onClick={() => handleRemoveNotificationEmail(email)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex">
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter email address"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                        />
                        <button
                          onClick={handleAddNotificationEmail}
                          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-r-lg shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          id="notify-first-failure"
                          type="checkbox"
                          checked={retrySettings.notifyOnFirstFailure}
                          onChange={(e) => setRetrySettings({ 
                            ...retrySettings, 
                            notifyOnFirstFailure: e.target.checked 
                          })}
                          className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notify-first-failure" className="ml-3 text-sm text-gray-900">
                          Notify on first failure
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="notify-all-failures"
                          type="checkbox"
                          checked={retrySettings.notifyOnAllFailures}
                          onChange={(e) => setRetrySettings({ 
                            ...retrySettings, 
                            notifyOnAllFailures: e.target.checked 
                          })}
                          className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notify-all-failures" className="ml-3 text-sm text-gray-900">
                          Notify on all retry failures
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {retrySettings.enableRetries && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-900">Retry Configuration</h4>
                        <p className="mt-1 text-sm text-amber-700">
                          Failed letters will be retried up to {retrySettings.maxRetries} times with {retrySettings.retryInterval} minute intervals. 
                          {retrySettings.notificationEmails.length > 0 && (
                            <span>
                              {' '}Notifications will be sent to {retrySettings.notificationEmails.length} recipient{retrySettings.notificationEmails.length !== 1 ? 's' : ''}.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Save Settings
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
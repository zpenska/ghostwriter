'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  EllipsisHorizontalIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  ChevronUpDownIcon,
  FunnelIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  PrinterIcon,
  ChartBarIcon,
  CalendarIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  HomeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Timestamp } from 'firebase/firestore';
import { deliveryService, Letter, AnalyticsData, DeliveryFilter } from '@/lib/services/delivery-service';

// Extended Letter type for this block
type LetterWithUser = Letter & { createdBy?: string };

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}



interface FilterState {
  status: number[];
  deliveryMethod: string[];
  dateRange: { start: string; end: string };
  test?: boolean;
}

interface SortConfig {
  key: keyof LetterWithUser | 'memberName';
  direction: 'asc' | 'desc';
}

export default function GhostwriterHomepage() {
  const [letters, setLetters] = useState<LetterWithUser[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [timeFrame, setTimeFrame] = useState('last-week');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'sentAt', direction: 'desc' });
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    deliveryMethod: [],
    dateRange: { start: '', end: '' },
    test: false
  });

  const router = useRouter();
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    loadData();
  }, [timeFrame]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          const dropdownButton = dropdownElement.parentElement?.querySelector('button[data-dropdown-button="true"]');
          if (!dropdownButton?.contains(event.target as Node)) {
            setOpenDropdown(null);
          }
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Loading dashboard data...');
      
      // First test basic Firestore connectivity
      console.log('🧪 Running connection test...');
      const connectionTest = await deliveryService.testConnection();
      console.log('🔬 Connection test result:', connectionTest);
      
      if (!connectionTest.success) {
        console.error('❌ Basic connection failed - check Firebase config and Firestore rules');
        throw new Error('Failed to connect to Firestore');
      }
      
      if (connectionTest.count === 0) {
        console.warn('⚠️ No documents found in delivery_status collection');
        // Still try to continue with empty data
      }
      
      // Create delivery filter from current filters if any
      const deliveryFilter: DeliveryFilter = {
        // Don't filter by test for now - include all data
      };

      if (filters.status.length > 0) {
        deliveryFilter.status = filters.status;
        console.log('📊 Applying status filter:', filters.status);
      }

      if (filters.deliveryMethod.length > 0) {
        deliveryFilter.deliveryMethod = filters.deliveryMethod;
        console.log('📨 Applying delivery method filter:', filters.deliveryMethod);
      }

      if (filters.dateRange.start && filters.dateRange.end) {
        deliveryFilter.dateRange = {
          start: new Date(filters.dateRange.start),
          end: new Date(filters.dateRange.end)
        };
        console.log('📅 Applying date range filter:', deliveryFilter.dateRange);
      }

      console.log('⚙️ Final filter configuration:', deliveryFilter);

      // Load analytics and letters data from Firestore
      const [analyticsData, lettersData] = await Promise.all([
        deliveryService.getAnalytics(timeFrame),
        deliveryService.getLetters(deliveryFilter)
      ]);

      console.log('📈 Analytics data:', analyticsData);
      console.log('📋 Letters data:', lettersData.length, 'letters');

      setAnalytics(analyticsData);
      setLetters(lettersData as LetterWithUser[]);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      
      // Show more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Fallback to empty data on error
      setAnalytics({
        lettersSent: { count: 0, change: 0 },
        faxesSent: { count: 0, change: 0 },
        successRate: { percentage: 0, change: 0 },
        totalDelivered: { count: 0, change: 0 }
      });
      setLetters([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLetters = letters.filter(letter => {
    const matchesSearch = letter.letterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         letter.memberId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         letter.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         letter.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (letter.createdBy && letter.createdBy.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status filtering - map letter status to HTTP status codes for filtering
    const statusCodeMap: { [key in Letter['status']]: number } = {
      'delivered': 200,
      'sent': 202,
      'pending': 102,
      'failed': 500,
      'cancelled': 499
    };
    
    const letterStatusCode = statusCodeMap[letter.status];
    const matchesStatus = filters.status.length === 0 || filters.status.includes(letterStatusCode);
    const matchesDeliveryMethod = filters.deliveryMethod.length === 0 || filters.deliveryMethod.includes(letter.deliveryMethod);
    
    return matchesSearch && matchesStatus && matchesDeliveryMethod;
  });

  const sortedLetters = [...filteredLetters].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortConfig.key === 'memberName') {
      aValue = a.memberName;
      bValue = b.memberName;
    } else if (sortConfig.key === 'createdBy') {
      aValue = a.createdBy || 'System';
      bValue = b.createdBy || 'System';
    } else {
      aValue = a[sortConfig.key as keyof LetterWithUser];
      bValue = b[sortConfig.key as keyof LetterWithUser];
    }

    if (aValue instanceof Date || bValue instanceof Date) {
      aValue = aValue instanceof Date ? aValue.getTime() : new Date(aValue).getTime();
      bValue = bValue instanceof Date ? bValue.getTime() : new Date(bValue).getTime();
    }

    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectLetter = (letterId: string, checked: boolean) => {
    const newSelected = new Set(selectedLetters);
    if (checked) {
      newSelected.add(letterId);
    } else {
      newSelected.delete(letterId);
    }
    setSelectedLetters(newSelected);
  };

  const handleSelectAllLetters = (checked: boolean) => {
    if (checked) {
      setSelectedLetters(new Set(sortedLetters.map(l => l.id)));
    } else {
      setSelectedLetters(new Set());
    }
  };

  const handleBulkAction = async (action: 'resend' | 'cancel' | 'void') => {
    const letterIds = Array.from(selectedLetters);
    
    if (action === 'cancel' || action === 'void') {
      if (!confirm(`Are you sure you want to ${action} ${letterIds.length} letters?`)) return;
    }

    try {
      const selectedLetterObjects = letters.filter(l => letterIds.includes(l.id));
      
      switch (action) {
        case 'resend':
          await Promise.all(selectedLetterObjects.map(letter => 
            letter.deliveryStatusId ? deliveryService.resendDelivery(letter.deliveryStatusId) : Promise.resolve()
          ));
          break;
        case 'cancel':
          await Promise.all(selectedLetterObjects.map(letter => 
            letter.deliveryStatusId ? deliveryService.cancelDelivery(letter.deliveryStatusId) : Promise.resolve()
          ));
          break;
        case 'void':
          await Promise.all(selectedLetterObjects.map(letter => 
            letter.deliveryStatusId ? deliveryService.voidDelivery(letter.deliveryStatusId) : Promise.resolve()
          ));
          break;
      }
      
      setSelectedLetters(new Set());
      // Reload data after action
      await loadData();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const handleResendLetter = async (letter: LetterWithUser) => {
    console.log('Resending letter:', letter.id);
    try {
      if (letter.deliveryStatusId) {
        await deliveryService.resendDelivery(letter.deliveryStatusId);
        await loadData();
      }
    } catch (error) {
      console.error('Error resending letter:', error);
    }
  };

  const handleCancelLetter = async (letter: LetterWithUser) => {
    if (confirm(`Are you sure you want to cancel letter ${letter.referenceNumber}?`)) {
      console.log('Cancelling letter:', letter.id);
      try {
        if (letter.deliveryStatusId) {
          await deliveryService.cancelDelivery(letter.deliveryStatusId);
          await loadData();
        }
      } catch (error) {
        console.error('Error cancelling letter:', error);
      }
    }
  };

  const handleVoidLetter = async (letter: LetterWithUser) => {
    if (confirm(`Are you sure you want to void letter ${letter.referenceNumber}?`)) {
      console.log('Voiding letter:', letter.id);
      try {
        if (letter.deliveryStatusId) {
          await deliveryService.voidDelivery(letter.deliveryStatusId);
          await loadData();
        }
      } catch (error) {
        console.error('Error voiding letter:', error);
      }
    }
  };

  const handlePreviewLetter = (letter: LetterWithUser) => {
    console.log('Previewing letter:', letter.id);
    // Implementation for letter preview
  };

  const formatDate = (date: Date | string | Timestamp | any): string => {
    try {
      let dateObj: Date;
      
      if (!date) return 'Unknown';
      
      if (date instanceof Timestamp || (date && typeof date === 'object' && 'toDate' in date)) {
        dateObj = date.toDate();
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return 'Unknown';
      }

      if (isNaN(dateObj.getTime())) return 'Unknown';

      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={classNames(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        config.bg,
        config.text
      )}>
        {config.label}
      </span>
    );
  };

  const activeFiltersCount = filters.status.length + filters.deliveryMethod.length + 
                           (filters.dateRange.start && filters.dateRange.end ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-2 text-zinc-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HomeIcon className="h-8 w-8 text-gray-400 mr-4" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600">Monitor letter delivery status and analytics in real-time</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <select
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(e.target.value)}
                  className="block pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm rounded-md bg-white"
                >
                  <option value="last-24h">Last 24 hours</option>
                  <option value="last-week">Last week</option>
                  <option value="last-month">Last month</option>
                  <option value="last-quarter">Last quarter</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PaperAirplaneIcon className="h-7 w-7 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Letters Sent</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics?.lettersSent.count.toLocaleString()}
                    </div>
                    <div className={classNames(
                      "ml-2 flex items-baseline text-sm font-semibold",
                      analytics && analytics.lettersSent.change >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {analytics && analytics.lettersSent.change >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      )}
                      <span className="ml-1">
                        {Math.abs(analytics?.lettersSent.change || 0)}%
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PrinterIcon className="h-7 w-7 text-purple-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Faxes Sent</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics?.faxesSent.count.toLocaleString()}
                    </div>
                    <div className={classNames(
                      "ml-2 flex items-baseline text-sm font-semibold",
                      analytics && analytics.faxesSent.change >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {analytics && analytics.faxesSent.change >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      )}
                      <span className="ml-1">
                        {Math.abs(analytics?.faxesSent.change || 0)}%
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-7 w-7 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics?.successRate.percentage}%
                    </div>
                    <div className={classNames(
                      "ml-2 flex items-baseline text-sm font-semibold",
                      analytics && analytics.successRate.change >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {analytics && analytics.successRate.change >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      )}
                      <span className="ml-1">
                        {Math.abs(analytics?.successRate.change || 0)}%
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckIcon className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Delivered</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics?.totalDelivered.count.toLocaleString()}
                    </div>
                    <div className={classNames(
                      "ml-2 flex items-baseline text-sm font-semibold",
                      analytics && analytics.totalDelivered.change >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {analytics && analytics.totalDelivered.change >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      )}
                      <span className="ml-1">
                        {Math.abs(analytics?.totalDelivered.change || 0)}%
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search letters by reference, member ID, or letter name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
              />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className={classNames(
                "inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500",
                activeFiltersCount > 0 ? "bg-gray-100 border-gray-400" : ""
              )}
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-900 text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {selectedLetters.size > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {selectedLetters.size} letter{selectedLetters.size === 1 ? '' : 's'} selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('resend')}
                    className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-1" />
                    Resend
                  </button>
                  <button
                    onClick={() => handleBulkAction('cancel')}
                    className="inline-flex items-center px-3 py-2 border border-amber-300 shadow-sm text-sm leading-4 font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                  <button
                    onClick={() => handleBulkAction('void')}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    Void
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Letters Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="relative w-12 px-4 sm:w-16 sm:px-6">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-zinc-600 focus:ring-zinc-500"
                      checked={selectedLetters.size === sortedLetters.length && sortedLetters.length > 0}
                      ref={(el) => {
                        if (el) el.indeterminate = selectedLetters.size > 0 && selectedLetters.size < sortedLetters.length;
                      }}
                      onChange={(e) => handleSelectAllLetters(e.target.checked)}
                    />
                  </th>
                  <th scope="col" className="min-w-[240px] py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('referenceNumber')}
                    >
                      Reference / Letter
                      <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                        <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="w-36 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('memberName')}
                    >
                      Member
                      <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                        <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="w-24 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('deliveryMethod')}
                    >
                      Method
                      <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                        <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="w-28 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                        <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="w-40 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('sentAt')}
                    >
                      Sent At
                      <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                        <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="w-16 relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedLetters.length === 0 ? (
                  <tr>
                                          <td colSpan={8} className="px-6 py-14 text-center">
                      <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-300" />
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">No letters found</h3>
                      <p className="mt-2 text-gray-600 max-w-sm mx-auto">
                        {searchQuery || activeFiltersCount > 0 
                          ? 'No letters match your search criteria. Try adjusting your filters.' 
                          : 'No letters have been sent yet.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedLetters.map((letter) => (
                    <tr
                      key={letter.id}
                      className={classNames(
                        selectedLetters.has(letter.id) ? 'bg-gray-50' : 'bg-white',
                        'hover:bg-gray-50'
                      )}
                    >
                      <td className="relative w-12 px-4 sm:w-16 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-zinc-600 focus:ring-zinc-500"
                          checked={selectedLetters.has(letter.id)}
                          onChange={(e) => handleSelectLetter(letter.id, e.target.checked)}
                        />
                      </td>
                      <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm max-w-[240px]">
                        <div>
                          <div className="font-medium text-gray-900">
                            {letter.referenceNumber}
                          </div>
                          <div className="text-gray-500 truncate">
                            {letter.letterName}
                          </div>
                          {letter.errorMessage && (
                            <div className="text-red-500 text-xs mt-1 truncate">
                              {letter.errorMessage}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 w-36">
                        <div>
                          <div className="text-gray-900 font-medium">
                            {letter.memberName}
                          </div>
                          <div className="text-gray-500">
                            {letter.memberId}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 w-24">
                        <div className="flex items-center">
                          {letter.deliveryMethod === 'mail' ? (
                            <PaperAirplaneIcon className="h-4 w-4 text-blue-500 mr-1" />
                          ) : (
                            <PrinterIcon className="h-4 w-4 text-purple-500 mr-1" />
                          )}
                          <span className="capitalize">{letter.deliveryMethod}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm w-28">
                        <div className="flex items-center">
                          {getStatusBadge(letter.status)}
                          {letter.retryCount > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({letter.retryCount} retries)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 w-40">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {formatDate(letter.sentAt)}
                        </div>
                      </td>
                      <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium w-16">
                        <div className="relative">
                          <button
                            type="button"
                            data-dropdown-button="true"
                            className="inline-flex items-center rounded-full bg-white p-2 text-gray-400 shadow-sm hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 border border-gray-200 hover:border-gray-300"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === letter.id ? null : letter.id);
                            }}
                          >
                            <span className="sr-only">Open options</span>
                            <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          
                          {openDropdown === letter.id && (
                            <div 
                              ref={(el) => { dropdownRefs.current[letter.id] = el; }}
                              className="absolute right-0 z-50 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                            >
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                    handlePreviewLetter(letter);
                                  }}
                                  className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                  <EyeIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                  Preview Letter
                                </button>
                                {(letter.status === 'failed' || letter.status === 'cancelled') && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setOpenDropdown(null);
                                      handleResendLetter(letter);
                                    }}
                                    className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                  >
                                    <ArrowPathIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                    Resend Letter
                                  </button>
                                )}
                              </div>
                              <div className="py-1">
                                {letter.status === 'pending' && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setOpenDropdown(null);
                                      handleCancelLetter(letter);
                                    }}
                                    className="group flex w-full items-center px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 hover:text-orange-900"
                                  >
                                    <XMarkIcon className="mr-3 h-4 w-4 text-orange-400 group-hover:text-orange-500" />
                                    Cancel Letter
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                    handleVoidLetter(letter);
                                  }}
                                  className="group flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900"
                                >
                                  <ExclamationTriangleIcon className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500" />
                                  Void Letter
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowFilters(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  onClick={() => setShowFilters(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Filter Letters
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-2 space-y-2">
                        {[
                          { label: 'Delivered', value: 200 },
                          { label: 'Sent', value: 202 },
                          { label: 'Pending', value: 102 },
                          { label: 'Failed', value: 500 },
                          { label: 'Cancelled', value: 499 }
                        ].map((status) => (
                          <label key={status.value} className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-zinc-600 focus:ring-zinc-500 border-gray-300 rounded"
                              checked={filters.status.includes(status.value)}
                              onChange={(e) => {
                                const newStatus = e.target.checked
                                  ? [...filters.status, status.value]
                                  : filters.status.filter(s => s !== status.value);
                                setFilters({ ...filters, status: newStatus });
                              }}
                            />
                            <span className="ml-2 text-sm text-gray-700">{status.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Delivery Method</label>
                      <div className="mt-2 space-y-2">
                        {['mail', 'fax'].map((method) => (
                          <label key={method} className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-zinc-600 focus:ring-zinc-500 border-gray-300 rounded"
                              checked={filters.deliveryMethod.includes(method)}
                              onChange={(e) => {
                                const newMethods = e.target.checked
                                  ? [...filters.deliveryMethod, method]
                                  : filters.deliveryMethod.filter(m => m !== method);
                                setFilters({ ...filters, deliveryMethod: newMethods });
                              }}
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">{method}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Include Test Data</label>
                      <div className="mt-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-zinc-600 focus:ring-zinc-500 border-gray-300 rounded"
                            checked={filters.test === true}
                            onChange={(e) => {
                              setFilters({ ...filters, test: e.target.checked ? true : false });
                            }}
                          />
                          <span className="ml-2 text-sm text-gray-700">Show test deliveries</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-zinc-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-500 sm:ml-3 sm:w-auto"
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => {
                    setFilters({
                      status: [],
                      deliveryMethod: [],
                      dateRange: { start: '', end: '' },
                      test: false
                    });
                    setShowFilters(false);
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
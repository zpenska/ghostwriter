// src/app/(dashboard)/campaigns/page.tsx
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
  MegaphoneIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  PlayIcon,
  PlusIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { Timestamp } from 'firebase/firestore';
import { campaignService } from '@/lib/services/campaign-service';

// Types (these should match your campaign-service.ts)
interface CampaignEvent {
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

interface CampaignAnalytics {
  campaignsRun: { count: number; change: number };
  membersReached: { count: number; change: number };
  successRate: { percentage: number; change: number };
  totalTemplates: { count: number; change: number };
}

interface CampaignFilter {
  status?: string[];
  deliveryMethod?: string[];
  triggeredBy?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface CampaignTemplate {
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

interface Population {
  populationId: string;
  populationName: string;
  visibilityLevel: string;
  addedFilters: number;
  estimatedSize: number;
  lastRunAt: Timestamp;
  sourceSystem: string;
}

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface FilterState {
  status: string[];
  deliveryMethod: string[];
  triggeredBy: string[];
  dateRange: { start: string; end: string };
}

interface SortConfig {
  key: keyof CampaignEvent | 'campaignName' | 'populationName';
  direction: 'asc' | 'desc';
}

export default function CampaignsPage() {
  const [campaignEvents, setCampaignEvents] = useState<CampaignEvent[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [populations, setPopulations] = useState<Population[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [timeFrame, setTimeFrame] = useState('last-week');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'sentAt', direction: 'desc' });
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    deliveryMethod: [],
    triggeredBy: [],
    dateRange: { start: '', end: '' }
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
      console.log('🚀 Loading campaign dashboard data...');
      
      // Test connection
      const connectionTest = await campaignService.testConnection();
      console.log('🔬 Campaign service connection test:', connectionTest);
      
      if (!connectionTest.success) {
        console.error('❌ Campaign service connection failed');
        throw new Error('Failed to connect to campaign service');
      }

      // Create campaign filter from current filters
      const campaignFilter: CampaignFilter = {};

      if (filters.status.length > 0) {
        campaignFilter.status = filters.status;
      }

      if (filters.deliveryMethod.length > 0) {
        campaignFilter.deliveryMethod = filters.deliveryMethod;
      }

      if (filters.triggeredBy.length > 0) {
        campaignFilter.triggeredBy = filters.triggeredBy;
      }

      if (filters.dateRange.start && filters.dateRange.end) {
        campaignFilter.dateRange = {
          start: new Date(filters.dateRange.start),
          end: new Date(filters.dateRange.end)
        };
      }

      // Load all data in parallel
      const [analyticsData, eventsData, templatesData, populationsData] = await Promise.all([
        campaignService.getCampaignAnalytics(timeFrame),
        campaignService.getCampaignEvents(campaignFilter),
        campaignService.getCampaignTemplates(),
        campaignService.getPopulations()
      ]);

      console.log('📈 Campaign analytics:', analyticsData);
      console.log('📋 Campaign events:', eventsData.length, 'events');
      console.log('📄 Templates:', templatesData.length, 'templates');
      console.log('👥 Populations:', populationsData.length, 'populations');

      setAnalytics(analyticsData);
      setCampaignEvents(eventsData);
      setTemplates(templatesData);
      setPopulations(populationsData);

    } catch (error) {
      console.error('❌ Error loading campaign data:', error);
      
      // Fallback to empty data
      setAnalytics({
        campaignsRun: { count: 0, change: 0 },
        membersReached: { count: 0, change: 0 },
        successRate: { percentage: 0, change: 0 },
        totalTemplates: { count: 0, change: 0 }
      });
      setCampaignEvents([]);
      setTemplates([]);
      setPopulations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = campaignEvents.filter(event => {
    const matchesSearch = event.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.populationId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.populationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filters.status.length === 0 || filters.status.includes(event.status);
    const matchesDeliveryMethod = filters.deliveryMethod.length === 0 || filters.deliveryMethod.includes(event.deliveryMethod);
    const matchesTriggeredBy = filters.triggeredBy.length === 0 || filters.triggeredBy.includes(event.triggeredBy);
    
    return matchesSearch && matchesStatus && matchesDeliveryMethod && matchesTriggeredBy;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortConfig.key === 'campaignName') {
      aValue = a.campaignName;
      bValue = b.campaignName;
    } else if (sortConfig.key === 'populationName') {
      aValue = a.populationName;
      bValue = b.populationName;
    } else {
      aValue = a[sortConfig.key as keyof CampaignEvent];
      bValue = b[sortConfig.key as keyof CampaignEvent];
    }

    if (aValue instanceof Date || bValue instanceof Date || aValue instanceof Timestamp || bValue instanceof Timestamp) {
      if (aValue instanceof Timestamp) aValue = aValue.toDate();
      if (bValue instanceof Timestamp) bValue = bValue.toDate();
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

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    const newSelected = new Set(selectedEvents);
    if (checked) {
      newSelected.add(eventId);
    } else {
      newSelected.delete(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleSelectAllEvents = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(new Set(sortedEvents.map(e => e.id)));
    } else {
      setSelectedEvents(new Set());
    }
  };

  const handleBulkAction = async (action: 'retry' | 'cancel') => {
    const eventIds = Array.from(selectedEvents);
    
    if (!confirm(`Are you sure you want to ${action} ${eventIds.length} campaign${eventIds.length === 1 ? '' : 's'}?`)) {
      return;
    }

    try {
      await Promise.all(eventIds.map(id => 
        action === 'retry' ? campaignService.retryCampaign(id) : campaignService.cancelCampaign(id)
      ));
      
      setSelectedEvents(new Set());
      await loadData();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const handleRetryCampaign = async (event: CampaignEvent) => {
    try {
      await campaignService.retryCampaign(event.id);
      await loadData();
    } catch (error) {
      console.error('Error retrying campaign:', error);
    }
  };

  const handleCancelCampaign = async (event: CampaignEvent) => {
    if (confirm(`Are you sure you want to cancel campaign "${event.campaignName}"?`)) {
      try {
        await campaignService.cancelCampaign(event.id);
        await loadData();
      } catch (error) {
        console.error('Error cancelling campaign:', error);
      }
    }
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
      sent: { bg: 'bg-green-100', text: 'text-green-800', label: 'Sent' },
      queued: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Queued' },
      error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Error' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.queued;
    
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

  const getTriggeredByBadge = (triggeredBy: string) => {
    const isManual = triggeredBy === 'Manual';
    return (
      <span className={classNames(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        isManual ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
      )}>
        {triggeredBy}
      </span>
    );
  };

  const getVisibilityBadge = (level: string) => {
    const isRestricted = level !== '1 (Not Restricted)';
    return (
      <span className={classNames(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        isRestricted ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
      )}>
        {level}
      </span>
    );
  };

  const activeFiltersCount = filters.status.length + filters.deliveryMethod.length + 
                           filters.triggeredBy.length + 
                           (filters.dateRange.start && filters.dateRange.end ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-2 text-zinc-600">Loading campaigns...</p>
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
                <MegaphoneIcon className="h-8 w-8 text-gray-400 mr-4" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
                  <p className="text-gray-600">Monitor campaign delivery status and population-level metrics</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
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
                
                <button
                  onClick={() => setShowTriggerModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-zinc-600 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Trigger Campaign
                </button>
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
                <MegaphoneIcon className="h-7 w-7 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Campaigns Run</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics?.campaignsRun.count.toLocaleString()}
                    </div>
                    <div className={classNames(
                      "ml-2 flex items-baseline text-sm font-semibold",
                      analytics && analytics.campaignsRun.change >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {analytics && analytics.campaignsRun.change >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      )}
                      <span className="ml-1">
                        {Math.abs(analytics?.campaignsRun.change || 0)}%
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
                <UserGroupIcon className="h-7 w-7 text-purple-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Members Reached</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics?.membersReached.count.toLocaleString()}
                    </div>
                    <div className={classNames(
                      "ml-2 flex items-baseline text-sm font-semibold",
                      analytics && analytics.membersReached.change >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {analytics && analytics.membersReached.change >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      )}
                      <span className="ml-1">
                        {Math.abs(analytics?.membersReached.change || 0)}%
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
                <DocumentDuplicateIcon className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Templates</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics?.totalTemplates.count.toLocaleString()}
                    </div>
                    <div className={classNames(
                      "ml-2 flex items-baseline text-sm font-semibold",
                      analytics && analytics.totalTemplates.change >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {analytics && analytics.totalTemplates.change >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      )}
                      <span className="ml-1">
                        {Math.abs(analytics?.totalTemplates.change || 0)}%
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
                placeholder="Search campaigns by name, population ID, or population name..."
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

          {selectedEvents.size > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {selectedEvents.size} campaign{selectedEvents.size === 1 ? '' : 's'} selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('retry')}
                    className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-1" />
                    Retry
                  </button>
                  <button
                    onClick={() => handleBulkAction('cancel')}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Campaign Events Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="relative w-12 px-4 sm:w-16 sm:px-6">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-zinc-600 focus:ring-zinc-500"
                      checked={selectedEvents.size === sortedEvents.length && sortedEvents.length > 0}
                      ref={(el) => {
                        if (el) el.indeterminate = selectedEvents.size > 0 && selectedEvents.size < sortedEvents.length;
                      }}
                      onChange={(e) => handleSelectAllEvents(e.target.checked)}
                    />
                  </th>
                  <th scope="col" className="min-w-[200px] py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('campaignName')}
                    >
                      Campaign Name
                      <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                        <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="w-32 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('populationId')}
                    >
                      Population ID
                      <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                        <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="w-40 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('populationName')}
                    >
                      Population Name
                      <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
                        <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="w-24 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Size
                  </th>
                  <th scope="col" className="w-28 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
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
                  <th scope="col" className="w-32 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('triggeredBy')}
                    >
                      Triggered By
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
                {sortedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-14 text-center">
                      <MegaphoneIcon className="mx-auto h-16 w-16 text-gray-300" />
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">No campaigns found</h3>
                      <p className="mt-2 text-gray-600 max-w-sm mx-auto">
                        {searchQuery || activeFiltersCount > 0 
                          ? 'No campaigns match your search criteria. Try adjusting your filters.' 
                          : 'No campaigns have been run yet.'}
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => setShowTriggerModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-zinc-600 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Trigger First Campaign
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedEvents.map((event) => (
                    <tr
                      key={event.id}
                      className={classNames(
                        selectedEvents.has(event.id) ? 'bg-gray-50' : 'bg-white',
                        'hover:bg-gray-50'
                      )}
                    >
                      <td className="relative w-12 px-4 sm:w-16 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-zinc-600 focus:ring-zinc-500"
                          checked={selectedEvents.has(event.id)}
                          onChange={(e) => handleSelectEvent(event.id, e.target.checked)}
                        />
                      </td>
                      <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm max-w-[200px]">
                        <div className="font-medium text-gray-900 truncate">
                          {event.campaignName || 'Unknown Campaign'}
                        </div>
                        <div className="text-gray-500 text-xs">
                          ID: {event.campaignId}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm w-32">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {event.populationId}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900 w-40">
                        <div className="truncate">
                          {event.populationName || 'Unknown Population'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {event.addedFilters ? `${event.addedFilters} filters` : ''}
                          {event.visibilityLevel && (
                            <span className="ml-2">
                              {getVisibilityBadge(event.visibilityLevel)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 w-24">
                        <div className="text-gray-900 font-mono">
                          {event.memberCount?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Est: {event.estimatedSize?.toLocaleString() || 'Unknown'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 w-28">
                        <div className="flex items-center">
                          {event.deliveryMethod === 'lob' ? (
                            <PaperAirplaneIcon className="h-4 w-4 text-blue-500 mr-1" />
                          ) : event.deliveryMethod === 'fax' ? (
                            <PrinterIcon className="h-4 w-4 text-purple-500 mr-1" />
                          ) : (
                            <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
                          )}
                          <span className="capitalize">{event.deliveryMethod}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm w-28">
                        {getStatusBadge(event.status)}
                        {event.errorMessage && (
                          <div className="text-red-500 text-xs mt-1 truncate">
                            {event.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm w-32">
                        {getTriggeredByBadge(event.triggeredBy)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 w-40">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {formatDate(event.sentAt)}
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
                              setOpenDropdown(openDropdown === event.id ? null : event.id);
                            }}
                          >
                            <span className="sr-only">Open options</span>
                            <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          
                          {openDropdown === event.id && (
                            <div 
                              ref={(el) => { dropdownRefs.current[event.id] = el; }}
                              className="absolute right-0 z-50 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                            >
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                    // Handle view campaign details
                                  }}
                                  className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                  <EyeIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                  View Details
                                </button>
                                {(event.status === 'error' || event.status === 'cancelled') && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setOpenDropdown(null);
                                      handleRetryCampaign(event);
                                    }}
                                    className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                  >
                                    <ArrowPathIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                                    Retry Campaign
                                  </button>
                                )}
                              </div>
                              <div className="py-1">
                                {event.status === 'queued' && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setOpenDropdown(null);
                                      handleCancelCampaign(event);
                                    }}
                                    className="group flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900"
                                  >
                                    <XMarkIcon className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500" />
                                    Cancel Campaign
                                  </button>
                                )}
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
                    Filter Campaigns
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-2 space-y-2">
                        {[
                          { label: 'Sent', value: 'sent' },
                          { label: 'Queued', value: 'queued' },
                          { label: 'Error', value: 'error' },
                          { label: 'Cancelled', value: 'cancelled' }
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
                        {['lob', 'fax', 'docvault'].map((method) => (
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
                      <label className="text-sm font-medium text-gray-700">Triggered By</label>
                      <div className="mt-2 space-y-2">
                        {['Manual', 'Rules Builder'].map((trigger) => (
                          <label key={trigger} className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-zinc-600 focus:ring-zinc-500 border-gray-300 rounded"
                              checked={filters.triggeredBy.includes(trigger)}
                              onChange={(e) => {
                                const newTriggers = e.target.checked
                                  ? [...filters.triggeredBy, trigger]
                                  : filters.triggeredBy.filter(t => t !== trigger);
                                setFilters({ ...filters, triggeredBy: newTriggers });
                              }}
                            />
                            <span className="ml-2 text-sm text-gray-700">{trigger}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-zinc-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-500 sm:ml-3 sm:w-auto"
                  onClick={() => {
                    setShowFilters(false);
                    loadData(); // Apply filters
                  }}
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
                      triggeredBy: [],
                      dateRange: { start: '', end: '' }
                    });
                    setShowFilters(false);
                    loadData(); // Clear filters
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Campaign Modal - Simplified placeholder */}
      {showTriggerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowTriggerModal(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  onClick={() => setShowTriggerModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Trigger Campaign
                  </h3>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Manual campaign trigger interface would go here. This would include:
                    </p>
                    <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                      <li>Campaign template selection dropdown</li>
                      <li>Population selection dropdown</li>
                      <li>CSV upload for member data</li>
                      <li>Preview and validation</li>
                      <li>Delivery method configuration</li>
                    </ul>
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Available Templates:</strong> {templates.length}
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>Available Populations:</strong> {populations.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-zinc-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-500 sm:ml-3 sm:w-auto"
                  onClick={() => setShowTriggerModal(false)}
                >
                  Trigger Campaign
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setShowTriggerModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
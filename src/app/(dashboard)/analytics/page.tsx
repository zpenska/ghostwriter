'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  DocumentTextIcon,
  FolderIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  EyeIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';
import { deliveryService, AnalyticsData } from '@/lib/services/delivery-service';

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface ExtendedAnalytics {
  totalCost: { amount: number; change: number };
  avgCostPerLetter: { amount: number; change: number };
  topUsers: Array<{ name: string; count: number; cost: number }>;
  topCollections: Array<{ name: string; usage: number; successRate: number }>;
  topTemplates: Array<{ name: string; usage: number; cost: number }>;
  deliveryTrends: Array<{ date: string; mail: number; fax: number; cost: number }>;
  methodPerformance: {
    mail: { count: number; successRate: number; avgCost: number };
    fax: { count: number; successRate: number; avgCost: number };
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ExtendedAnalytics | null>(null);
  const [basicAnalytics, setBasicAnalytics] = useState<AnalyticsData | null>(null);
  const [timeFrame, setTimeFrame] = useState('last-month');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const router = useRouter();

  useEffect(() => {
    loadAnalyticsData();
  }, [timeFrame]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load basic analytics
      const basicData = await deliveryService.getAnalytics(timeFrame);
      setBasicAnalytics(basicData);
      
      // Mock extended analytics - replace with actual data
      const extendedData: ExtendedAnalytics = {
        totalCost: { amount: 2847.50, change: 15.3 },
        avgCostPerLetter: { amount: 1.24, change: -8.2 },
        topUsers: [
          { name: 'Dr. Jennifer Martinez', count: 156, cost: 487.50 },
          { name: 'Sarah Johnson', count: 134, cost: 398.20 },
          { name: 'System Automated', count: 298, cost: 892.40 },
          { name: 'Michael Foster', count: 87, cost: 267.80 },
          { name: 'Dr. Mark Chen', count: 76, cost: 234.60 }
        ],
        topCollections: [
          { name: 'Prior Authorizations', usage: 847, successRate: 94.2 },
          { name: 'Adverse Determinations', usage: 623, successRate: 91.8 },
          { name: 'Appeal Notices', usage: 445, successRate: 96.1 },
          { name: 'Clinical Reviews', usage: 334, successRate: 88.7 },
          { name: 'Member Notifications', usage: 267, successRate: 97.3 }
        ],
        topTemplates: [
          { name: 'Prior Authorization Approval', usage: 445, cost: 1247.80 },
          { name: 'Adverse Determination Notice', usage: 387, cost: 1089.50 },
          { name: 'Appeal Rights Information', usage: 298, cost: 834.20 },
          { name: 'Clinical Review Outcome', usage: 234, cost: 657.40 },
          { name: 'Member Portal Notification', usage: 189, cost: 529.80 }
        ],
        deliveryTrends: [
          { date: '2024-06-01', mail: 45, fax: 32, cost: 234.50 },
          { date: '2024-06-02', mail: 52, fax: 28, cost: 287.60 },
          { date: '2024-06-03', mail: 38, fax: 41, cost: 312.40 },
          { date: '2024-06-04', mail: 61, fax: 35, cost: 378.20 },
          { date: '2024-06-05', mail: 47, fax: 29, cost: 298.80 },
          { date: '2024-06-06', mail: 55, fax: 33, cost: 334.70 },
          { date: '2024-06-07', mail: 43, fax: 38, cost: 297.50 }
        ],
        methodPerformance: {
          mail: { count: 1247, successRate: 96.8, avgCost: 1.45 },
          fax: { count: 892, successRate: 89.3, avgCost: 0.95 }
        }
      };
      
      setAnalytics(extendedData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-2 text-zinc-600">Loading analytics...</p>
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
                <ChartBarIcon className="h-8 w-8 text-gray-400 mr-4" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                  <p className="text-gray-600">Comprehensive insights into delivery performance and costs</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {/* Export functionality */}}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Export
                </button>
                <select
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(e.target.value)}
                  className="block pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm rounded-md bg-white"
                >
                  <option value="last-7d">Last 7 days</option>
                  <option value="last-month">Last month</option>
                  <option value="last-quarter">Last quarter</option>
                  <option value="last-year">Last year</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'cost', name: 'Cost Analysis', icon: CurrencyDollarIcon },
              { id: 'delivery', name: 'Delivery Performance', icon: CheckCircleIcon },
              { id: 'users', name: 'User Analytics', icon: UsersIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={classNames(
                  activeTab === tab.id
                    ? 'border-zinc-500 text-zinc-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center'
                )}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Cost</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(analytics?.totalCost.amount || 0)}
                        </div>
                        <div className={classNames(
                          "ml-2 flex items-baseline text-sm font-semibold",
                          analytics && analytics.totalCost.change >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {analytics && analytics.totalCost.change >= 0 ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                          )}
                          <span className="ml-1">
                            {Math.abs(analytics?.totalCost.change || 0)}%
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
                    <CheckCircleIcon className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {basicAnalytics?.successRate.percentage}%
                        </div>
                        <div className={classNames(
                          "ml-2 flex items-baseline text-sm font-semibold",
                          basicAnalytics && basicAnalytics.successRate.change >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {basicAnalytics && basicAnalytics.successRate.change >= 0 ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                          )}
                          <span className="ml-1">
                            {Math.abs(basicAnalytics?.successRate.change || 0)}%
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
                    <DocumentTextIcon className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Letters</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {((basicAnalytics?.lettersSent.count || 0) + (basicAnalytics?.faxesSent.count || 0)).toLocaleString()}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                          <span className="ml-1">12%</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-7 w-7 text-amber-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Cost/Letter</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(analytics?.avgCostPerLetter.amount || 0)}
                        </div>
                        <div className={classNames(
                          "ml-2 flex items-baseline text-sm font-semibold",
                          analytics && analytics.avgCostPerLetter.change >= 0 ? "text-red-600" : "text-green-600"
                        )}>
                          {analytics && analytics.avgCostPerLetter.change >= 0 ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                          )}
                          <span className="ml-1">
                            {Math.abs(analytics?.avgCostPerLetter.change || 0)}%
                          </span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Delivery Trends Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Delivery Trends (Last 7 Days)
                  </h3>
                </div>
                <div className="p-6">
                  <div className="h-80">
                    {/* Custom CSS Chart */}
                    <div className="flex items-end justify-between h-full space-x-2">
                      {analytics?.deliveryTrends.map((day, index) => {
                        const maxTotal = Math.max(...(analytics?.deliveryTrends || []).map(d => d.mail + d.fax));
                        const totalHeight = ((day.mail + day.fax) / maxTotal) * 100;
                        const mailHeight = (day.mail / (day.mail + day.fax)) * totalHeight;
                        const faxHeight = (day.fax / (day.mail + day.fax)) * totalHeight;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col justify-end h-64 mb-2">
                              <div 
                                className="w-full bg-sky-500 rounded-t-sm transition-all duration-300 hover:bg-sky-600"
                                style={{ height: `${mailHeight}%` }}
                                title={`Mail: ${day.mail}`}
                              ></div>
                              <div 
                                className="w-full bg-violet-500 transition-all duration-300 hover:bg-violet-600"
                                style={{ height: `${faxHeight}%` }}
                                title={`Fax: ${day.fax}`}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 text-center">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-center mt-4 space-x-6">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-sky-500 rounded mr-2"></div>
                        <span className="text-sm text-gray-600">Mail Deliveries</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-violet-500 rounded mr-2"></div>
                        <span className="text-sm text-gray-600">Fax Deliveries</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Method Performance Chart */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Success Rate by Method
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Mail</span>
                          <span className="text-sm text-gray-600">{analytics?.methodPerformance.mail.successRate || 0}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-3">
                          <div 
                            className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${analytics?.methodPerformance.mail.successRate || 0}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {analytics?.methodPerformance.mail.count} letters
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Fax</span>
                          <span className="text-sm text-gray-600">{analytics?.methodPerformance.fax.successRate || 0}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-3">
                          <div 
                            className="bg-amber-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${analytics?.methodPerformance.fax.successRate || 0}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {analytics?.methodPerformance.fax.count} faxes
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Distribution Chart */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Cost Distribution
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-center mb-6">
                    {/* Custom Donut Chart */}
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="transparent"
                          className="opacity-20"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#0ea5e9"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${60 * 2.51} ${251.2 - (60 * 2.51)}`}
                          className="transition-all duration-300"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#8b5cf6"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${40 * 2.51} ${251.2 - (40 * 2.51)}`}
                          strokeDashoffset={-60 * 2.51}
                          className="transition-all duration-300"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(analytics?.totalCost.amount || 0)}
                          </div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                        <span className="text-sm text-gray-600">Mail</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">60%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                        <span className="text-sm text-gray-600">Fax</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">40%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Collections */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FolderIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Top Collections
                    </h3>
                    <button className="text-sm text-zinc-600 hover:text-zinc-900">View All</button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics?.topCollections.map((collection, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{collection.name}</div>
                          <div className="text-sm text-gray-500">{collection.usage} letters</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPercentage(collection.successRate)}
                          </div>
                          <div className="text-xs text-gray-500">success rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Templates */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Top Templates
                    </h3>
                    <button className="text-sm text-zinc-600 hover:text-zinc-900">View All</button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics?.topTemplates.map((template, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500">{template.usage} uses</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(template.cost)}
                          </div>
                          <div className="text-xs text-gray-500">total cost</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Users */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <UsersIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Most Active Users
                    </h3>
                    <button className="text-sm text-zinc-600 hover:text-zinc-900">View All</button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics?.topUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.count} letters sent</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(user.cost)}
                          </div>
                          <div className="text-xs text-gray-500">total cost</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Daily Cost Trends */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Daily Cost Trends
                  </h3>
                </div>
                <div className="p-6">
                  <div className="h-64">
                    {/* Custom Line Chart */}
                    <div className="relative h-full">
                      <svg className="w-full h-full" viewBox="0 0 400 200">
                        {/* Grid Lines */}
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        {/* Data Line */}
                        {analytics?.deliveryTrends && (
                          <polyline
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            points={analytics.deliveryTrends.map((day, index) => {
                              const x = (index / (analytics.deliveryTrends.length - 1)) * 360 + 20;
                              const maxCost = Math.max(...analytics.deliveryTrends.map(d => d.cost));
                              const y = 180 - ((day.cost / maxCost) * 160);
                              return `${x},${y}`;
                            }).join(' ')}
                          />
                        )}
                        
                        {/* Data Points */}
                        {analytics?.deliveryTrends.map((day, index) => {
                          const x = (index / (analytics.deliveryTrends.length - 1)) * 360 + 20;
                          const maxCost = Math.max(...analytics.deliveryTrends.map(d => d.cost));
                          const y = 180 - ((day.cost / maxCost) * 160);
                          return (
                            <circle
                              key={index}
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#10b981"
                              stroke="white"
                              strokeWidth="2"
                              className="hover:r-6 transition-all duration-200"
                            >
                              <title>{`${new Date(day.date).toLocaleDateString()}: ${formatCurrency(day.cost)}`}</title>
                            </circle>
                          );
                        })}
                      </svg>
                      
                      {/* X-axis labels */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-5">
                        {analytics?.deliveryTrends.map((day, index) => (
                          <div key={index} className="text-xs text-gray-500">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cost Analysis Tab */}
        {activeTab === 'cost' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Cost Analysis</h3>
              <p className="mt-1 text-sm text-gray-500">Detailed cost breakdowns and trends coming soon</p>
            </div>
          </div>
        )}

        {/* Delivery Performance Tab */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Delivery Performance</h3>
              <p className="mt-1 text-sm text-gray-500">Performance metrics and delivery insights coming soon</p>
            </div>
          </div>
        )}

        {/* User Analytics Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">User Analytics</h3>
              <p className="mt-1 text-sm text-gray-500">User activity and performance metrics coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
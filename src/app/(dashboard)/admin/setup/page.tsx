'use client';

import { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, Cog6ToothIcon, TruckIcon } from '@heroicons/react/24/outline';
import { variableTestService } from '@/lib/services/variable-test-service';
import { deliveryTestService } from '@/lib/services/delivery-test-service';
import { templateService } from '@/lib/services/template-service';

export default function AdminSetupPage() {
  const [testDataStatus, setTestDataStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [collectionsStatus, setCollectionsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [existingTestData, setExistingTestData] = useState<any[]>([]);
  const [existingCollections, setExistingCollections] = useState<any[]>([]);
  const [existingDeliveries, setExistingDeliveries] = useState<any[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkExistingData = async () => {
    try {
      addLog('Checking existing data...');
      
      // Check test data
      const testData = await variableTestService.getAllTestData();
      setExistingTestData(testData);
      addLog(`Found ${testData.length} existing test data sets`);
      
      // Check collections
      const collections = await templateService.getCollections();
      setExistingCollections(collections);
      addLog(`Found ${collections.length} existing template collections`);
      
      // Check delivery status data
      const deliveries = await deliveryTestService.getAllTestData();
      setExistingDeliveries(deliveries);
      addLog(`Found ${deliveries.length} existing delivery status records`);
      
      // Get delivery stats if data exists
      if (deliveries.length > 0) {
        const stats = await deliveryTestService.getDeliveryStats();
        setDeliveryStats(stats);
      }
      
    } catch (error) {
      addLog(`Error checking existing data: ${error}`);
    }
  };

  const initializeTestData = async () => {
    try {
      setTestDataStatus('loading');
      addLog('🚀 Starting variable test data initialization...');
      
      await variableTestService.initializeTestData();
      
      // Verify the data was created
      const allTestData = await variableTestService.getAllTestData();
      setExistingTestData(allTestData);
      
      addLog(`✅ Successfully created ${allTestData.length} test data sets:`);
      allTestData.forEach(data => {
        addLog(`   - ${data.name}: ${data.description}`);
      });
      
      setTestDataStatus('success');
      addLog('✅ Variable test data initialization complete!');
      
    } catch (error) {
      setTestDataStatus('error');
      addLog(`❌ Error initializing test data: ${error}`);
    }
  };

  const initializeCollections = async () => {
    try {
      setCollectionsStatus('loading');
      addLog('🚀 Starting template collections initialization...');
      
      await templateService.initializeDefaultCollections();
      
      // Verify the collections were created
      const allCollections = await templateService.getCollections();
      setExistingCollections(allCollections);
      
      addLog(`✅ Successfully initialized ${allCollections.length} template collections:`);
      allCollections.forEach(collection => {
        addLog(`   - ${collection.name}: ${collection.description}`);
      });
      
      setCollectionsStatus('success');
      addLog('✅ Template collections initialization complete!');
      
    } catch (error) {
      setCollectionsStatus('error');
      addLog(`❌ Error initializing collections: ${error}`);
    }
  };

  const initializeDeliveryData = async () => {
    try {
      setDeliveryStatus('loading');
      addLog('🚀 Starting delivery status test data initialization...');
      
      await deliveryTestService.initializeTestData();
      
      // Verify the data was created
      const allDeliveries = await deliveryTestService.getAllTestData();
      setExistingDeliveries(allDeliveries);
      
      // Get stats
      const stats = await deliveryTestService.getDeliveryStats();
      setDeliveryStats(stats);
      
      addLog(`✅ Successfully created ${allDeliveries.length} delivery status records:`);
      addLog(`   - Fax deliveries: ${stats?.byType.fax || 0}`);
      addLog(`   - Mail deliveries: ${stats?.byType.lob || 0}`);
      addLog(`   - Email deliveries: ${stats?.byType.email || 0}`);
      addLog(`   - Success rate: ${stats?.successRate || 0}%`);
      
      setDeliveryStatus('success');
      addLog('✅ Delivery status test data initialization complete!');
      
    } catch (error) {
      setDeliveryStatus('error');
      addLog(`❌ Error initializing delivery data: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Initialize check on block mount
  useState(() => {
    checkExistingData();
  });

  return (
    <div className="min-h-screen bg-[#F5F5F1] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Cog6ToothIcon className="h-8 w-8 text-[#8a7fae]" />
            <div>
              <h1 className="text-2xl font-semibold text-[#3d3d3c]" style={{ fontFamily: 'Radio Grotesk, sans-serif' }}>
                Admin Setup
              </h1>
              <p className="text-sm text-[#44474F]">
                One-time initialization for Ghostwriter data structures
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">Important</h3>
                <p className="text-sm text-amber-700 mt-1">
                  These operations should only be run once during initial setup. 
                  Check existing data before running initialization scripts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Variable Test Data Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#3d3d3c]" style={{ fontFamily: 'Radio Grotesk, sans-serif' }}>
                Variable Test Data
              </h2>
              {testDataStatus === 'success' && (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              )}
            </div>
            
            <p className="text-sm text-[#44474F] mb-4">
              Initialize sample data for testing template variables with realistic healthcare scenarios.
            </p>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-[#3d3d3c]">
                Current Status: {existingTestData.length} test data sets
              </p>
              {existingTestData.length > 0 && (
                <ul className="text-xs text-[#44474F] mt-2 space-y-1">
                  {existingTestData.slice(0, 3).map((data, index) => (
                    <li key={index}>• {data.name}</li>
                  ))}
                  {existingTestData.length > 3 && (
                    <li>• ... and {existingTestData.length - 3} more</li>
                  )}
                </ul>
              )}
            </div>
            
            <button
              onClick={initializeTestData}
              disabled={testDataStatus === 'loading' || existingTestData.length > 0}
              className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                existingTestData.length > 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : testDataStatus === 'loading'
                  ? 'bg-[#8a7fae] text-white opacity-50 cursor-not-allowed'
                  : 'bg-[#8a7fae] text-white hover:bg-[#7a6f9e]'
              }`}
            >
              {testDataStatus === 'loading' 
                ? 'Initializing...' 
                : existingTestData.length > 0 
                ? 'Already Initialized' 
                : 'Initialize Test Data'
              }
            </button>
          </div>

          {/* Template Collections Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#3d3d3c]" style={{ fontFamily: 'Radio Grotesk, sans-serif' }}>
                Template Collections
              </h2>
              {collectionsStatus === 'success' && (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              )}
            </div>
            
            <p className="text-sm text-[#44474F] mb-4">
              Initialize default template collections for organizing letter templates.
            </p>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-[#3d3d3c]">
                Current Status: {existingCollections.length} collections
              </p>
              {existingCollections.length > 0 && (
                <ul className="text-xs text-[#44474F] mt-2 space-y-1">
                  {existingCollections.map((collection, index) => (
                    <li key={index}>• {collection.name}</li>
                  ))}
                </ul>
              )}
            </div>
            
            <button
              onClick={initializeCollections}
              disabled={collectionsStatus === 'loading' || existingCollections.length > 0}
              className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                existingCollections.length > 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : collectionsStatus === 'loading'
                  ? 'bg-[#3a4943] text-white opacity-50 cursor-not-allowed'
                  : 'bg-[#3a4943] text-white hover:bg-[#2d3a35]'
              }`}
            >
              {collectionsStatus === 'loading' 
                ? 'Initializing...' 
                : existingCollections.length > 0 
                ? 'Already Initialized' 
                : 'Initialize Collections'
              }
            </button>
          </div>

          {/* Delivery Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#3d3d3c]" style={{ fontFamily: 'Radio Grotesk, sans-serif' }}>
                Delivery Status Data
              </h2>
              {deliveryStatus === 'success' && (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              )}
            </div>
            
            <p className="text-sm text-[#44474F] mb-4">
              Initialize sample delivery status records for testing dashboard and tracking features.
            </p>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-[#3d3d3c]">
                Current Status: {existingDeliveries.length} delivery records
              </p>
              {deliveryStats && (
                <div className="text-xs text-[#44474F] mt-2 space-y-1">
                  <div>• Fax: {deliveryStats.byType.fax}, Mail: {deliveryStats.byType.lob}, Email: {deliveryStats.byType.email}</div>
                  <div>• Success rate: {deliveryStats.successRate}%</div>
                  <div>• Total cost: ${(deliveryStats.totalCost / 100).toFixed(2)}</div>
                </div>
              )}
            </div>
            
            <button
              onClick={initializeDeliveryData}
              disabled={deliveryStatus === 'loading' || existingDeliveries.length > 0}
              className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                existingDeliveries.length > 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : deliveryStatus === 'loading'
                  ? 'bg-[#d4c57f] text-[#3d3d3c] opacity-50 cursor-not-allowed'
                  : 'bg-[#d4c57f] text-[#3d3d3c] hover:bg-[#c4b56f]'
              }`}
            >
              {deliveryStatus === 'loading' 
                ? 'Initializing...' 
                : existingDeliveries.length > 0 
                ? 'Already Initialized' 
                : 'Initialize Delivery Data'
              }
            </button>
          </div>
        </div>

        {/* Delivery Stats Overview */}
        {deliveryStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <TruckIcon className="h-6 w-6 text-[#d4c57f]" />
              <h2 className="text-lg font-semibold text-[#3d3d3c]" style={{ fontFamily: 'Radio Grotesk, sans-serif' }}>
                Delivery Statistics Overview
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8a7fae]">{deliveryStats.total}</div>
                <div className="text-sm text-[#44474F]">Total Deliveries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#3a4943]">{deliveryStats.byStatus.delivered}</div>
                <div className="text-sm text-[#44474F]">Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#d4c57f]">{deliveryStats.byStatus.pending + deliveryStats.byStatus.processing}</div>
                <div className="text-sm text-[#44474F]">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{deliveryStats.byStatus.failed}</div>
                <div className="text-sm text-[#44474F]">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#a88868]">${(deliveryStats.totalCost / 100).toFixed(2)}</div>
                <div className="text-sm text-[#44474F]">Total Cost</div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#3d3d3c]" style={{ fontFamily: 'Radio Grotesk, sans-serif' }}>
              Activity Log
            </h2>
            <button
              onClick={clearLogs}
              className="text-sm text-[#44474F] hover:text-[#3d3d3c] underline"
            >
              Clear Log
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-[#44474F] italic">No activity yet...</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono text-[#3d3d3c]">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#3d3d3c] mb-4" style={{ fontFamily: 'Radio Grotesk, sans-serif' }}>
            Quick Actions
          </h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={checkExistingData}
              className="px-4 py-2 bg-gray-100 text-[#3d3d3c] rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Refresh Status
            </button>
            
            <a
              href="/templates"
              className="px-4 py-2 bg-[#d4c57f] text-[#3d3d3c] rounded-lg hover:bg-[#c4b56f] text-sm font-medium inline-block"
            >
              View Templates
            </a>
            
            <a
              href="/template-builder"
              className="px-4 py-2 bg-[#8a7fae] text-white rounded-lg hover:bg-[#7a6f9e] text-sm font-medium inline-block"
            >
              Template Builder
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
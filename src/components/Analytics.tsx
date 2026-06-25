import React, { useState } from 'react';
import { format, subMonths } from 'date-fns';
import AdvancedAnalytics from './AdvancedAnalytics';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'advanced'>('overview');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Detailed insights into your spending patterns and trends
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">📊</span>
              Overview
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">🔍</span>
              Advanced Analytics
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📈</div>
              <p>Basic analytics overview coming soon</p>
              <p className="text-sm mt-2">Try the Advanced Analytics tab for detailed insights</p>
            </div>
          )}
          {activeTab === 'advanced' && <AdvancedAnalytics />}
        </div>
      </div>
    </div>
  );
}
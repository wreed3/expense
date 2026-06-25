import React, { useState } from 'react';
import TagManager from './TagManager';
import CustomFieldManager from './CustomFieldManager';
import CurrencySettings from './CurrencySettings';

type SettingsTab = 'currencies' | 'tags' | 'custom-fields';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('currencies');

  const tabs = [
    { id: 'currencies' as SettingsTab, label: 'Currencies', icon: '💱' },
    { id: 'tags' as SettingsTab, label: 'Tags', icon: '🏷️' },
    { id: 'custom-fields' as SettingsTab, label: 'Custom Fields', icon: '📝' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your currencies, tags, and custom fields
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'currencies' && <CurrencySettings />}
          {activeTab === 'tags' && <TagManager />}
          {activeTab === 'custom-fields' && <CustomFieldManager />}
        </div>
      </div>
    </div>
  );
}
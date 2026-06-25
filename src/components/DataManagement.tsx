import React from 'react';
import ImportExport from './ImportExport';

export default function DataManagement() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-600 mt-2">
          Import, export, and backup your expense data
        </p>
      </div>

      <ImportExport />
    </div>
  );
}
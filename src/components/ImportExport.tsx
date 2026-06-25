import React, { useState, useRef } from 'react';
import { useImportExportStore } from '../stores/importExportStore';
import { useExpenseStore } from '../stores/expenseStore';
import toast from 'react-hot-toast';

export default function ImportExport() {
  const {
    importExpenses,
    exportToExcel,
    downloadBackup,
    restoreBackup,
    downloadTemplate,
    isImporting,
    isExporting,
    importResult,
    clearImportResult,
  } = useImportExportStore();

  const { fetchExpenses } = useExpenseStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const [exportFilters, setExportFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
  });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importExpenses(file);
      if (result.imported_count > 0) {
        toast.success(`Successfully imported ${result.imported_count} expenses`);
        fetchExpenses();
      }
      if (result.error_count > 0) {
        toast.error(`${result.error_count} expenses failed to import`);
      }
    } catch (error: any) {
      toast.error(error.message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const filters: any = {};
      if (exportFilters.start_date) filters.start_date = exportFilters.start_date;
      if (exportFilters.end_date) filters.end_date = exportFilters.end_date;
      if (exportFilters.category_id) filters.category_id = exportFilters.category_id;

      await exportToExcel(filters);
      toast.success('Expenses exported successfully');
    } catch (error: any) {
      toast.error('Failed to export expenses');
    }
  };

  const handleBackup = async () => {
    try {
      await downloadBackup();
      toast.success('Backup created successfully');
    } catch (error: any) {
      toast.error('Failed to create backup');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('This will restore your data from the backup. Continue?')) {
      return;
    }

    try {
      await restoreBackup(file);
      toast.success('Backup restored successfully');
      fetchExpenses();
    } catch (error: any) {
      toast.error(error.message);
    }

    // Reset file input
    if (backupInputRef.current) {
      backupInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
      toast.success('Template downloaded');
    } catch (error: any) {
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Expenses</h2>
        <p className="text-gray-600 mb-4">
          Import expenses from CSV or Excel files. Download the template to see the required format.
        </p>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : 'Choose File'}
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Download Template
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Import Results */}
        {importResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Import Results</h3>
              <button
                onClick={clearImportResult}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.imported_count}
                </div>
                <div className="text-sm text-gray-600">Imported</div>
              </div>
              <div className="bg-red-50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.error_count}
                </div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {importResult.errors.map((error: any, index: number) => (
                    <div key={index} className="text-sm bg-red-50 p-2 rounded">
                      <span className="font-medium">Row {error.row}:</span>{' '}
                      {typeof error.error === 'string' ? error.error : JSON.stringify(error.error)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Expenses</h2>
        <p className="text-gray-600 mb-4">
          Export your expenses to Excel format with optional filters.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={exportFilters.start_date}
                onChange={(e) => setExportFilters({ ...exportFilters, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={exportFilters.end_date}
                onChange={(e) => setExportFilters({ ...exportFilters, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Backup & Restore</h2>
        <p className="text-gray-600 mb-4">
          Create a full backup of all your data or restore from a previous backup.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">💾</div>
            <h3 className="font-semibold text-gray-900 mb-2">Create Backup</h3>
            <p className="text-sm text-gray-600 mb-4">
              Download a complete backup of all your expenses, categories, budgets, and settings.
            </p>
            <button
              onClick={handleBackup}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isExporting ? 'Creating...' : 'Create Backup'}
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">📥</div>
            <h3 className="font-semibold text-gray-900 mb-2">Restore Backup</h3>
            <p className="text-sm text-gray-600 mb-4">
              Restore your data from a previous backup file. This will add to your existing data.
            </p>
            <button
              onClick={() => backupInputRef.current?.click()}
              disabled={isImporting}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {isImporting ? 'Restoring...' : 'Restore Backup'}
            </button>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json"
              onChange={handleRestore}
              className="hidden"
            />
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div className="text-sm text-yellow-800">
              <strong>Important:</strong> Restoring a backup will add the data to your existing records.
              Make sure to create a backup of your current data before restoring.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
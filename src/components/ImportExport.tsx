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

    if (!window.confirm('This will restore your data from the backup file. Continue?')) {
      if (backupInputRef.current) {
        backupInputRef.current.value = '';
      }
      return;
    }

    try {
      await restoreBackup(file);
      toast.success('Backup restored successfully');
      fetchExpenses();
    } catch (error: any) {
      toast.error(error.message);
    }

    if (backupInputRef.current) {
      backupInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import Expenses</h2>
            <p className="text-sm text-gray-600 mt-1">
              Import expenses from CSV or Excel files
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            Download Template
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className="cursor-pointer"
          >
            <div className="text-4xl mb-3">📁</div>
            <div className="text-lg font-medium text-gray-900 mb-1">
              Click to upload or drag and drop
            </div>
            <div className="text-sm text-gray-600">
              CSV or Excel files (max 10MB)
            </div>
          </label>
          {isImporting && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Importing...</p>
            </div>
          )}
        </div>

        {importResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Import Results</h3>
              <button
                onClick={clearImportResult}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.imported_count}
                </div>
                <div className="text-sm text-gray-600">Imported</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.error_count}
                </div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {importResult.errors.slice(0, 5).map((error: any, index: number) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      Row {error.row}: {JSON.stringify(error.error)}
                    </div>
                  ))}
                  {importResult.errors.length > 5 && (
                    <div className="text-xs text-gray-600 text-center">
                      ... and {importResult.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Export Expenses</h2>
        <p className="text-sm text-gray-600 mb-4">
          Export your expenses to Excel format with optional filters
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave empty for all"
              value={exportFilters.category_id}
              onChange={(e) => setExportFilters({ ...exportFilters, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <span>📊</span>
              <span>Export to Excel</span>
            </>
          )}
        </button>
      </div>

      {/* Backup & Restore Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Backup & Restore</h2>
        <p className="text-sm text-gray-600 mb-4">
          Create a complete backup of all your data or restore from a previous backup
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-3xl mb-3">💾</div>
            <h3 className="font-semibold text-gray-900 mb-2">Create Backup</h3>
            <p className="text-sm text-gray-600 mb-4">
              Download a complete backup of all your expenses, categories, tags, and settings
            </p>
            <button
              onClick={handleBackup}
              disabled={isExporting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isExporting ? 'Creating...' : 'Create Backup'}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="font-semibold text-gray-900 mb-2">Restore Backup</h3>
            <p className="text-sm text-gray-600 mb-4">
              Restore your data from a previously created backup file
            </p>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json"
              onChange={handleRestore}
              className="hidden"
              id="restore-file"
            />
            <label
              htmlFor="restore-file"
              className="block w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-center cursor-pointer"
            >
              {isImporting ? 'Restoring...' : 'Choose Backup File'}
            </label>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div className="text-sm text-yellow-800">
              <strong>Important:</strong> Restoring a backup will add the data to your existing records.
              It will not delete your current data. Make sure to create a backup before restoring.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
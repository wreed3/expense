import { create } from 'zustand';
import api from '../utils/api';
import { format } from 'date-fns';

interface ImportResult {
  success: boolean;
  imported_count: number;
  error_count: number;
  imported: any[];
  errors: any[];
}

interface ImportExportState {
  isImporting: boolean;
  isExporting: boolean;
  importResult: ImportResult | null;
  error: string | null;

  importExpenses: (file: File) => Promise<ImportResult>;
  exportToExcel: (filters?: any) => Promise<void>;
  downloadBackup: () => Promise<void>;
  restoreBackup: (file: File) => Promise<void>;
  downloadTemplate: () => Promise<void>;
  clearImportResult: () => void;
}

export const useImportExportStore = create<ImportExportState>((set) => ({
  isImporting: false,
  isExporting: false,
  importResult: null,
  error: null,

  importExpenses: async (file: File) => {
    set({ isImporting: true, error: null, importResult: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/import-export/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      set({ importResult: response.data, isImporting: false });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to import expenses';
      set({ error: errorMessage, isImporting: false });
      throw new Error(errorMessage);
    }
  },

  exportToExcel: async (filters?: any) => {
    set({ isExporting: true, error: null });
    try {
      const response = await api.get('/import-export/export/excel', {
        params: filters,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      set({ isExporting: false });
    } catch (error: any) {
      const errorMessage = 'Failed to export expenses';
      set({ error: errorMessage, isExporting: false });
      throw new Error(errorMessage);
    }
  },

  downloadBackup: async () => {
    set({ isExporting: true, error: null });
    try {
      const response = await api.get('/import-export/backup', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expense-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      set({ isExporting: false });
    } catch (error: any) {
      const errorMessage = 'Failed to create backup';
      set({ error: errorMessage, isExporting: false });
      throw new Error(errorMessage);
    }
  },

  restoreBackup: async (file: File) => {
    set({ isImporting: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/import-export/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      set({ isImporting: false });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to restore backup';
      set({ error: errorMessage, isImporting: false });
      throw new Error(errorMessage);
    }
  },

  downloadTemplate: async () => {
    try {
      const response = await api.get('/import-export/template', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expense-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error('Failed to download template');
    }
  },

  clearImportResult: () => {
    set({ importResult: null });
  },
}));
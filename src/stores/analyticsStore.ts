import { create } from 'zustand';

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface SpendingSummary {
  totalSpent: number;
  budgetTotal: number;
  percentageUsed: number;
  categoryBreakdown: CategoryBreakdown[];
}

interface SpendingTrend {
  month: string;
  amount: number;
}

interface AnalyticsState {
  summary: SpendingSummary | null;
  trends: SpendingTrend[];
  categoryBreakdown: CategoryBreakdown[];
  isLoading: boolean;
  error: string | null;
  fetchSummary: (startDate?: string, endDate?: string) => Promise<void>;
  fetchTrends: (months?: number) => Promise<void>;
  fetchCategoryBreakdown: (startDate?: string, endDate?: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  summary: null,
  trends: [],
  categoryBreakdown: [],
  isLoading: false,
  error: null,

  fetchSummary: async (startDate?: string, endDate?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/analytics/summary?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics summary');
      }

      const data = await response.json();
      set({ summary: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false 
      });
    }
  },

  fetchTrends: async (months = 6) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/analytics/trends?months=${months}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch spending trends');
      }

      const data = await response.json();
      set({ trends: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false 
      });
    }
  },

  fetchCategoryBreakdown: async (startDate?: string, endDate?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/analytics/categories?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch category breakdown');
      }

      const data = await response.json();
      set({ categoryBreakdown: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false 
      });
    }
  },
}));
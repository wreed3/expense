import { create } from 'zustand';

interface SpendingSummary {
  totalSpent: number;
  budgetTotal: number;
  percentageUsed: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

interface SpendingTrend {
  month: string;
  amount: number;
}

interface AnalyticsState {
  summary: SpendingSummary | null;
  trends: SpendingTrend[];
  isLoading: boolean;
  error: string | null;
  fetchSummary: (startDate?: string, endDate?: string) => Promise<void>;
  fetchTrends: (months?: number) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  summary: null,
  trends: [],
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
}));
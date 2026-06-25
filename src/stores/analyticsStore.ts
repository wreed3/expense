import { create } from 'zustand';
import api from '../utils/api';

interface TrendData {
  historical: any[];
  forecast: any[];
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: string;
}

interface CategoryComparison {
  category_id: number;
  category_name: string;
  color: string;
  total: number;
  monthly: any[];
}

interface BudgetPerformance {
  performance: any[];
  summary: {
    total_budgets: number;
    over_budget: number;
    near_limit: number;
    on_track: number;
    total_budget: number;
    total_spent: number;
  };
}

interface MonthComparison {
  current_month: any;
  previous_month: any;
  changes: {
    expense_count: string;
    total_spent: string;
    avg_expense: string;
  };
}

interface Insight {
  type: 'warning' | 'alert' | 'info' | 'success' | 'tip';
  title: string;
  message: string;
  icon: string;
}

interface AnalyticsState {
  trends: TrendData | null;
  categoryComparison: CategoryComparison[];
  budgetPerformance: BudgetPerformance | null;
  heatmapData: any[];
  topExpenses: any[];
  monthComparison: MonthComparison | null;
  insights: Insight[];
  isLoading: boolean;
  error: string | null;
  
  fetchTrends: (months?: number) => Promise<void>;
  fetchCategoryComparison: (startDate: string, endDate: string, top?: number) => Promise<void>;
  fetchBudgetPerformance: () => Promise<void>;
  fetchHeatmap: (startDate: string, endDate: string) => Promise<void>;
  fetchTopExpenses: (startDate: string, endDate: string, limit?: number) => Promise<void>;
  fetchMonthComparison: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  fetchAllAnalytics: (startDate: string, endDate: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  trends: null,
  categoryComparison: [],
  budgetPerformance: null,
  heatmapData: [],
  topExpenses: [],
  monthComparison: null,
  insights: [],
  isLoading: false,
  error: null,

  fetchTrends: async (months = 12) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/analytics-advanced/trends', { params: { months } });
      set({ trends: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch trends',
        isLoading: false 
      });
    }
  },

  fetchCategoryComparison: async (startDate: string, endDate: string, top = 5) => {
    try {
      const response = await api.get('/analytics-advanced/category-comparison', {
        params: { start_date: startDate, end_date: endDate, top }
      });
      set({ categoryComparison: response.data });
    } catch (error: any) {
      console.error('Failed to fetch category comparison:', error);
    }
  },

  fetchBudgetPerformance: async () => {
    try {
      const response = await api.get('/analytics-advanced/budget-performance');
      set({ budgetPerformance: response.data });
    } catch (error: any) {
      console.error('Failed to fetch budget performance:', error);
    }
  },

  fetchHeatmap: async (startDate: string, endDate: string) => {
    try {
      const response = await api.get('/analytics-advanced/heatmap', {
        params: { start_date: startDate, end_date: endDate }
      });
      set({ heatmapData: response.data });
    } catch (error: any) {
      console.error('Failed to fetch heatmap:', error);
    }
  },

  fetchTopExpenses: async (startDate: string, endDate: string, limit = 10) => {
    try {
      const response = await api.get('/analytics-advanced/top-expenses', {
        params: { start_date: startDate, end_date: endDate, limit }
      });
      set({ topExpenses: response.data });
    } catch (error: any) {
      console.error('Failed to fetch top expenses:', error);
    }
  },

  fetchMonthComparison: async () => {
    try {
      const response = await api.get('/analytics-advanced/month-comparison');
      set({ monthComparison: response.data });
    } catch (error: any) {
      console.error('Failed to fetch month comparison:', error);
    }
  },

  fetchInsights: async () => {
    try {
      const response = await api.get('/analytics-advanced/insights');
      set({ insights: response.data });
    } catch (error: any) {
      console.error('Failed to fetch insights:', error);
    }
  },

  fetchAllAnalytics: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().fetchTrends(),
        get().fetchCategoryComparison(startDate, endDate),
        get().fetchBudgetPerformance(),
        get().fetchHeatmap(startDate, endDate),
        get().fetchTopExpenses(startDate, endDate),
        get().fetchMonthComparison(),
        get().fetchInsights(),
      ]);
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch analytics',
        isLoading: false 
      });
    }
  },
}));
import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import type { AnalyticsSummary, TrendData, CategoryAnalytics } from '../types';

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
}

interface UseAnalyticsReturn {
  summary: AnalyticsSummary | null;
  trends: TrendData[];
  categoryAnalytics: CategoryAnalytics[];
  loading: boolean;
  error: string | null;
  fetchSummary: (filters?: AnalyticsFilters) => Promise<void>;
  fetchTrends: (filters?: AnalyticsFilters) => Promise<void>;
  fetchCategoryAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<AnalyticsSummary>('/api/analytics/summary', { params: filters });
      setSummary(data);
    } catch (err) {
      const message = 'Failed to fetch analytics summary';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrends = useCallback(async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      const { data } = await api.get<TrendData[]>('/api/analytics/trends', { params: filters });
      setTrends(data);
    } catch (err) {
      toast.error('Failed to fetch trends');
    }
  }, []);

  const fetchCategoryAnalytics = useCallback(async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      const { data } = await api.get<CategoryAnalytics[]>('/api/analytics/categories', { params: filters });
      setCategoryAnalytics(data);
    } catch (err) {
      toast.error('Failed to fetch category analytics');
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchTrends();
    fetchCategoryAnalytics();
  }, [fetchSummary, fetchTrends, fetchCategoryAnalytics]);

  return {
    summary,
    trends,
    categoryAnalytics,
    loading,
    error,
    fetchSummary,
    fetchTrends,
    fetchCategoryAnalytics,
  };
};
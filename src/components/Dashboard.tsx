import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { format, subMonths } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="text-blue-600">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${
          trend.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { summary, loading } = useAnalytics();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const stats = useMemo(() => {
    if (!summary) {
      return {
        totalSpent: '$0.00',
        expenseCount: '0',
        averageExpense: '$0.00',
        topCategory: 'N/A',
      };
    }

    return {
      totalSpent: formatCurrency(summary.total),
      expenseCount: summary.count.toString(),
      averageExpense: formatCurrency(summary.average),
      topCategory: summary.categories[0]?.category_name || 'N/A',
    };
  }, [summary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">
          Overview of your expenses for {format(new Date(), 'MMMM yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Spent"
          value={stats.totalSpent}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard
          title="Total Expenses"
          value={stats.expenseCount}
          icon={<ShoppingCart className="w-6 h-6" />}
        />
        <StatCard
          title="Average Expense"
          value={stats.averageExpense}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="Top Category"
          value={stats.topCategory}
          icon={<TrendingDown className="w-6 h-6" />}
        />
      </div>

      {summary && summary.categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Spending by Category
          </h3>
          <div className="space-y-3">
            {summary.categories.map((category) => {
              const percentage = (category.total / summary.total) * 100;
              return (
                <div key={category.category_id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.category_color }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {category.category_name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(category.total)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: category.category_color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
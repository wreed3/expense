import React, { useEffect, useState } from 'react';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function AdvancedAnalytics() {
  const {
    trends,
    categoryComparison,
    budgetPerformance,
    heatmapData,
    topExpenses,
    monthComparison,
    insights,
    fetchAllAnalytics,
    isLoading,
  } = useAnalyticsStore();

  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchAllAnalytics(dateRange.start, dateRange.end);
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                insight.type === 'alert' ? 'bg-red-50 border-red-500' :
                insight.type === 'success' ? 'bg-green-50 border-green-500' :
                insight.type === 'tip' ? 'bg-blue-50 border-blue-500' :
                'bg-gray-50 border-gray-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                  <p className="text-sm text-gray-700">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Month-over-Month Comparison */}
      {monthComparison && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Month-over-Month Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
              <div className="text-2xl font-bold text-gray-900">
                {monthComparison.current_month.expense_count}
              </div>
              <div className={`text-sm mt-1 ${
                monthComparison.changes.expense_count.startsWith('+') ? 'text-red-600' : 'text-green-600'
              }`}>
                {monthComparison.changes.expense_count}% vs last month
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Spent</div>
              <div className="text-2xl font-bold text-gray-900">
                ${(monthComparison.current_month.total_spent || 0).toFixed(2)}
              </div>
              <div className={`text-sm mt-1 ${
                monthComparison.changes.total_spent.startsWith('+') ? 'text-red-600' : 'text-green-600'
              }`}>
                {monthComparison.changes.total_spent}% vs last month
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Average Expense</div>
              <div className="text-2xl font-bold text-gray-900">
                ${(monthComparison.current_month.avg_expense || 0).toFixed(2)}
              </div>
              <div className={`text-sm mt-1 ${
                monthComparison.changes.avg_expense.startsWith('+') ? 'text-red-600' : 'text-green-600'
              }`}>
                {monthComparison.changes.avg_expense}% vs last month
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spending Trends with Forecast */}
      {trends && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Spending Trends & Forecast</h2>
            <p className="text-sm text-gray-600">
              Trend: <span className={`font-semibold ${
                trends.trend === 'increasing' ? 'text-red-600' :
                trends.trend === 'decreasing' ? 'text-green-600' :
                'text-gray-600'
              }`}>
                {trends.trend} ({trends.trendPercentage}%)
              </span>
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[...trends.historical, ...trends.forecast]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Actual"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#EF4444" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Forecast"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Comparison */}
      {categoryComparison.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Category Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#3B82F6" name="Total Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Budget Performance */}
      {budgetPerformance && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Budget Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Budgets</div>
              <div className="text-2xl font-bold text-gray-900">
                {budgetPerformance.summary.total_budgets}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">On Track</div>
              <div className="text-2xl font-bold text-green-600">
                {budgetPerformance.summary.on_track}
              </div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Near Limit</div>
              <div className="text-2xl font-bold text-yellow-600">
                {budgetPerformance.summary.near_limit}
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Over Budget</div>
              <div className="text-2xl font-bold text-red-600">
                {budgetPerformance.summary.over_budget}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {budgetPerformance.performance.map((perf: any) => (
              <div key={perf.budget_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: perf.category_color }}
                    />
                    <span className="font-medium text-gray-900">{perf.category_name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    ${perf.spent.toFixed(2)} / ${perf.budget_amount.toFixed(2)}
                  </span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full ${
                      perf.percentage > 100 ? 'bg-red-500' :
                      perf.percentage > 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(perf.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-600">
                    {perf.expense_count} expense{perf.expense_count !== 1 ? 's' : ''}
                  </span>
                  <span className={`text-xs font-semibold ${
                    perf.percentage > 100 ? 'text-red-600' :
                    perf.percentage > 80 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {perf.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Expenses */}
      {topExpenses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Expenses</h2>
          <div className="space-y-3">
            {topExpenses.map((expense: any, index: number) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                  <div>
                    <div className="font-medium text-gray-900">{expense.description}</div>
                    <div className="text-sm text-gray-600">
                      {expense.category_name} • {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  ${expense.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending Heatmap */}
      {heatmapData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Spending Heatmap</h2>
          <div className="grid grid-cols-7 gap-2">
            {heatmapData.map((day: any) => {
              const intensity = Math.min(day.total / 100, 1); // Normalize to 0-1
              return (
                <div
                  key={day.date}
                  className="aspect-square rounded flex flex-col items-center justify-center text-xs cursor-pointer hover:ring-2 hover:ring-blue-500"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                    color: intensity > 0.5 ? 'white' : 'black'
                  }}
                  title={`${day.date}: $${day.total.toFixed(2)} (${day.count} expenses)`}
                >
                  <div className="font-semibold">{format(new Date(day.date), 'dd')}</div>
                  <div className="text-[10px]">${day.total.toFixed(0)}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                <div
                  key={intensity}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
}
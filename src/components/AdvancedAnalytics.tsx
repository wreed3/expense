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

      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`rounded-lg shadow p-4 ${
                insight.type === 'alert' ? 'bg-red-50 border-l-4 border-red-500' :
                insight.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                insight.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
                insight.type === 'tip' ? 'bg-blue-50 border-l-4 border-blue-500' :
                'bg-gray-50 border-l-4 border-gray-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Month Comparison */}
      {monthComparison && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Month-over-Month Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
              <div className="text-3xl font-bold text-gray-900">
                {monthComparison.current_month.expense_count}
              </div>
              <div className={`text-sm mt-1 ${
                parseFloat(monthComparison.changes.expense_count) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {parseFloat(monthComparison.changes.expense_count) > 0 ? '↑' : '↓'}{' '}
                {Math.abs(parseFloat(monthComparison.changes.expense_count))}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Total Spent</div>
              <div className="text-3xl font-bold text-gray-900">
                ${monthComparison.current_month.total_spent?.toFixed(2)}
              </div>
              <div className={`text-sm mt-1 ${
                parseFloat(monthComparison.changes.total_spent) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {parseFloat(monthComparison.changes.total_spent) > 0 ? '↑' : '↓'}{' '}
                {Math.abs(parseFloat(monthComparison.changes.total_spent))}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Average Expense</div>
              <div className="text-3xl font-bold text-gray-900">
                ${monthComparison.current_month.avg_expense?.toFixed(2)}
              </div>
              <div className={`text-sm mt-1 ${
                parseFloat(monthComparison.changes.avg_expense) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {parseFloat(monthComparison.changes.avg_expense) > 0 ? '↑' : '↓'}{' '}
                {Math.abs(parseFloat(monthComparison.changes.avg_expense))}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spending Trends with Forecast */}
      {trends && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Spending Trends & Forecast</h2>
            <div className={`px-3 py-1 rounded-full text-sm ${
              trends.trend === 'increasing' ? 'bg-red-100 text-red-800' :
              trends.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {trends.trend === 'increasing' ? '📈' : trends.trend === 'decreasing' ? '📉' : '➡️'}{' '}
              {trends.trend} ({trends.trendPercentage}%)
            </div>
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
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {budgetPerformance.summary.total_budgets}
              </div>
              <div className="text-sm text-gray-600">Total Budgets</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {budgetPerformance.summary.on_track}
              </div>
              <div className="text-sm text-gray-600">On Track</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {budgetPerformance.summary.near_limit}
              </div>
              <div className="text-sm text-gray-600">Near Limit</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {budgetPerformance.summary.over_budget}
              </div>
              <div className="text-sm text-gray-600">Over Budget</div>
            </div>
          </div>
          <div className="space-y-3">
            {budgetPerformance.performance.map((perf: any) => (
              <div key={perf.budget_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: perf.category_color }}
                    />
                    <span className="font-medium">{perf.category_name}</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    perf.percentage > 100 ? 'text-red-600' :
                    perf.percentage > 80 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {perf.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      perf.percentage > 100 ? 'bg-red-600' :
                      perf.percentage > 80 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(perf.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>${perf.spent.toFixed(2)} spent</span>
                  <span>${perf.budget_amount.toFixed(2)} budget</span>
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
              <div key={expense.id} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                  <div>
                    <div className="font-medium">{expense.description}</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(expense.date), 'MMM dd, yyyy')} • {expense.category_name}
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
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs text-gray-600 font-medium">
                {day}
              </div>
            ))}
            {heatmapData.map((day: any) => {
              const intensity = Math.min(day.total / 100, 1); // Normalize to 0-1
              return (
                <div
                  key={day.date}
                  className="aspect-square rounded cursor-pointer hover:opacity-75 transition-opacity"
                  style={{
                    backgroundColor: day.total > 0
                      ? `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`
                      : '#f3f4f6'
                  }}
                  title={`${day.date}: $${day.total.toFixed(2)} (${day.count} expenses)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-4 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
                <div
                  key={intensity}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgba(59, 130, 246, ${0.2 + intensity * 0.8})` }}
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
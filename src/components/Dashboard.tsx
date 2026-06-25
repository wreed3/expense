import React, { useEffect, useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { useBudgetStore } from '../stores/budgetStore';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { expenses, fetchExpenses } = useExpenseStore();
  const { budgets, fetchBudgets } = useBudgetStore();
  const { 
    insights, 
    monthComparison, 
    trends,
    fetchInsights, 
    fetchMonthComparison,
    fetchTrends 
  } = useAnalyticsStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchExpenses({
          start_date: startOfMonth(new Date()).toISOString(),
          end_date: endOfMonth(new Date()).toISOString(),
        }),
        fetchBudgets(),
        fetchInsights(),
        fetchMonthComparison(),
        fetchTrends(6),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentMonth = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expenseCount = expenses.length;

  // Calculate budget status
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const budgetUsed = (currentMonth / totalBudget) * 100;

  // Category breakdown
  const categoryData = expenses.reduce((acc, exp) => {
    const existing = acc.find(item => item.name === exp.category_name);
    if (existing) {
      existing.value += exp.amount;
    } else {
      acc.push({
        name: exp.category_name || 'Uncategorized',
        value: exp.amount,
        color: exp.category_color || '#3B82F6',
      });
    }
    return acc;
  }, [] as any[]);

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's your financial overview for {format(new Date(), 'MMMM yyyy')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${currentMonth.toFixed(2)}</p>
              {monthComparison && (
                <p className={`text-sm mt-1 ${
                  parseFloat(monthComparison.changes.total_spent) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {parseFloat(monthComparison.changes.total_spent) > 0 ? '↑' : '↓'}{' '}
                  {Math.abs(parseFloat(monthComparison.changes.total_spent))}% vs last month
                </p>
              )}
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{expenseCount}</p>
              {monthComparison && (
                <p className={`text-sm mt-1 ${
                  parseFloat(monthComparison.changes.expense_count) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {parseFloat(monthComparison.changes.expense_count) > 0 ? '↑' : '↓'}{' '}
                  {Math.abs(parseFloat(monthComparison.changes.expense_count))}% vs last month
                </p>
              )}
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget Used</p>
              <p className="text-2xl font-bold text-gray-900">{budgetUsed.toFixed(0)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    budgetUsed > 100 ? 'bg-red-600' :
                    budgetUsed > 80 ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Expense</p>
              <p className="text-2xl font-bold text-gray-900">
                ${expenseCount > 0 ? (currentMonth / expenseCount).toFixed(2) : '0.00'}
              </p>
              {monthComparison && (
                <p className={`text-sm mt-1 ${
                  parseFloat(monthComparison.changes.avg_expense) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {parseFloat(monthComparison.changes.avg_expense) > 0 ? '↑' : '↓'}{' '}
                  {Math.abs(parseFloat(monthComparison.changes.avg_expense))}% vs last month
                </p>
              )}
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Smart Insights</h2>
            <Link to="/analytics" className="text-sm text-blue-600 hover:text-blue-700">
              View All Analytics →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.slice(0, 3).map((insight, index) => (
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
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Spending Trend */}
        {trends && trends.historical.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Spending Trend</h2>
              <div className={`px-3 py-1 rounded-full text-xs ${
                trends.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                trends.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {trends.trend}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends.historical}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Category Breakdown</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
            <Link to="/expenses" className="text-sm text-blue-600 hover:text-blue-700">
              View All →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {expenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: expense.category_color }}
                  >
                    {expense.category_name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">{expense.category_name}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${expense.amount.toFixed(2)}
                  </p>
                  {expense.currency_code !== 'USD' && (
                    <p className="text-xs text-gray-500">{expense.currency_code}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <div className="text-4xl mb-3">📝</div>
              <p>No expenses yet this month</p>
              <Link to="/expenses" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                Add your first expense →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/expenses"
          className="bg-blue-50 hover:bg-blue-100 rounded-lg p-6 text-center transition-colors"
        >
          <div className="text-4xl mb-2">➕</div>
          <h3 className="font-semibold text-gray-900">Add Expense</h3>
          <p className="text-sm text-gray-600 mt-1">Track a new expense</p>
        </Link>
        <Link
          to="/analytics"
          className="bg-green-50 hover:bg-green-100 rounded-lg p-6 text-center transition-colors"
        >
          <div className="text-4xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-900">View Analytics</h3>
          <p className="text-sm text-gray-600 mt-1">Detailed insights</p>
        </Link>
        <Link
          to="/data-management"
          className="bg-purple-50 hover:bg-purple-100 rounded-lg p-6 text-center transition-colors"
        >
          <div className="text-4xl mb-2">💾</div>
          <h3 className="font-semibold text-gray-900">Import/Export</h3>
          <p className="text-sm text-gray-600 mt-1">Manage your data</p>
        </Link>
      </div>
    </div>
  );
}
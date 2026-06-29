import { useEffect } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { useBudgetStore } from '../stores/budgetStore';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { ExpenseList } from './ExpenseList';
import { BudgetOverview } from './BudgetOverview';
import { SpendingChart } from './SpendingChart';

export function Dashboard() {
  const { expenses, fetchExpenses } = useExpenseStore();
  const { budgets, fetchBudgets } = useBudgetStore();
  const { summary, fetchSummary } = useAnalyticsStore();

  useEffect(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    fetchExpenses({ startDate: startOfMonth, endDate: endOfMonth });
    fetchBudgets();
    fetchSummary(startOfMonth, endOfMonth);
  }, [fetchExpenses, fetchBudgets, fetchSummary]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Spent This Month</h3>
          <p className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Budget</h3>
          <p className="text-3xl font-bold text-gray-900">${totalBudget.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Budget Used</h3>
          <p className="text-3xl font-bold text-gray-900">{percentageUsed.toFixed(1)}%</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${percentageUsed > 90 ? 'bg-red-500' : percentageUsed > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetOverview />
        <SpendingChart />
      </div>

      <ExpenseList />
    </div>
  );
}
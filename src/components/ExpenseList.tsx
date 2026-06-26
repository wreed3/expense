import React, { useEffect } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { formatCurrency, formatDate } from '../utils/formatters';

export const ExpenseList: React.FC = () => {
  const { expenses, isLoading, error, fetchExpenses, deleteExpense } = useExpenseStore();

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading expenses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p className="text-lg">No expenses found</p>
        <p className="text-sm mt-2">Add your first expense to get started</p>
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
      } catch (error) {
        console.error('Failed to delete expense:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: expense.category.color + '20' }}
            >
              {expense.category.icon || '💰'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{expense.description}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium" style={{ color: expense.category.color }}>
                  {expense.category.name}
                </span>
                <span>•</span>
                <span>{formatDate(expense.date)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-bold text-lg text-gray-900">
                {formatCurrency(expense.amount)}
              </p>
              {expense.receipt_path && (
                <span className="text-xs text-gray-500" role="img" aria-label="Has receipt">
                  📎 Receipt
                </span>
              )}
              {expense.is_recurring && (
                <span className="text-xs text-blue-600" aria-label="Recurring expense">
                  🔄 Recurring
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                aria-label="Edit expense"
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                onClick={() => {/* TODO: Implement edit */}}
              >
                ✏️
              </button>
              <button
                aria-label="Delete expense"
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                onClick={() => handleDelete(expense.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
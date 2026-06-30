import React, { useState } from 'react';
import { Pencil, Trash2, Calendar, Tag, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Expense } from '../types';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setDeletingId(id);
      await onDelete(id);
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No expenses found</p>
        <p className="text-sm text-gray-500 mt-2">Add your first expense to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: expense.category_color }}
                />
                <span className="text-sm font-medium text-gray-600">
                  {expense.category_name}
                </span>
                {expense.is_recurring === 1 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {expense.recurring_frequency}
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {expense.description}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(expense.date)}</span>
                </div>
                {expense.receipt_path && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span>Receipt attached</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 ml-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(expense)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit expense"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  title="Delete expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
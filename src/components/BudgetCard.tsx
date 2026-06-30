import React from 'react';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import type { Budget } from '../types';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (id: number) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onEdit,
  onDelete,
}) => {
  const spent: number = budget.spent || 0;
  const percentage: number = (spent / budget.amount) * 100;
  const remaining: number = budget.amount - spent;
  const isOverBudget: boolean = spent > budget.amount;
  const isNearLimit: boolean = percentage >= 80 && !isOverBudget;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (): string => {
    if (isOverBudget) return 'text-red-600';
    if (isNearLimit) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (): string => {
    if (isOverBudget) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (): React.ReactNode => {
    if (isOverBudget) return <AlertCircle className="w-5 h-5" />;
    if (isNearLimit) return <TrendingUp className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: budget.category_color }}
          />
          <h3 className="text-lg font-semibold text-gray-900">
            {budget.category_name}
          </h3>
        </div>
        <div className={`flex items-center gap-1 ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">
              {formatCurrency(spent)} of {formatCurrency(budget.amount)}
            </span>
            <span className={getStatusColor()}>
              {percentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Remaining</p>
            <p className={`text-lg font-semibold ${
              remaining < 0 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatCurrency(Math.abs(remaining))}
              {remaining < 0 && ' over'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(budget)}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(budget.id)}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Period: {budget.period === 'monthly' ? 'Monthly' : 'Yearly'}
        </div>
      </div>
    </div>
  );
};
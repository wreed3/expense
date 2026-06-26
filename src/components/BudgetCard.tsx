import React from 'react';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface Budget {
  id: number;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  month: string;
  alert_threshold: number;
  category: {
    id: number;
    name: string;
    color: string;
    icon?: string;
  };
}

interface BudgetCardProps {
  budget: Budget;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget }) => {
  const getProgressColor = () => {
    if (budget.percentage >= 100) return 'bg-red-500';
    if (budget.percentage >= budget.alert_threshold * 100) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (budget.percentage >= 100) return 'Over budget';
    if (budget.percentage >= budget.alert_threshold * 100) return 'Approaching limit';
    return 'On track';
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: budget.category.color + '20' }}
          >
            {budget.category.icon || '💰'}
          </div>
          <div>
            <h3
              className="font-semibold text-lg"
              style={{ backgroundColor: budget.category.color, color: 'white', padding: '2px 8px', borderRadius: '4px' }}
            >
              {budget.category.name}
            </h3>
            <p className="text-sm text-gray-600">{formatMonth(budget.month)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(budget.amount)}</p>
          <p className="text-sm text-gray-600">Budget</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Spent</span>
          <span className="font-semibold">{formatCurrency(budget.spent)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Remaining</span>
          <span className="font-semibold">
            {budget.remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(budget.remaining))}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
          <span className="text-sm font-semibold">{formatPercentage(budget.percentage / 100)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3" role="progressbar" aria-valuenow={budget.percentage} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`h-3 rounded-full transition-all ${getProgressColor()}`}
            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
          />
        </div>
      </div>

      {budget.percentage >= 100 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            ⚠️ Over budget by {formatCurrency(Math.abs(budget.remaining))}
          </p>
        </div>
      )}

      {budget.percentage >= budget.alert_threshold * 100 && budget.percentage < 100 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ Approaching limit - {formatCurrency(budget.remaining)} remaining
          </p>
        </div>
      )}
    </div>
  );
};
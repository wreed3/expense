import { useEffect } from 'react';
import { useBudgetStore } from '../stores/budgetStore';
import { useCategoryStore } from '../stores/categoryStore';

export function BudgetOverview() {
  const { budgets, fetchBudgets } = useBudgetStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [fetchBudgets, fetchCategories]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
      <div className="space-y-4">
        {budgets.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No budgets set for this month</p>
        ) : (
          budgets.map((budget) => {
            const category = categories.find(c => c.id === budget.categoryId);
            const percentageUsed = (budget.spent || 0) / budget.amount * 100;
            
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{category?.name || 'Unknown'}</span>
                  <span className="text-sm text-gray-600">
                    ${(budget.spent || 0).toFixed(2)} / ${budget.amount.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      percentageUsed > 90 ? 'bg-red-500' : 
                      percentageUsed > 75 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
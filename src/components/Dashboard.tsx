import { useEffect } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { useCategoryStore } from '../stores/categoryStore';
import { ExpenseList } from './ExpenseList';
import { ExpenseForm } from './ExpenseForm';
import { CategoryManager } from './CategoryManager';
import { BudgetManager } from './BudgetManager';
import { Analytics } from './Analytics';
import { Header } from './Header';

export default function Dashboard() {
  const fetchExpenses = useExpenseStore((state) => state.fetchExpenses);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [fetchExpenses, fetchCategories]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ExpenseForm />
            <ExpenseList />
          </div>
          <div className="space-y-6">
            <Analytics />
            <BudgetManager />
            <CategoryManager />
          </div>
        </div>
      </main>
    </div>
  );
}
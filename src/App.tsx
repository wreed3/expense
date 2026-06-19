import { useState, useEffect } from 'react';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseStats } from './components/ExpenseStats';
import { FilterBar } from './components/FilterBar';
import { api, Expense, Category } from './api';
import { format, startOfMonth, endOfMonth } from 'date-fns';

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    categoryId: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, categoriesData] = await Promise.all([
        api.getExpenses(filters),
        api.getCategories(),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'category_name' | 'category_color' | 'category_icon'>) => {
    try {
      await api.createExpense(expense);
      await loadData();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleUpdateExpense = async (expense: Omit<Expense, 'created_at' | 'category_name' | 'category_color' | 'category_icon'>) => {
    try {
      await api.updateExpense(expense.id, expense);
      await loadData();
      setEditingExpense(null);
    } catch (error) {
      console.error('Failed to update expense:', error);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.deleteExpense(id);
        await loadData();
      } catch (error) {
        console.error('Failed to delete expense:', error);
      }
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Expense Tracker</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Add Expense
        </button>
      </header>

      <main className="app-main">
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          categories={categories}
        />

        <ExpenseStats 
          expenses={expenses}
          startDate={filters.startDate}
          endDate={filters.endDate}
        />

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <ExpenseList
            expenses={expenses}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
          />
        )}
      </main>

      {showForm && (
        <ExpenseForm
          categories={categories}
          expense={editingExpense}
          onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
}

export default App;
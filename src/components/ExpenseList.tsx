import React, { useEffect, useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { Expense } from '../types';
import { format } from 'date-fns';
import ExpenseForm from './ExpenseForm';
import AdvancedSearch from './AdvancedSearch';
import toast from 'react-hot-toast';

export default function ExpenseList() {
  const { expenses, pagination, filters, fetchExpenses, deleteExpense, bulkDelete, bulkTag, isLoading } = useExpenseStore();
  const { defaultCurrency, currencies, fetchCurrencies } = useCurrencyStore();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchExpenses();
    if (currencies.length === 0) {
      fetchCurrencies();
    }
  }, []);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        toast.success('Expense deleted successfully');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedExpenses.length} expenses?`)) {
      try {
        await bulkDelete(selectedExpenses);
        toast.success('Expenses deleted successfully');
        setSelectedExpenses([]);
        setShowBulkActions(false);
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  const toggleExpenseSelection = (id: number) => {
    setSelectedExpenses(prev => 
      prev.includes(id) ? prev.filter(expId => expId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(expenses.map(e => e.id));
    }
  };

  const getCurrencySymbol = (code: string) => {
    const currency = currencies.find(c => c.code === code);
    return currency?.symbol || code;
  };

  const formatAmount = (amount: number, currencyCode: string) => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toFixed(2)}`;
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof typeof filters];
    if (key === 'sort_by' || key === 'sort_order') return false;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`px-4 py-2 rounded-md ${
                hasActiveFilters 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔍 {hasActiveFilters ? 'Filters Active' : 'Advanced Search'}
            </button>
            {selectedExpenses.length > 0 && (
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Bulk Actions ({selectedExpenses.length})
              </button>
            )}
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Add Expense
            </button>
          </div>
        </div>

        {showBulkActions && selectedExpenses.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-purple-900 font-medium">
                {selectedExpenses.length} expense{selectedExpenses.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => {
                    setSelectedExpenses([]);
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-900 text-sm">
                Filters are active. Showing filtered results.
              </span>
              <button
                onClick={() => {
                  useExpenseStore.getState().clearFilters();
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No expenses found</p>
          <p className="text-sm">
            {hasActiveFilters 
              ? 'Try adjusting your filters or clear them to see all expenses.'
              : 'Start by adding your first expense!'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.includes(expense.id)}
                        onChange={() => toggleExpenseSelection(expense.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {expense.description}
                        {expense.is_recurring && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            Recurring
                          </span>
                        )}
                        {expense.receipt_path && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                            📎
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${expense.category_color}20`,
                          color: expense.category_color,
                        }}
                      >
                        {expense.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {expense.tags && expense.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {expense.tags.map(tag => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 rounded-full text-xs"
                              style={{
                                backgroundColor: tag.color ? `${tag.color}20` : '#3B82F620',
                                color: tag.color || '#3B82F6',
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatAmount(expense.amount, expense.currency_code)}
                      {expense.currency_code !== defaultCurrency?.code && (
                        <span className="text-xs text-gray-500 ml-1">
                          {expense.currency_code}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total > pagination.limit && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchExpenses({ ...filters, offset: Math.max(0, pagination.offset - pagination.limit) })}
                    disabled={pagination.offset === 0}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchExpenses({ ...filters, offset: pagination.offset + pagination.limit })}
                    disabled={!pagination.has_more}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <ExpenseForm
          expense={editingExpense || undefined}
          onClose={handleFormClose}
        />
      )}

      {isSearchOpen && (
        <AdvancedSearch onClose={() => setIsSearchOpen(false)} />
      )}
    </div>
  );
}
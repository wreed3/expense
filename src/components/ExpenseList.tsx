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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  const handlePageChange = (newPage: number) => {
    fetchExpenses({ ...filters, offset: (newPage - 1) * (filters.limit || 20) });
  };

  if (isLoading && expenses.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">
            {pagination ? `${pagination.total} total expenses` : 'Manage your expenses'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ➕ Add Expense
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            🔍 Search
          </button>
        </div>
      </div>

      {/* View Mode Toggle & Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md text-sm ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              📱 Grid
            </button>
          </div>

          {selectedExpenses.length > 0 && (
            <div className="flex gap-2 w-full sm:w-auto">
              <span className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm">
                {selectedExpenses.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => setSelectedExpenses([])}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expenses List/Grid */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses found</h3>
          <p className="text-gray-600 mb-6">Start tracking your expenses by adding your first one</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Your First Expense
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.length === expenses.length}
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
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${expense.category_color}20`,
                              color: expense.category_color,
                            }}
                          >
                            {expense.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {expense.tags?.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                                style={{
                                  backgroundColor: `${tag.color || '#3B82F6'}20`,
                                  color: tag.color || '#3B82F6',
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          ${expense.amount.toFixed(2)}
                          {expense.currency_code !== 'USD' && (
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

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <div key={expense.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={() => toggleExpenseSelection(expense.id)}
                          className="rounded mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                          </p>
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
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${expense.category_color}20`,
                          color: expense.category_color,
                        }}
                      >
                        {expense.category_name}
                      </span>
                      {expense.tags?.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                          style={{
                            backgroundColor: `${tag.color || '#3B82F6'}20`,
                            color: tag.color || '#3B82F6',
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => toggleExpenseSelection(expense.id)}
                      className="rounded"
                    />
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ${expense.amount.toFixed(2)}
                      </p>
                      {expense.currency_code !== 'USD' && (
                        <p className="text-xs text-gray-500">{expense.currency_code}</p>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{expense.description}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${expense.category_color}20`,
                        color: expense.category_color,
                      }}
                    >
                      {expense.category_name}
                    </span>
                    {expense.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: `${tag.color || '#3B82F6'}20`,
                          color: tag.color || '#3B82F6',
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {expense.tags && expense.tags.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{expense.tags.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-700">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.total_pages}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ExpenseForm expense={editingExpense || undefined} onClose={handleFormClose} />
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AdvancedSearch onClose={() => setIsSearchOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
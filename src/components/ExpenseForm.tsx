import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { useCategoryStore } from '../stores/categoryStore';
import { validateAmount, validateDate } from '../utils/validators';

interface ExpenseFormProps {
  expense?: {
    id: number;
    amount: number;
    description: string;
    category_id: number;
    date: string;
    is_recurring?: boolean;
    recurring_frequency?: string;
  };
  onSuccess?: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, onSuccess }) => {
  const { addExpense, updateExpense } = useExpenseStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [formData, setFormData] = useState({
    amount: expense?.amount || '',
    description: expense?.description || '',
    category_id: expense?.category_id || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    is_recurring: expense?.is_recurring || false,
    recurring_frequency: expense?.recurring_frequency || 'monthly',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (!validateAmount(formData.amount)) {
      newErrors.amount = 'Amount must be positive';
    }

    if (!formData.description) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (!validateDate(formData.date, { allowFuture: false })) {
      newErrors.date = 'Date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount.toString()),
        category_id: parseInt(formData.category_id.toString()),
      };

      if (expense) {
        await updateExpense(expense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }

      // Reset form
      setFormData({
        amount: '',
        description: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        is_recurring: false,
        recurring_frequency: 'monthly',
      });

      onSuccess?.();
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Server error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          inputMode="decimal"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          id="description"
          name="description"
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
        {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="receipt" className="block text-sm font-medium text-gray-700">
          Receipt (optional)
        </label>
        <input
          id="receipt"
          name="receipt"
          type="file"
          accept="image/*,.pdf"
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="flex items-center">
        <input
          id="isRecurring"
          name="isRecurring"
          type="checkbox"
          checked={formData.is_recurring}
          onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900">
          Recurring expense
        </label>
      </div>

      {formData.is_recurring && (
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
            Frequency
          </label>
          <select
            id="frequency"
            name="frequency"
            value={formData.recurring_frequency}
            onChange={(e) => setFormData({ ...formData, recurring_frequency: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      )}

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
      </button>
    </form>
  );
};
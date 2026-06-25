import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useCustomFieldStore } from '../stores/customFieldStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { Expense } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import CurrencySelector from './CurrencySelector';
import TagSelector from './TagSelector';
import CustomFieldInput from './CustomFieldInput';

interface ExpenseFormProps {
  expense?: Expense;
  onClose: () => void;
}

export default function ExpenseForm({ expense, onClose }: ExpenseFormProps) {
  const { addExpense, updateExpense } = useExpenseStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { customFields, fetchCustomFields } = useCustomFieldStore();
  const { defaultCurrency, fetchCurrencies } = useCurrencyStore();

  const [formData, setFormData] = useState({
    amount: expense?.amount || 0,
    category_id: expense?.category_id || 0,
    description: expense?.description || '',
    date: expense?.date ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    is_recurring: expense?.is_recurring || false,
    recurring_frequency: expense?.recurring_frequency || null,
    currency_code: expense?.currency_code || 'USD',
    tags: expense?.tags?.map(t => t.id) || [],
    custom_fields: expense?.custom_fields || {},
  });

  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
    if (customFields.length === 0) {
      fetchCustomFields();
    }
    if (!defaultCurrency) {
      fetchCurrencies();
    }
  }, []);

  useEffect(() => {
    if (!expense && defaultCurrency) {
      setFormData(prev => ({
        ...prev,
        currency_code: defaultCurrency.code,
      }));
    }
  }, [defaultCurrency, expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.category_id === 0) {
      toast.error('Please select a category');
      return;
    }

    // Validate required custom fields
    const requiredFields = customFields.filter(f => f.is_required);
    for (const field of requiredFields) {
      if (!formData.custom_fields[field.name]) {
        toast.error(`${field.name} is required`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        custom_fields: Object.keys(formData.custom_fields).length > 0 ? formData.custom_fields : undefined,
      };

      if (expense) {
        await updateExpense(expense.id, expenseData, receipt || undefined);
        toast.success('Expense updated successfully');
      } else {
        await addExpense(expenseData, receipt || undefined);
        toast.success('Expense created successfully');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {expense ? 'Edit Expense' : 'Add New Expense'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <CurrencySelector
              value={formData.currency_code}
              onChange={(code) => setFormData({ ...formData, currency_code: code })}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          <TagSelector
            selectedTags={formData.tags}
            onChange={(tags) => setFormData({ ...formData, tags })}
          />

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Information</h3>
              <div className="space-y-4">
                {customFields.map(field => (
                  <CustomFieldInput
                    key={field.id}
                    field={field}
                    value={formData.custom_fields[field.name]}
                    onChange={(value) => handleCustomFieldChange(field.name, value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recurring */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  is_recurring: e.target.checked,
                  recurring_frequency: e.target.checked ? 'monthly' : null,
                })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Recurring Expense</span>
            </label>

            {formData.is_recurring && (
              <select
                value={formData.recurring_frequency || 'monthly'}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  recurring_frequency: e.target.value as any,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt (optional)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {expense?.receipt_path && (
              <p className="mt-1 text-sm text-gray-500">
                Current receipt: {expense.receipt_path}
              </p>
            )}
            {receipt && (
              <p className="mt-1 text-sm text-green-600">
                New receipt selected: {receipt.name}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : expense ? 'Update Expense' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
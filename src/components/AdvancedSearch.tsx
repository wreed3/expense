import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTagStore } from '../stores/tagStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { ExpenseFilters } from '../types';
import { format } from 'date-fns';

interface AdvancedSearchProps {
  onClose: () => void;
}

export default function AdvancedSearch({ onClose }: AdvancedSearchProps) {
  const { filters, setFilters, fetchExpenses } = useExpenseStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { tags, fetchTags } = useTagStore();
  const { currencies, fetchCurrencies } = useCurrencyStore();

  const [localFilters, setLocalFilters] = useState<ExpenseFilters>({
    start_date: filters.start_date || '',
    end_date: filters.end_date || '',
    category_id: filters.category_id,
    min_amount: filters.min_amount,
    max_amount: filters.max_amount,
    search: filters.search || '',
    tags: filters.tags || [],
    currency: filters.currency || '',
    sort_by: filters.sort_by || 'date',
    sort_order: filters.sort_order || 'desc',
  });

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
    if (tags.length === 0) fetchTags();
    if (currencies.length === 0) fetchCurrencies();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up empty values
    const cleanedFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length === 0) return acc;
        acc[key as keyof ExpenseFilters] = value as any;
      }
      return acc;
    }, {} as ExpenseFilters);

    setFilters(cleanedFilters);
    fetchExpenses(cleanedFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: ExpenseFilters = {
      sort_by: 'date',
      sort_order: 'desc',
    };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
    fetchExpenses(resetFilters);
    onClose();
  };

  const toggleTag = (tagId: number) => {
    const currentTags = localFilters.tags || [];
    if (currentTags.includes(tagId)) {
      setLocalFilters({
        ...localFilters,
        tags: currentTags.filter(id => id !== tagId),
      });
    } else {
      setLocalFilters({
        ...localFilters,
        tags: [...currentTags, tagId],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Advanced Search</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Description
            </label>
            <input
              type="text"
              value={localFilters.search || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
              placeholder="Search in descriptions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={localFilters.start_date || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={localFilters.end_date || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Amount
              </label>
              <input
                type="number"
                value={localFilters.min_amount || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, min_amount: parseFloat(e.target.value) || undefined })}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Amount
              </label>
              <input
                type="number"
                value={localFilters.max_amount || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, max_amount: parseFloat(e.target.value) || undefined })}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={localFilters.category_id || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={localFilters.currency || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, currency: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Currencies</option>
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      (localFilters.tags || []).includes(tag.id)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: (localFilters.tags || []).includes(tag.id) 
                        ? tag.color || '#3B82F6' 
                        : undefined
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={localFilters.sort_by || 'date'}
                onChange={(e) => setLocalFilters({ ...localFilters, sort_by: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="description">Description</option>
                <option value="category_name">Category</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <select
                value={localFilters.sort_order || 'desc'}
                onChange={(e) => setLocalFilters({ ...localFilters, sort_order: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
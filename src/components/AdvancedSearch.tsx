import React, { useState } from 'react';
import { Search, X, Filter, Calendar, DollarSign, Tag } from 'lucide-react';
import { useCategoryStore } from '../stores/categoryStore';
import { useTagStore } from '../stores/tagStore';
import { useCurrencyStore } from '../stores/currencyStore';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClose: () => void;
}

export interface SearchFilters {
  query?: string;
  category_id?: number;
  min_amount?: number;
  max_amount?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  currency?: string;
  sort_by?: 'date' | 'amount' | 'description';
  sort_order?: 'asc' | 'desc';
}

export function AdvancedSearch({ onSearch, onClose }: AdvancedSearchProps) {
  const { categories } = useCategoryStore();
  const { tags } = useTagStore();
  const { currencies, selectedCurrency } = useCurrencyStore();
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    sort_by: 'date',
    sort_order: 'desc',
    currency: selectedCurrency
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      ...filters,
      tags: selectedTags.length > 0 ? selectedTags : undefined
    });
  };

  const handleReset = () => {
    setFilters({
      query: '',
      sort_by: 'date',
      sort_order: 'desc',
      currency: selectedCurrency
    });
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Advanced Search</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Text Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search Text
            </label>
            <input
              type="text"
              value={filters.query || ''}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="Search in description or notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category_id || ''}
              onChange={(e) => setFilters({
                ...filters,
                category_id: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={filters.min_amount || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  min_amount: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                placeholder="Min amount"
                step="0.01"
                min="0"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="number"
                value={filters.max_amount || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  max_amount: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                placeholder="Max amount"
                step="0.01"
                min="0"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value || undefined })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value || undefined })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Currency Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={filters.currency || ''}
              onChange={(e) => setFilters({ ...filters, currency: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Currencies</option>
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag.name)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-gray-500">No tags available</p>
              )}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={filters.sort_by || 'date'}
                onChange={(e) => setFilters({
                  ...filters,
                  sort_by: e.target.value as 'date' | 'amount' | 'description'
                })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="description">Description</option>
              </select>
              <select
                value={filters.sort_order || 'desc'}
                onChange={(e) => setFilters({
                  ...filters,
                  sort_order: e.target.value as 'asc' | 'desc'
                })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
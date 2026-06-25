import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useCategoryStore } from '../stores/categoryStore';
import { useTagStore } from '../stores/tagStore';
import { useCurrencyStore } from '../stores/currencyStore';

interface AdvancedSearchProps {
  onSearch: (params: any) => void;
  onClear: () => void;
}

export function AdvancedSearch({ onSearch, onClear }: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchParams, setSearchParams] = useState({
    query: '',
    start_date: '',
    end_date: '',
    min_amount: '',
    max_amount: '',
    category_ids: [] as number[],
    tag_ids: [] as number[],
    currency_codes: [] as string[],
    has_receipt: undefined as boolean | undefined,
    is_recurring: undefined as boolean | undefined,
  });

  const { categories } = useCategoryStore();
  const { tags } = useTagStore();
  const { currencies } = useCurrencyStore();

  const handleSearch = () => {
    const cleanParams: any = {};
    
    if (searchParams.query) cleanParams.query = searchParams.query;
    if (searchParams.start_date) cleanParams.start_date = searchParams.start_date;
    if (searchParams.end_date) cleanParams.end_date = searchParams.end_date;
    if (searchParams.min_amount) cleanParams.min_amount = parseFloat(searchParams.min_amount);
    if (searchParams.max_amount) cleanParams.max_amount = parseFloat(searchParams.max_amount);
    if (searchParams.category_ids.length > 0) cleanParams.category_ids = searchParams.category_ids;
    if (searchParams.tag_ids.length > 0) cleanParams.tag_ids = searchParams.tag_ids;
    if (searchParams.currency_codes.length > 0) cleanParams.currency_codes = searchParams.currency_codes;
    if (searchParams.has_receipt !== undefined) cleanParams.has_receipt = searchParams.has_receipt;
    if (searchParams.is_recurring !== undefined) cleanParams.is_recurring = searchParams.is_recurring;

    onSearch(cleanParams);
  };

  const handleClear = () => {
    setSearchParams({
      query: '',
      start_date: '',
      end_date: '',
      min_amount: '',
      max_amount: '',
      category_ids: [],
      tag_ids: [],
      currency_codes: [],
      has_receipt: undefined,
      is_recurring: undefined,
    });
    onClear();
  };

  const toggleCategory = (id: number) => {
    setSearchParams(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter(cid => cid !== id)
        : [...prev.category_ids, id]
    }));
  };

  const toggleTag = (id: number) => {
    setSearchParams(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(id)
        ? prev.tag_ids.filter(tid => tid !== id)
        : [...prev.tag_ids, id]
    }));
  };

  const toggleCurrency = (code: string) => {
    setSearchParams(prev => ({
      ...prev,
      currency_codes: prev.currency_codes.includes(code)
        ? prev.currency_codes.filter(c => c !== code)
        : [...prev.currency_codes, code]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      {/* Basic search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchParams.query}
            onChange={(e) => setSearchParams(prev => ({ ...prev, query: e.target.value }))}
            placeholder="Search expenses..."
            className="input pl-10"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`btn-secondary ${isExpanded ? 'bg-blue-50 text-blue-600' : ''}`}
        >
          <Filter className="w-5 h-5" />
          Filters
        </button>
        <button
          type="button"
          onClick={handleSearch}
          className="btn-primary"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="btn-secondary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Advanced filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t">
          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={searchParams.start_date}
                onChange={(e) => setSearchParams(prev => ({ ...prev, start_date: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={searchParams.end_date}
                onChange={(e) => setSearchParams(prev => ({ ...prev, end_date: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          {/* Amount range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min Amount</label>
              <input
                type="number"
                value={searchParams.min_amount}
                onChange={(e) => setSearchParams(prev => ({ ...prev, min_amount: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                className="input"
              />
            </div>
            <div>
              <label className="label">Max Amount</label>
              <input
                type="number"
                value={searchParams.max_amount}
                onChange={(e) => setSearchParams(prev => ({ ...prev, max_amount: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                className="input"
              />
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="label">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id!)}
                    className={`px-3 py-1 rounded text-sm ${
                      searchParams.category_ids.includes(category.id!)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="label">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      searchParams.tag_ids.includes(tag.id)
                        ? 'text-white'
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: searchParams.tag_ids.includes(tag.id)
                        ? tag.color
                        : tag.color + '30',
                      color: searchParams.tag_ids.includes(tag.id)
                        ? 'white'
                        : tag.color
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Currencies */}
          {currencies.length > 0 && (
            <div>
              <label className="label">Currencies</label>
              <div className="flex flex-wrap gap-2">
                {currencies.map(currency => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => toggleCurrency(currency.code)}
                    className={`px-3 py-1 rounded text-sm ${
                      searchParams.currency_codes.includes(currency.code)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {currency.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Boolean filters */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={searchParams.has_receipt === true}
                onChange={(e) => setSearchParams(prev => ({
                  ...prev,
                  has_receipt: e.target.checked ? true : undefined
                }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Has Receipt</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={searchParams.is_recurring === true}
                onChange={(e) => setSearchParams(prev => ({
                  ...prev,
                  is_recurring: e.target.checked ? true : undefined
                }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Recurring Only</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { useCategoryStore } from '../stores/categoryStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';

export function AdvancedSearch() {
  const { filters, setFilters } = useExpenseStore();
  const { categories } = useCategoryStore();
  const [localFilters, setLocalFilters] = useState({
    search: filters.search || '',
    categoryId: filters.categoryId?.toString() || '',
    minAmount: filters.minAmount?.toString() || '',
    maxAmount: filters.maxAmount?.toString() || '',
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({
      search: localFilters.search || undefined,
      categoryId: localFilters.categoryId ? parseInt(localFilters.categoryId) : undefined,
      minAmount: localFilters.minAmount ? parseFloat(localFilters.minAmount) : undefined,
      maxAmount: localFilters.maxAmount ? parseFloat(localFilters.maxAmount) : undefined,
      startDate: localFilters.startDate || undefined,
      endDate: localFilters.endDate || undefined,
    });
  };

  const handleReset = () => {
    const emptyFilters = {
      search: '',
      categoryId: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
    };
    setLocalFilters(emptyFilters);
    setFilters({});
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Advanced Search</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="search">Search Description</Label>
          <Input
            id="search"
            type="text"
            value={localFilters.search}
            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
            placeholder="Search expenses..."
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={localFilters.categoryId}
            onChange={(value) => setLocalFilters({ ...localFilters, categoryId: value })}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minAmount">Min Amount</Label>
            <Input
              id="minAmount"
              type="number"
              step="0.01"
              value={localFilters.minAmount}
              onChange={(e) => setLocalFilters({ ...localFilters, minAmount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="maxAmount">Max Amount</Label>
            <Input
              id="maxAmount"
              type="number"
              step="0.01"
              value={localFilters.maxAmount}
              onChange={(e) => setLocalFilters({ ...localFilters, maxAmount: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={localFilters.startDate}
              onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={localFilters.endDate}
              onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">Apply Filters</Button>
          <Button type="button" onClick={handleReset} variant="outline">
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useExpenseStore } from '../stores/expenseStore';
import { useCategoryStore } from '../stores/categoryStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function AdvancedSearch() {
  const filters = useExpenseStore((state) => state.filters);
  const setFilters = useExpenseStore((state) => state.setFilters);
  const categories = useCategoryStore((state) => state.categories);
  
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    setFilters(localFilters);
  };

  const handleReset = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    setFilters(emptyFilters);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5" />
          Advanced Search
        </h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search descriptions..."
            value={localFilters.search || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={localFilters.categoryId?.toString() || 'all'}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                categoryId: value === 'all' ? undefined : Number(value),
              })
            }
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={localFilters.startDate || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={localFilters.endDate || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value })}
          />
        </div>
      </div>

      <Button onClick={handleApply} className="w-full">
        Apply Filters
      </Button>
    </div>
  );
}
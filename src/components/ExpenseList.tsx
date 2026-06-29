import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchExpenses, deleteExpense, setFilters, clearFilters } from '@/store/slices/expensesSlice';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Edit, Trash2, Search, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ExpenseForm from './ExpenseForm';
import type { Expense } from '@/store/slices/expensesSlice';

export default function ExpenseList() {
  const dispatch = useAppDispatch();
  const { items: expenses, loading, filters } = useAppSelector((state) => state.expenses);
  const { items: categories } = useAppSelector((state) => state.categories);
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    filters.categoryId?.toString() || 'all'
  );

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchExpenses(filters));
  }, [dispatch, filters]);

  const handleSearch = () => {
    dispatch(setFilters({ search: searchTerm }));
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    dispatch(setFilters({
      categoryId: categoryId === 'all' ? null : parseInt(categoryId),
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    dispatch(clearFilters());
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await dispatch(deleteExpense(id)).unwrap();
        toast.success('Expense deleted successfully');
      } catch (error) {
        toast.error('Failed to delete expense');
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    setEditingExpense(null);
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#gray';
  };

  const hasActiveFilters = filters.search || filters.categoryId || filters.startDate || filters.endDate;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>View and manage all your expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Expenses Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Loading expenses...</div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="text-lg mb-2">No expenses found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Start by adding your first expense'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(expense.category_id) }}
                          />
                          {getCategoryName(expense.category_id)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Make changes to the expense details below
            </DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              expense={editingExpense}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
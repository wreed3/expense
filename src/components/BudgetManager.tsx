import { useEffect, useState } from 'react';
import { useBudgetStore } from '../stores/budgetStore';
import { useCategoryStore } from '../stores/categoryStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import toast from 'react-hot-toast';

export function BudgetManager() {
  const { budgets, isLoading, fetchBudgets, createBudget, updateBudget, deleteBudget } = useBudgetStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
  });

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [fetchBudgets, fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBudget) {
        await updateBudget(editingBudget, {
          categoryId: parseInt(formData.categoryId),
          amount: parseFloat(formData.amount),
          month: formData.month,
        });
        toast.success('Budget updated successfully');
      } else {
        await createBudget({
          categoryId: parseInt(formData.categoryId),
          amount: parseFloat(formData.amount),
          month: formData.month,
        });
        toast.success('Budget created successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save budget');
    }
  };

  const handleEdit = (budgetId: number) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      setEditingBudget(budgetId);
      setFormData({
        categoryId: budget.categoryId.toString(),
        amount: budget.amount.toString(),
        month: budget.month,
      });
      setIsDialogOpen(true);
    }
  };

  const handleDelete = async (budgetId: number) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(budgetId);
        toast.success('Budget deleted successfully');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete budget');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: '',
      amount: '',
      month: new Date().toISOString().slice(0, 7),
    });
    setEditingBudget(null);
  };

  const getPercentageUsed = (budget: typeof budgets[0]) => {
    if (!budget.spent) return 0;
    return (budget.spent / budget.amount) * 100;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading budgets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Budget Management</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          Add Budget
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const category = categories.find(c => c.id === budget.categoryId);
          const percentageUsed = getPercentageUsed(budget);
          
          return (
            <div key={budget.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{category?.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-500">{budget.month}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(budget.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(budget.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Spent: ${budget.spent?.toFixed(2) || '0.00'}</span>
                  <span>Budget: ${budget.amount.toFixed(2)}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(percentageUsed)}`}
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                  />
                </div>
                
                <p className="text-sm text-center">
                  {percentageUsed.toFixed(1)}% used
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No budgets set. Click "Add Budget" to create your first budget.
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? 'Edit Budget' : 'Add New Budget'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Budget Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingBudget ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
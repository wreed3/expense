import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchBudgets, createBudget, updateBudget, deleteBudget } from '@/store/slices/budgetsSlice';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Edit, Trash2, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Budget } from '@/store/slices/budgetsSlice';

export default function Budgets() {
  const dispatch = useAppDispatch();
  const { items: budgets, loading } = useAppSelector((state) => state.budgets);
  const { items: categories } = useAppSelector((state) => state.categories);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    month: selectedMonth,
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBudgets(selectedMonth));
  }, [dispatch, selectedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const budgetData = {
        category_id: parseInt(formData.category_id),
        amount: parseFloat(formData.amount),
        month: formData.month,
      };

      if (editingBudget) {
        await dispatch(updateBudget({
          id: editingBudget.id,
          budget: budgetData,
        })).unwrap();
        toast.success('Budget updated successfully');
      } else {
        await dispatch(createBudget(budgetData)).unwrap();
        toast.success('Budget created successfully');
      }

      setShowDialog(false);
      setEditingBudget(null);
      setFormData({ category_id: '', amount: '', month: selectedMonth });
    } catch (error) {
      toast.error(editingBudget ? 'Failed to update budget' : 'Failed to create budget');
      console.error('Error submitting budget:', error);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id.toString(),
      amount: budget.amount.toString(),
      month: budget.month,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await dispatch(deleteBudget(id)).unwrap();
        toast.success('Budget deleted successfully');
      } catch (error) {
        toast.error('Failed to delete budget');
        console.error('Error deleting budget:', error);
      }
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setEditingBudget(null);
    setFormData({ category_id: '', amount: '', month: selectedMonth });
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#gray';
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-500';
    if (percentage >= 80) return 'text-orange-500';
    return 'text-green-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">Set and track your spending limits</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBudget ? 'Edit Budget' : 'Add New Budget'}
                </DialogTitle>
                <DialogDescription>
                  {editingBudget
                    ? 'Update the budget details below'
                    : 'Set a spending limit for a category'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Budget Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month">Month *</Label>
                  <Input
                    id="month"
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingBudget ? 'Update Budget' : 'Create Budget'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-lg">Loading budgets...</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = budget.percentage || 0;
            const spent = budget.spent || 0;
            const remaining = budget.remaining || budget.amount;

            return (
              <Card key={budget.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: getCategoryColor(budget.category_id) }}
                    />
                    <div>
                      <CardTitle className="text-lg">{getCategoryName(budget.category_id)}</CardTitle>
                      <CardDescription>{formatCurrency(budget.amount)} budget</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(budget)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(budget.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className={`font-medium ${getStatusColor(percentage)}`}>
                        {formatCurrency(spent)} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className={getProgressColor(percentage)} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-medium">
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>

                  {percentage >= 80 && (
                    <div className="flex items-center gap-2 text-sm text-orange-500 bg-orange-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      {percentage >= 100 ? 'Budget exceeded!' : 'Approaching limit'}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && budgets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg mb-2 text-muted-foreground">No budgets set for this month</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create budgets to track your spending limits
            </p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Set Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { useBudgetStore } from '../stores/budgetStore';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import toast from 'react-hot-toast';

export function BudgetManager() {
  const { budgets, fetchBudgets, addBudget, updateBudget, deleteBudget } = useBudgetStore();
  const { categories } = useCategoryStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const budgetData = {
        categoryId: parseInt(categoryId),
        amount: parseFloat(amount),
        period,
      };

      if (editingId) {
        await updateBudget(editingId, budgetData);
        toast.success('Budget updated');
      } else {
        await addBudget(budgetData);
        toast.success('Budget created');
      }
      handleClose();
    } catch (error) {
      toast.error('Failed to save budget');
    }
  };

  const handleEdit = (id: number, budget: any) => {
    setEditingId(id);
    setCategoryId(budget.categoryId.toString());
    setAmount(budget.amount.toString());
    setPeriod(budget.period);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id);
        toast.success('Budget deleted');
      } catch (error) {
        toast.error('Failed to delete budget');
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingId(null);
    setCategoryId('');
    setAmount('');
    setPeriod('monthly');
  };

  const getCategoryName = (catId: number) => {
    return categories.find((c) => c.id === catId)?.name || 'Unknown';
  };

  const getSpentPercentage = (budget: any) => {
    return budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Budgets</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Budget' : 'New Budget'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update the budget details' : 'Set a budget limit for a category'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="period">Period</Label>
                  <Select value={period} onValueChange={(val) => setPeriod(val as 'monthly' | 'yearly')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {budgets.map((budget) => {
          const percentage = getSpentPercentage(budget);
          const isOverBudget = percentage > 100;
          
          return (
            <div
              key={budget.id}
              className="p-4 rounded-lg border hover:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium">{getCategoryName(budget.categoryId)}</div>
                  <div className="text-sm text-gray-500">
                    ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(budget.id, budget)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full transition-all ${
                    isOverBudget ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              
              {isOverBudget && (
                <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Over budget by ${(budget.spent - budget.amount).toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '@/store/slices/categoriesSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Category } from '@/store/slices/categoriesSlice';

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', 
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16'
];

export default function Categories() {
  const dispatch = useAppDispatch();
  const { items: categories, loading } = useAppSelector((state) => state.categories);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      if (editingCategory) {
        await dispatch(updateCategory({
          id: editingCategory.id,
          category: formData,
        })).unwrap();
        toast.success('Category updated successfully');
      } else {
        await dispatch(createCategory(formData)).unwrap();
        toast.success('Category created successfully');
      }

      setShowDialog(false);
      setEditingCategory(null);
      setFormData({ name: '', color: PRESET_COLORS[0] });
    } catch (error) {
      toast.error(editingCategory ? 'Failed to update category' : 'Failed to create category');
      console.error('Error submitting category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category? This will affect all expenses in this category.')) {
      try {
        await dispatch(deleteCategory(id)).unwrap();
        toast.success('Category deleted successfully');
      } catch (error) {
        toast.error('Failed to delete category. It may be in use by existing expenses.');
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setEditingCategory(null);
    setFormData({ name: '', color: PRESET_COLORS[0] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage your expense categories</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Update the category details below'
                  : 'Create a new category for organizing your expenses'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Groceries, Transportation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Color *</Label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-full h-10 rounded-md border-2 transition-all ${
                        formData.color === color
                          ? 'border-primary scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-lg">Loading categories...</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Created {new Date(category.created_at).toLocaleDateString()}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && categories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-lg mb-2 text-muted-foreground">No categories yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first category to start organizing expenses
            </p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
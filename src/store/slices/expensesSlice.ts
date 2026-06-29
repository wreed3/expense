import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/utils/api';

export interface Expense {
  id: number;
  amount: number;
  description: string;
  category_id: number;
  date: string;
  receipt_path?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface ExpensesState {
  items: Expense[];
  loading: boolean;
  error: string | null;
  totalAmount: number;
  filters: {
    startDate: string | null;
    endDate: string | null;
    categoryId: number | null;
    search: string;
  };
}

const initialState: ExpensesState = {
  items: [],
  loading: false,
  error: null,
  totalAmount: 0,
  filters: {
    startDate: null,
    endDate: null,
    categoryId: null,
    search: '',
  },
};

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (filters?: { startDate?: string; endDate?: string; categoryId?: number; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/api/expenses?${params.toString()}`);
    return response.data;
  }
);

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post('/api/expenses', expense);
    return response.data;
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async ({ id, expense }: { id: number; expense: Partial<Expense> }) => {
    const response = await api.put(`/api/expenses/${id}`, expense);
    return response.data;
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (id: number) => {
    await api.delete(`/api/expenses/${id}`);
    return id;
  }
);

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ExpensesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.totalAmount = action.payload.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch expenses';
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.totalAmount += action.payload.amount;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          const oldAmount = state.items[index].amount;
          state.items[index] = action.payload;
          state.totalAmount = state.totalAmount - oldAmount + action.payload.amount;
        }
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        const expense = state.items.find(item => item.id === action.payload);
        if (expense) {
          state.totalAmount -= expense.amount;
        }
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export const { setFilters, clearFilters } = expensesSlice.actions;
export default expensesSlice.reducer;
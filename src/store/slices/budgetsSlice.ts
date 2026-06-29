import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/utils/api';

export interface Budget {
  id: number;
  category_id: number;
  amount: number;
  month: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  spent?: number;
  remaining?: number;
  percentage?: number;
}

interface BudgetsState {
  items: Budget[];
  loading: boolean;
  error: string | null;
}

const initialState: BudgetsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchBudgets = createAsyncThunk(
  'budgets/fetchBudgets',
  async (month?: string) => {
    const params = month ? `?month=${month}` : '';
    const response = await api.get(`/api/budgets${params}`);
    return response.data;
  }
);

export const createBudget = createAsyncThunk(
  'budgets/createBudget',
  async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'spent' | 'remaining' | 'percentage'>) => {
    const response = await api.post('/api/budgets', budget);
    return response.data;
  }
);

export const updateBudget = createAsyncThunk(
  'budgets/updateBudget',
  async ({ id, budget }: { id: number; budget: Partial<Budget> }) => {
    const response = await api.put(`/api/budgets/${id}`, budget);
    return response.data;
  }
);

export const deleteBudget = createAsyncThunk(
  'budgets/deleteBudget',
  async (id: number) => {
    await api.delete(`/api/budgets/${id}`);
    return id;
  }
);

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch budgets';
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export default budgetsSlice.reducer;
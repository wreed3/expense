import { configureStore } from '@reduxjs/toolkit';
import expensesReducer from './slices/expensesSlice';
import categoriesReducer from './slices/categoriesSlice';
import budgetsReducer from './slices/budgetsSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    expenses: expensesReducer,
    categories: categoriesReducer,
    budgets: budgetsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
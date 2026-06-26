import React from 'react';
import { describe, test, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpenseList } from '../../components/ExpenseList';
import { useExpenseStore } from '../../stores/expenseStore';
import { createMockExpense } from '../helpers/testHelpers';

// Mock the expense store
jest.mock('../../stores/expenseStore');

describe('ExpenseList Component', () => {
  const mockFetchExpenses = jest.fn();
  const mockDeleteExpense = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useExpenseStore as unknown as jest.Mock).mockReturnValue({
      expenses: [],
      isLoading: false,
      error: null,
      fetchExpenses: mockFetchExpenses,
      deleteExpense: mockDeleteExpense,
    });
  });

  test('should render loading state', () => {
    (useExpenseStore as unknown as jest.Mock).mockReturnValue({
      expenses: [],
      isLoading: true,
      error: null,
      fetchExpenses: mockFetchExpenses,
      deleteExpense: mockDeleteExpense,
    });

    render(<ExpenseList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('should render error state', () => {
    (useExpenseStore as unknown as jest.Mock).mockReturnValue({
      expenses: [],
      isLoading: false,
      error: 'Failed to load expenses',
      fetchExpenses: mockFetchExpenses,
      deleteExpense: mockDeleteExpense,
    });

    render(<ExpenseList />);
    expect(screen.getByText(/failed to load expenses/i)).toBeInTheDocument();
  });

  test('should render empty state', () => {
    render(<ExpenseList />);
    expect(screen.getByText(/no expenses found/i)).toBeInTheDocument();
  });

  test('should render list of expenses', () => {
    const mockExpenses = [
      createMockExpense({ id: 1, description: 'Coffee', amount: 5.50 }),
      createMockExpense({ id: 2, description: 'Lunch', amount: 12.00 }),
    ];

    (useExpenseStore as unknown as jest.Mock).mockReturnValue({
      expenses: mockExpenses,
      isLoading: false,
      error: null,
      fetchExpenses: mockFetchExpenses,
      deleteExpense: mockDeleteExpense,
    });

    render(<ExpenseList />);
    
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('$5.50')).toBeInTheDocument();
    expect(screen.getByText('$12.00')).toBeInTheDocument();
  });

  test('should call fetchExpenses on mount', () => {
    render(<ExpenseList />);
    expect(mockFetchExpenses).toHaveBeenCalledTimes(1);
  });

  test('should handle delete expense', async () => {
    const mockExpenses = [
      createMockExpense({ id: 1, description: 'Coffee' }),
    ];

    (useExpenseStore as unknown as jest.Mock).mockReturnValue({
      expenses: mockExpenses,
      isLoading: false,
      error: null,
      fetchExpenses: mockFetchExpenses,
      deleteExpense: mockDeleteExpense,
    });

    render(<ExpenseList />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteExpense).toHaveBeenCalledWith(1);
    });
  });

  test('should display category information', () => {
    const mockExpenses = [
      createMockExpense({
        id: 1,
        description: 'Coffee',
        category: { id: 1, name: 'Food', color: '#3b82f6', icon: '🍔' },
      }),
    ];

    (useExpenseStore as unknown as jest.Mock).mockReturnValue({
      expenses: mockExpenses,
      isLoading: false,
      error: null,
      fetchExpenses: mockFetchExpenses,
      deleteExpense: mockDeleteExpense,
    });

    render(<ExpenseList />);
    
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('🍔')).toBeInTheDocument();
  });

  test('should format dates correctly', () => {
    const mockExpenses = [
      createMockExpense({
        id: 1,
        description: 'Coffee',
        date: '2024-01-15',
      }),
    ];

    (useExpenseStore as unknown as jest.Mock).mockReturnValue({
      expenses: mockExpenses,
      isLoading: false,
      error: null,
      fetchExpenses: mockFetchExpenses,
      deleteExpense: mockDeleteExpense,
    });

    render(<ExpenseList />);
    
    // Should display formatted date (implementation dependent)
    expect(screen.getByText(/jan/i)).toBeInTheDocument();
  });

  test('should show receipt indicator when available', () => {
    const mockExpenses = [
      createMockExpense({
        id: 1,
        description: 'Coffee',
        receipt_path: '/uploads/receipt.jpg',
      }),
    ];

    (useExpenseStore as unknown as jest.Mock).mockReturnValue({
      expenses: mockExpenses,
      isLoading: false,
      error: null,
      fetchExpenses: mockFetchExpenses,
      deleteExpense: mockDeleteExpense,
    });

    render(<ExpenseList />);
    
    expect(screen.getByRole('img', { name: /receipt/i })).toBeInTheDocument();
  });
});
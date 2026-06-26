import React from 'react';
import { describe, test, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseForm } from '../../components/ExpenseForm';
import { useExpenseStore } from '../../stores/expenseStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { createMockCategory } from '../helpers/testHelpers';

jest.mock('../../stores/expenseStore');
jest.mock('../../stores/categoryStore');

describe('ExpenseForm Component', () => {
  const mockAddExpense = jest.fn();
  const mockUpdateExpense = jest.fn();
  const mockFetchCategories = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useExpenseStore as unknown as jest.Mock).mockReturnValue({
      addExpense: mockAddExpense,
      updateExpense: mockUpdateExpense,
    });

    (useCategoryStore as unknown as jest.Mock).mockReturnValue({
      categories: [
        createMockCategory({ id: 1, name: 'Food' }),
        createMockCategory({ id: 2, name: 'Transport' }),
      ],
      fetchCategories: mockFetchCategories,
    });
  });

  test('should render form fields', () => {
    render(<ExpenseForm />);
    
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });

  test('should submit new expense', async () => {
    const user = userEvent.setup();
    mockAddExpense.mockResolvedValueOnce({});

    render(<ExpenseForm />);
    
    await user.type(screen.getByLabelText(/amount/i), '50.00');
    await user.type(screen.getByLabelText(/description/i), 'Coffee');
    await user.selectOptions(screen.getByLabelText(/category/i), '1');
    await user.type(screen.getByLabelText(/date/i), '2024-01-15');
    
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith({
        amount: 50.00,
        description: 'Coffee',
        category_id: 1,
        date: '2024-01-15',
      });
    });
  });

  test('should validate required fields', async () => {
    const user = userEvent.setup();

    render(<ExpenseForm />);
    
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });

    expect(mockAddExpense).not.toHaveBeenCalled();
  });

  test('should validate positive amount', async () => {
    const user = userEvent.setup();

    render(<ExpenseForm />);
    
    await user.type(screen.getByLabelText(/amount/i), '-50');
    
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
    });
  });

  test('should populate form when editing', () => {
    const existingExpense = {
      id: 1,
      amount: 50,
      description: 'Coffee',
      category_id: 1,
      date: '2024-01-15',
    };

    render(<ExpenseForm expense={existingExpense} />);
    
    expect(screen.getByLabelText(/amount/i)).toHaveValue(50);
    expect(screen.getByLabelText(/description/i)).toHaveValue('Coffee');
    expect(screen.getByLabelText(/category/i)).toHaveValue('1');
    expect(screen.getByLabelText(/date/i)).toHaveValue('2024-01-15');
  });

  test('should update existing expense', async () => {
    const user = userEvent.setup();
    mockUpdateExpense.mockResolvedValueOnce({});

    const existingExpense = {
      id: 1,
      amount: 50,
      description: 'Coffee',
      category_id: 1,
      date: '2024-01-15',
    };

    render(<ExpenseForm expense={existingExpense} />);
    
    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '75.00');
    
    const submitButton = screen.getByRole('button', { name: /update expense/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateExpense).toHaveBeenCalledWith(1, {
        amount: 75.00,
        description: 'Coffee',
        category_id: 1,
        date: '2024-01-15',
      });
    });
  });

  test('should handle recurring expense toggle', async () => {
    const user = userEvent.setup();

    render(<ExpenseForm />);
    
    const recurringCheckbox = screen.getByLabelText(/recurring/i);
    await user.click(recurringCheckbox);

    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
  });

  test('should handle file upload for receipt', async () => {
    const user = userEvent.setup();
    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' });

    render(<ExpenseForm />);
    
    const fileInput = screen.getByLabelText(/receipt/i);
    await user.upload(fileInput, file);

    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });

  test('should reset form after successful submission', async () => {
    const user = userEvent.setup();
    mockAddExpense.mockResolvedValueOnce({});

    render(<ExpenseForm />);
    
    await user.type(screen.getByLabelText(/amount/i), '50.00');
    await user.type(screen.getByLabelText(/description/i), 'Coffee');
    
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toHaveValue(null);
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });
  });

  test('should display error message on submission failure', async () => {
    const user = userEvent.setup();
    mockAddExpense.mockRejectedValueOnce(new Error('Server error'));

    render(<ExpenseForm />);
    
    await user.type(screen.getByLabelText(/amount/i), '50.00');
    await user.type(screen.getByLabelText(/description/i), 'Coffee');
    await user.selectOptions(screen.getByLabelText(/category/i), '1');
    
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });
});
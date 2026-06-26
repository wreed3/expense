import { describe, test, expect, beforeEach } from '@jest/globals';
import { useExpenseStore } from '../../stores/expenseStore';
import { mockFetchResponse, createMockExpense } from '../helpers/testHelpers';

describe('Expense Store', () => {
  beforeEach(() => {
    useExpenseStore.setState({
      expenses: [],
      isLoading: false,
      error: null,
    });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('fetchExpenses', () => {
    test('should fetch expenses successfully', async () => {
      const mockExpenses = [
        createMockExpense({ id: 1, amount: 50 }),
        createMockExpense({ id: 2, amount: 100 }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ expenses: mockExpenses })
      );

      const { fetchExpenses } = useExpenseStore.getState();
      await fetchExpenses();

      const state = useExpenseStore.getState();
      expect(state.expenses).toEqual(mockExpenses);
      expect(state.error).toBeNull();
    });

    test('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ error: 'Failed to fetch' }, 500)
      );

      const { fetchExpenses } = useExpenseStore.getState();
      await fetchExpenses();

      const state = useExpenseStore.getState();
      expect(state.expenses).toEqual([]);
      expect(state.error).toBeTruthy();
    });

    test('should apply filters when fetching', async () => {
      const mockExpenses = [createMockExpense()];

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ expenses: mockExpenses })
      );

      const { fetchExpenses } = useExpenseStore.getState();
      await fetchExpenses({
        categoryId: 1,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('categoryId=1'),
        expect.any(Object)
      );
    });
  });

  describe('addExpense', () => {
    test('should add expense successfully', async () => {
      const newExpense = createMockExpense({ id: 1, amount: 75 });

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ expense: newExpense })
      );

      const { addExpense } = useExpenseStore.getState();
      await addExpense({
        category_id: 1,
        amount: 75,
        description: 'Test',
        date: '2024-01-15',
      });

      const state = useExpenseStore.getState();
      expect(state.expenses).toContainEqual(newExpense);
    });

    test('should handle add error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ error: 'Validation error' }, 400)
      );

      const { addExpense } = useExpenseStore.getState();
      await addExpense({
        category_id: 1,
        amount: -50,
        description: 'Invalid',
        date: '2024-01-15',
      });

      const state = useExpenseStore.getState();
      expect(state.error).toBeTruthy();
    });
  });

  describe('updateExpense', () => {
    test('should update expense successfully', async () => {
      const existingExpense = createMockExpense({ id: 1, amount: 50 });
      useExpenseStore.setState({ expenses: [existingExpense] });

      const updatedExpense = { ...existingExpense, amount: 100 };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ expense: updatedExpense })
      );

      const { updateExpense } = useExpenseStore.getState();
      await updateExpense(1, { amount: 100 });

      const state = useExpenseStore.getState();
      expect(state.expenses[0].amount).toBe(100);
    });

    test('should handle update error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ error: 'Not found' }, 404)
      );

      const { updateExpense } = useExpenseStore.getState();
      await updateExpense(999, { amount: 100 });

      const state = useExpenseStore.getState();
      expect(state.error).toBeTruthy();
    });
  });

  describe('deleteExpense', () => {
    test('should delete expense successfully', async () => {
      const expense1 = createMockExpense({ id: 1 });
      const expense2 = createMockExpense({ id: 2 });
      useExpenseStore.setState({ expenses: [expense1, expense2] });

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ message: 'Deleted' })
      );

      const { deleteExpense } = useExpenseStore.getState();
      await deleteExpense(1);

      const state = useExpenseStore.getState();
      expect(state.expenses).toHaveLength(1);
      expect(state.expenses[0].id).toBe(2);
    });

    test('should handle delete error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ error: 'Not found' }, 404)
      );

      const { deleteExpense } = useExpenseStore.getState();
      await deleteExpense(999);

      const state = useExpenseStore.getState();
      expect(state.error).toBeTruthy();
    });
  });
});
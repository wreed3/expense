import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Custom render function that wraps components with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock fetch response helper
 */
export function mockFetchResponse(data: any, status: number = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
}

/**
 * Mock fetch error helper
 */
export function mockFetchError(message: string = 'Network error') {
  return Promise.reject(new Error(message));
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Create mock expense data
 */
export function createMockExpense(overrides = {}) {
  return {
    id: 1,
    user_id: 1,
    category_id: 1,
    amount: 50.00,
    description: 'Test Expense',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_frequency: null,
    receipt_path: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 1,
      name: 'Food',
      color: '#3b82f6',
      icon: '🍔',
    },
    ...overrides,
  };
}

/**
 * Create mock category data
 */
export function createMockCategory(overrides = {}) {
  return {
    id: 1,
    user_id: 1,
    name: 'Food',
    color: '#3b82f6',
    icon: '🍔',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock budget data
 */
export function createMockBudget(overrides = {}) {
  return {
    id: 1,
    user_id: 1,
    category_id: 1,
    amount: 1000.00,
    month: new Date().toISOString().slice(0, 7),
    alert_threshold: 0.8,
    spent: 0,
    remaining: 1000.00,
    percentage: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 1,
      name: 'Food',
      color: '#3b82f6',
      icon: '🍔',
    },
    ...overrides,
  };
}

/**
 * Create mock user data
 */
export function createMockUser(overrides = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
import React from 'react';
import { describe, test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { BudgetCard } from '../../components/BudgetCard';
import { createMockBudget } from '../helpers/testHelpers';

describe('BudgetCard Component', () => {
  test('should render budget information', () => {
    const budget = createMockBudget({
      amount: 1000,
      spent: 500,
      remaining: 500,
      percentage: 50,
      category: { id: 1, name: 'Food', color: '#3b82f6', icon: '🍔' },
    });

    render(<BudgetCard budget={budget} />);
    
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('🍔')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  test('should display progress bar with correct percentage', () => {
    const budget = createMockBudget({
      amount: 1000,
      spent: 750,
      percentage: 75,
    });

    render(<BudgetCard budget={budget} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
  });

  test('should show warning when approaching budget limit', () => {
    const budget = createMockBudget({
      amount: 1000,
      spent: 850,
      percentage: 85,
      alert_threshold: 0.8,
    });

    render(<BudgetCard budget={budget} />);
    
    expect(screen.getByText(/approaching limit/i)).toBeInTheDocument();
  });

  test('should show danger state when over budget', () => {
    const budget = createMockBudget({
      amount: 1000,
      spent: 1100,
      remaining: -100,
      percentage: 110,
    });

    render(<BudgetCard budget={budget} />);
    
    expect(screen.getByText(/over budget/i)).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  test('should show success state when under budget', () => {
    const budget = createMockBudget({
      amount: 1000,
      spent: 300,
      percentage: 30,
    });

    render(<BudgetCard budget={budget} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('bg-green-500');
  });

  test('should display month correctly', () => {
    const budget = createMockBudget({
      month: '2024-01',
    });

    render(<BudgetCard budget={budget} />);
    
    expect(screen.getByText(/january 2024/i)).toBeInTheDocument();
  });

  test('should handle zero spent amount', () => {
    const budget = createMockBudget({
      amount: 1000,
      spent: 0,
      remaining: 1000,
      percentage: 0,
    });

    render(<BudgetCard budget={budget} />);
    
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  test('should apply category color to UI elements', () => {
    const budget = createMockBudget({
      category: { id: 1, name: 'Food', color: '#3b82f6', icon: '🍔' },
    });

    render(<BudgetCard budget={budget} />);
    
    const categoryBadge = screen.getByText('Food').closest('div');
    expect(categoryBadge).toHaveStyle({ backgroundColor: '#3b82f6' });
  });
});
import React from 'react';
import ExpenseItem, { Expense } from './ExpenseItem';
import './ExpensesList.css';

interface ExpensesListProps {
  items: Expense[];
}

const ExpensesList: React.FC<ExpensesListProps> = ({ items }) => {
  if (items.length === 0) {
    return <h2 className='expenses-list__fallback'>Found no expenses.</h2>;
  }

  return (
    <ul className='expenses-list'>
      {items.map((expense) => (
        <ExpenseItem key={expense.id} expense={expense} />
      ))}
    </ul>
  );
};

export default ExpensesList;
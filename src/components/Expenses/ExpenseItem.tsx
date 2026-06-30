import React from 'react';
import ExpenseDate from './ExpenseDate';
import Card from '../UI/Card';
import './ExpenseItem.css';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: Date;
}

interface ExpenseItemProps {
  expense: Expense;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense }) => {
  return (
    <li>
      <Card className='expense-item'>
        <ExpenseDate date={expense.date} />
        <div className='expense-item__description'>
          <h2>{expense.title}</h2>
          <div className='expense-item__price'>${expense.amount.toFixed(2)}</div>
        </div>
      </Card>
    </li>
  );
};

export default ExpenseItem;
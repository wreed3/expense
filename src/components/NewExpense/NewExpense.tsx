import React, { useState } from 'react';
import ExpenseForm from './ExpenseForm';
import './NewExpense.css';

interface ExpenseData {
  title: string;
  amount: number;
  date: Date;
}

interface NewExpenseProps {
  onAddExpense: (expense: ExpenseData & { id: string }) => void;
}

const NewExpense: React.FC<NewExpenseProps> = ({ onAddExpense }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const saveExpenseDataHandler = (enteredExpenseData: ExpenseData) => {
    const expenseData = {
      ...enteredExpenseData,
      id: Math.random().toString(),
    };
    onAddExpense(expenseData);
    setIsEditing(false);
  };

  const startEditingHandler = () => {
    setIsEditing(true);
  };

  const stopEditingHandler = () => {
    setIsEditing(false);
  };

  return (
    <div className='new-expense'>
      {!isEditing && <button onClick={startEditingHandler}>Add New Expense</button>}
      {isEditing && (
        <ExpenseForm onSaveExpenseData={saveExpenseDataHandler} onCancel={stopEditingHandler} />
      )}
    </div>
  );
};

export default NewExpense;
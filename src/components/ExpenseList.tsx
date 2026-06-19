import { Expense } from '../api';
import { format } from 'date-fns';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="empty-state">
        <p>No expenses found. Add your first expense to get started!</p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      {expenses.map((expense) => (
        <div key={expense.id} className="expense-item">
          <div className="expense-icon" style={{ backgroundColor: expense.category_color }}>
            {expense.category_icon}
          </div>
          <div className="expense-details">
            <div className="expense-description">{expense.description}</div>
            <div className="expense-meta">
              <span className="expense-category">{expense.category_name}</span>
              <span className="expense-date">
                {format(new Date(expense.date), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
          <div className="expense-amount">${expense.amount.toFixed(2)}</div>
          <div className="expense-actions">
            <button
              className="btn-icon"
              onClick={() => onEdit(expense)}
              title="Edit"
            >
              ✏️
            </button>
            <button
              className="btn-icon"
              onClick={() => onDelete(expense.id)}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
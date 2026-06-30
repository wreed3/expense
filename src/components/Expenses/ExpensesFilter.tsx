import React from 'react';
import './ExpensesFilter.css';

interface ExpensesFilterProps {
  selected: string;
  onChangeFilter: (year: string) => void;
}

const ExpensesFilter: React.FC<ExpensesFilterProps> = ({ selected, onChangeFilter }) => {
  const dropdownChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilter(event.target.value);
  };

  return (
    <div className='expenses-filter'>
      <div className='expenses-filter__control'>
        <label>Filter by year</label>
        <select value={selected} onChange={dropdownChangeHandler}>
          <option value='2024'>2024</option>
          <option value='2023'>2023</option>
          <option value='2022'>2022</option>
          <option value='2021'>2021</option>
          <option value='2020'>2020</option>
          <option value='2019'>2019</option>
        </select>
      </div>
    </div>
  );
};

export default ExpensesFilter;
import React, { useEffect } from 'react';
import { useCurrencyStore } from '../stores/currencyStore';

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export function CurrencySelector({ value, onChange, className = '' }: CurrencySelectorProps) {
  const { currencies, fetchCurrencies, isLoading } = useCurrencyStore();

  useEffect(() => {
    if (currencies.length === 0) {
      fetchCurrencies();
    }
  }, [currencies.length, fetchCurrencies]);

  if (isLoading) {
    return (
      <select className={`input ${className}`} disabled>
        <option>Loading...</option>
      </select>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input ${className}`}
    >
      {currencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.code} - {currency.name} ({currency.symbol})
        </option>
      ))}
    </select>
  );
}
import React from 'react';
import { DollarSign } from 'lucide-react';
import { useCurrencyStore } from '../stores/currencyStore';

interface CurrencySelectorProps {
  value?: string;
  onChange: (currency: string) => void;
  className?: string;
}

export function CurrencySelector({ value, onChange, className = '' }: CurrencySelectorProps) {
  const { currencies, selectedCurrency } = useCurrencyStore();

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        <DollarSign className="w-4 h-4 inline mr-1" />
        Currency
      </label>
      <select
        value={value || selectedCurrency}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} - {currency.name} ({currency.symbol})
          </option>
        ))}
      </select>
    </div>
  );
}
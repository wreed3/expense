import React, { useEffect, useState } from 'react';
import { useCurrencyStore } from '../stores/currencyStore';

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  showSymbol?: boolean;
  className?: string;
}

export default function CurrencySelector({ 
  value, 
  onChange, 
  label = 'Currency',
  showSymbol = true,
  className = ''
}: CurrencySelectorProps) {
  const { currencies, defaultCurrency, fetchCurrencies } = useCurrencyStore();

  useEffect(() => {
    if (currencies.length === 0) {
      fetchCurrencies();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const selectedCurrency = currencies.find(c => c.code === value);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {showSymbol && `${currency.symbol} - `}{currency.code} - {currency.name}
            </option>
          ))}
        </select>
        {selectedCurrency && showSymbol && (
          <div className="absolute right-10 top-2 text-gray-500 pointer-events-none">
            {selectedCurrency.symbol}
          </div>
        )}
      </div>
      {selectedCurrency && !selectedCurrency.is_default && (
        <p className="mt-1 text-xs text-gray-500">
          Exchange rate: {selectedCurrency.exchange_rate.toFixed(4)} to {defaultCurrency?.code || 'USD'}
        </p>
      )}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useCurrencyStore } from '../stores/currencyStore';
import toast from 'react-hot-toast';

export default function CurrencySettings() {
  const { currencies, defaultCurrency, fetchCurrencies, updateExchangeRate, setDefaultCurrency, isLoading } = useCurrencyStore();
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handleUpdateRate = async (code: string) => {
    const newRate = parseFloat(editingRates[code]);
    if (isNaN(newRate) || newRate <= 0) {
      toast.error('Please enter a valid exchange rate');
      return;
    }

    try {
      await updateExchangeRate(code, newRate);
      toast.success('Exchange rate updated successfully');
      setEditingRates(prev => {
        const updated = { ...prev };
        delete updated[code];
        return updated;
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSetDefault = async (code: string) => {
    try {
      await setDefaultCurrency(code);
      toast.success(`${code} set as default currency`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startEditing = (code: string, currentRate: number) => {
    setEditingRates(prev => ({
      ...prev,
      [code]: currentRate.toString(),
    }));
  };

  const cancelEditing = (code: string) => {
    setEditingRates(prev => {
      const updated = { ...prev };
      delete updated[code];
      return updated;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Currency Settings</h2>
        <p className="text-gray-600 mt-1">
          Manage currencies and exchange rates. All amounts are converted relative to your default currency.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exchange Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currencies.map(currency => (
                <tr key={currency.code}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{currency.code}</div>
                    <div className="text-sm text-gray-500">{currency.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {currency.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRates[currency.code] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.0001"
                          value={editingRates[currency.code]}
                          onChange={(e) => setEditingRates(prev => ({
                            ...prev,
                            [currency.code]: e.target.value
                          }))}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => handleUpdateRate(currency.code)}
                          className="text-green-600 hover:text-green-800"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEditing(currency.code)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">
                          {currency.exchange_rate.toFixed(4)}
                        </span>
                        {!currency.is_default && (
                          <button
                            onClick={() => startEditing(currency.code, currency.exchange_rate)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currency.is_default ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Default
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!currency.is_default && (
                      <button
                        onClick={() => handleSetDefault(currency.code)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Set as Default
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Exchange Rates</h3>
        <p className="text-sm text-blue-700">
          Exchange rates are relative to your default currency. When you change the default currency,
          all amounts will be converted accordingly. Update rates regularly for accurate conversions.
        </p>
      </div>
    </div>
  );
}
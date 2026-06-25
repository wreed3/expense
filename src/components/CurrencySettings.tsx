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
        <div className="space-y-4">
          {currencies.map(currency => (
            <div
              key={currency.code}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{currency.symbol}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{currency.code}</h3>
                        {currency.is_default && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{currency.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm text-gray-600">Exchange Rate (to USD)</label>
                      {editingRates[currency.code] !== undefined ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            value={editingRates[currency.code]}
                            onChange={(e) => setEditingRates(prev => ({
                              ...prev,
                              [currency.code]: e.target.value,
                            }))}
                            step="0.0001"
                            className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleUpdateRate(currency.code)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => cancelEditing(currency.code)}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-lg">{currency.exchange_rate.toFixed(4)}</span>
                          <button
                            onClick={() => startEditing(currency.code, currency.exchange_rate)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {!currency.is_default && (
                      <button
                        onClick={() => handleSetDefault(currency.code)}
                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">About Exchange Rates</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Exchange rates are relative to USD (1 USD = X currency)</li>
          <li>• Update rates regularly to ensure accurate conversions</li>
          <li>• Your default currency is used for budgets and reports</li>
          <li>• Historical expenses keep their original currency and amount</li>
        </ul>
      </div>
    </div>
  );
}
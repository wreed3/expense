import { create } from 'zustand';

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_base: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CurrencyState {
  currencies: Currency[];
  baseCurrency: Currency | null;
  isLoading: boolean;
  error: string | null;
  fetchCurrencies: () => Promise<void>;
  fetchBaseCurrency: () => Promise<void>;
  convertAmount: (amount: number, fromCode: string, toCode: string) => number;
  updateExchangeRate: (code: string, rate: number) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currencies: [],
  baseCurrency: null,
  isLoading: false,
  error: null,

  fetchCurrencies: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/currencies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch currencies');

      const data = await response.json();
      set({ currencies: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchBaseCurrency: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/currencies/base/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch base currency');

      const data = await response.json();
      set({ baseCurrency: data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  convertAmount: (amount: number, fromCode: string, toCode: string) => {
    const { currencies } = get();
    const fromCurrency = currencies.find(c => c.code === fromCode);
    const toCurrency = currencies.find(c => c.code === toCode);

    if (!fromCurrency || !toCurrency) return amount;

    // Convert to base currency first, then to target currency
    const baseAmount = amount / fromCurrency.exchange_rate;
    return baseAmount * toCurrency.exchange_rate;
  },

  updateExchangeRate: async (code: string, rate: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/currencies/${code}/rate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ exchange_rate: rate }),
      });

      if (!response.ok) throw new Error('Failed to update exchange rate');

      await get().fetchCurrencies();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
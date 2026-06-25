import { create } from 'zustand';
import { CurrencyState, Currency } from '../types';
import api from '../utils/api';

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currencies: [],
  defaultCurrency: null,
  isLoading: false,
  error: null,

  fetchCurrencies: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/currencies');
      const currencies = response.data;
      const defaultCurrency = currencies.find((c: Currency) => c.is_default) || null;
      set({ currencies, defaultCurrency, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch currencies',
        isLoading: false 
      });
    }
  },

  updateExchangeRate: async (code: string, rate: number) => {
    try {
      const response = await api.put(`/currencies/${code}`, { exchange_rate: rate });
      const updatedCurrency = response.data;
      
      set(state => ({
        currencies: state.currencies.map(c => 
          c.code === code ? updatedCurrency : c
        )
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update exchange rate');
    }
  },

  setDefaultCurrency: async (code: string) => {
    try {
      const response = await api.post(`/currencies/${code}/set-default`);
      const newDefault = response.data;
      
      set(state => ({
        currencies: state.currencies.map(c => ({
          ...c,
          is_default: c.code === code
        })),
        defaultCurrency: newDefault
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to set default currency');
    }
  },

  convertAmount: async (amount: number, from: string, to: string) => {
    try {
      const response = await api.post('/currencies/convert', { amount, from, to });
      return response.data.converted_amount;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to convert currency');
    }
  },
}));
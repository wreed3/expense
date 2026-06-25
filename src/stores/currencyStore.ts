import { create } from 'zustand';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Exchange rate relative to USD
}

interface CurrencyState {
  currencies: Currency[];
  selectedCurrency: string;
  baseCurrency: string;
  exchangeRates: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  fetchCurrencies: () => Promise<void>;
  setSelectedCurrency: (code: string) => void;
  updateExchangeRate: (code: string, rate: number) => void;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
}

const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110.0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.25 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.35 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', rate: 0.92 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 6.45 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 74.5 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', rate: 20.0 },
];

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currencies: DEFAULT_CURRENCIES,
  selectedCurrency: 'USD',
  baseCurrency: 'USD',
  exchangeRates: DEFAULT_CURRENCIES.reduce((acc, curr) => {
    acc[curr.code] = curr.rate;
    return acc;
  }, {} as Record<string, number>),
  isLoading: false,
  error: null,

  fetchCurrencies: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/currency/rates');
      if (!response.ok) {
        throw new Error('Failed to fetch currency rates');
      }
      const data = await response.json();
      
      const updatedCurrencies = DEFAULT_CURRENCIES.map(currency => ({
        ...currency,
        rate: data.rates[currency.code] || currency.rate
      }));

      const exchangeRates = updatedCurrencies.reduce((acc, curr) => {
        acc[curr.code] = curr.rate;
        return acc;
      }, {} as Record<string, number>);

      set({
        currencies: updatedCurrencies,
        exchangeRates,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching currencies:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch currencies',
        isLoading: false
      });
    }
  },

  setSelectedCurrency: (code: string) => {
    const currency = get().currencies.find(c => c.code === code);
    if (currency) {
      set({ selectedCurrency: code });
      localStorage.setItem('selectedCurrency', code);
    }
  },

  updateExchangeRate: (code: string, rate: number) => {
    set(state => ({
      currencies: state.currencies.map(c =>
        c.code === code ? { ...c, rate } : c
      ),
      exchangeRates: {
        ...state.exchangeRates,
        [code]: rate
      }
    }));
  },

  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => {
    const { exchangeRates, baseCurrency } = get();
    
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Convert to base currency (USD) first
    const amountInBase = fromCurrency === baseCurrency
      ? amount
      : amount / exchangeRates[fromCurrency];

    // Convert from base currency to target currency
    const convertedAmount = toCurrency === baseCurrency
      ? amountInBase
      : amountInBase * exchangeRates[toCurrency];

    return Math.round(convertedAmount * 100) / 100;
  }
}));

// Load selected currency from localStorage on initialization
const savedCurrency = localStorage.getItem('selectedCurrency');
if (savedCurrency) {
  useCurrencyStore.setState({ selectedCurrency: savedCurrency });
}
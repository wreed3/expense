// Phase 3 Type Definitions

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
  created_at: string;
}

export interface ExchangeRate {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string;
  source: string;
  created_at: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface CustomField {
  id: number;
  user_id: number;
  name: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[]; // For select type
  is_required: boolean;
  created_at: string;
}

export interface CustomFieldValue {
  id: number;
  expense_id: number;
  custom_field_id: number;
  value: string;
  created_at: string;
}

export interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  filters: SearchFilters;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  query?: string; // Full-text search
  categories?: number[];
  tags?: number[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  merchant?: string;
  hasReceipt?: boolean;
  customFields?: Record<number, any>;
  sortBy?: 'date' | 'amount' | 'description' | 'merchant';
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseWithExtras {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  original_amount?: number;
  exchange_rate?: number;
  description: string;
  date: string;
  category_id: number;
  category_name?: string;
  merchant?: string;
  notes?: string;
  receipt_url?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  tags?: Tag[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CurrencyConversionRequest {
  amount: number;
  from_currency: string;
  to_currency: string;
  date?: string;
}

export interface CurrencyConversionResponse {
  original_amount: number;
  converted_amount: number;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  date: string;
}
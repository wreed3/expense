import { z } from 'zod';

export const currencySchema = z.object({
  id: z.number().optional(),
  code: z.string().length(3),
  name: z.string().min(1),
  symbol: z.string().min(1),
  exchange_rate: z.number().positive(),
  is_base: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const updateCurrencySchema = z.object({
  code: z.string().length(3).optional(),
  name: z.string().min(1).optional(),
  symbol: z.string().min(1).optional(),
  exchange_rate: z.number().positive().optional(),
  is_base: z.boolean().optional(),
});

export const exchangeRateUpdateSchema = z.object({
  code: z.string().length(3),
  exchange_rate: z.number().positive(),
});

export type Currency = z.infer<typeof currencySchema>;
export type UpdateCurrency = z.infer<typeof updateCurrencySchema>;
export type ExchangeRateUpdate = z.infer<typeof exchangeRateUpdateSchema>;

export interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  converted_amount: number;
  exchange_rate: number;
  timestamp: string;
}
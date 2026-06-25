import { z } from 'zod';

export const advancedSearchSchema = z.object({
  // Text search
  query: z.string().optional(),
  
  // Date filters
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  
  // Amount filters
  min_amount: z.number().optional(),
  max_amount: z.number().optional(),
  
  // Category filter
  category_ids: z.array(z.number()).optional(),
  
  // Tag filters
  tag_ids: z.array(z.number()).optional(),
  tag_match_all: z.boolean().default(false), // true = AND, false = OR
  
  // Currency filter
  currency_codes: z.array(z.string()).optional(),
  
  // Custom field filters
  custom_fields: z.array(z.object({
    field_id: z.number(),
    value: z.string(),
    operator: z.enum(['equals', 'contains', 'gt', 'lt', 'gte', 'lte']).default('equals'),
  })).optional(),
  
  // Payment method
  payment_methods: z.array(z.string()).optional(),
  
  // Receipt filter
  has_receipt: z.boolean().optional(),
  
  // Recurring filter
  is_recurring: z.boolean().optional(),
  
  // Sorting
  sort_by: z.enum(['date', 'amount', 'description', 'category']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  
  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

export type AdvancedSearchParams = z.infer<typeof advancedSearchSchema>;

export interface SearchResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  filters_applied: string[];
}
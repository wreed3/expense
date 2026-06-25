import { z } from 'zod';

export const customFieldTypeSchema = z.enum(['text', 'number', 'date', 'boolean', 'select']);

export const customFieldSchema = z.object({
  id: z.number().optional(),
  user_id: z.number(),
  name: z.string().min(1).max(100),
  field_type: customFieldTypeSchema,
  options: z.array(z.string()).optional(), // For select type
  is_required: z.boolean().default(false),
  created_at: z.string().optional(),
});

export const createCustomFieldSchema = z.object({
  name: z.string().min(1).max(100),
  field_type: customFieldTypeSchema,
  options: z.array(z.string()).optional(),
  is_required: z.boolean().optional(),
});

export const updateCustomFieldSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  field_type: customFieldTypeSchema.optional(),
  options: z.array(z.string()).optional(),
  is_required: z.boolean().optional(),
});

export const customFieldValueSchema = z.object({
  id: z.number().optional(),
  expense_id: z.number(),
  custom_field_id: z.number(),
  value: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type CustomFieldType = z.infer<typeof customFieldTypeSchema>;
export type CustomField = z.infer<typeof customFieldSchema>;
export type CreateCustomField = z.infer<typeof createCustomFieldSchema>;
export type UpdateCustomField = z.infer<typeof updateCustomFieldSchema>;
export type CustomFieldValue = z.infer<typeof customFieldValueSchema>;

export interface CustomFieldWithValue extends CustomField {
  value?: string;
}
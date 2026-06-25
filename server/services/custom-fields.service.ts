import Database from 'better-sqlite3';
import { CustomField, CreateCustomField, UpdateCustomField, CustomFieldValue, CustomFieldWithValue } from '../types/custom-fields.js';

export class CustomFieldsService {
  constructor(private db: Database.Database) {}

  getAllCustomFields(userId: number): CustomField[] {
    const stmt = this.db.prepare(`
      SELECT * FROM custom_fields
      WHERE user_id = ?
      ORDER BY name ASC
    `);
    
    const fields = stmt.all(userId) as any[];
    
    return fields.map(field => ({
      ...field,
      options: field.options ? JSON.parse(field.options) : undefined,
      is_required: Boolean(field.is_required),
    }));
  }

  getCustomFieldById(id: number, userId: number): CustomField | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM custom_fields
      WHERE id = ? AND user_id = ?
    `);
    
    const field = stmt.get(id, userId) as any;
    
    if (!field) return undefined;
    
    return {
      ...field,
      options: field.options ? JSON.parse(field.options) : undefined,
      is_required: Boolean(field.is_required),
    };
  }

  getCustomFieldsByExpenseId(expenseId: number, userId: number): CustomFieldWithValue[] {
    const stmt = this.db.prepare(`
      SELECT 
        cf.*,
        cfv.value
      FROM custom_fields cf
      LEFT JOIN expense_custom_field_values cfv 
        ON cf.id = cfv.custom_field_id AND cfv.expense_id = ?
      WHERE cf.user_id = ?
      ORDER BY cf.name ASC
    `);
    
    const fields = stmt.all(expenseId, userId) as any[];
    
    return fields.map(field => ({
      ...field,
      options: field.options ? JSON.parse(field.options) : undefined,
      is_required: Boolean(field.is_required),
    }));
  }

  createCustomField(userId: number, data: CreateCustomField): CustomField {
    const stmt = this.db.prepare(`
      INSERT INTO custom_fields (user_id, name, field_type, options, is_required)
      VALUES (?, ?, ?, ?, ?)
    `);

    const options = data.options ? JSON.stringify(data.options) : null;
    const info = stmt.run(
      userId,
      data.name,
      data.field_type,
      options,
      data.is_required ? 1 : 0
    );

    return this.getCustomFieldById(Number(info.lastInsertRowid), userId)!;
  }

  updateCustomField(id: number, userId: number, updates: UpdateCustomField): CustomField {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.field_type !== undefined) {
      fields.push('field_type = ?');
      values.push(updates.field_type);
    }
    if (updates.options !== undefined) {
      fields.push('options = ?');
      values.push(JSON.stringify(updates.options));
    }
    if (updates.is_required !== undefined) {
      fields.push('is_required = ?');
      values.push(updates.is_required ? 1 : 0);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id, userId);

    const stmt = this.db.prepare(`
      UPDATE custom_fields
      SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

    const info = stmt.run(...values);

    if (info.changes === 0) {
      throw new Error('Custom field not found');
    }

    return this.getCustomFieldById(id, userId)!;
  }

  deleteCustomField(id: number, userId: number): void {
    // First delete all values
    const deleteValuesStmt = this.db.prepare(`
      DELETE FROM expense_custom_field_values
      WHERE custom_field_id = ?
    `);
    deleteValuesStmt.run(id);

    // Then delete the field
    const stmt = this.db.prepare(`
      DELETE FROM custom_fields
      WHERE id = ? AND user_id = ?
    `);
    
    const info = stmt.run(id, userId);

    if (info.changes === 0) {
      throw new Error('Custom field not found');
    }
  }

  setCustomFieldValue(expenseId: number, customFieldId: number, value: string): CustomFieldValue {
    const stmt = this.db.prepare(`
      INSERT INTO expense_custom_field_values (expense_id, custom_field_id, value)
      VALUES (?, ?, ?)
      ON CONFLICT(expense_id, custom_field_id) 
      DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(expenseId, customFieldId, value, value);

    const getStmt = this.db.prepare(`
      SELECT * FROM expense_custom_field_values
      WHERE expense_id = ? AND custom_field_id = ?
    `);

    return getStmt.get(expenseId, customFieldId) as CustomFieldValue;
  }

  deleteCustomFieldValue(expenseId: number, customFieldId: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM expense_custom_field_values
      WHERE expense_id = ? AND custom_field_id = ?
    `);
    stmt.run(expenseId, customFieldId);
  }

  setExpenseCustomFields(expenseId: number, fieldValues: { field_id: number; value: string }[]): void {
    // Delete existing values
    const deleteStmt = this.db.prepare(`
      DELETE FROM expense_custom_field_values WHERE expense_id = ?
    `);
    deleteStmt.run(expenseId);

    // Add new values
    if (fieldValues.length > 0) {
      const insertStmt = this.db.prepare(`
        INSERT INTO expense_custom_field_values (expense_id, custom_field_id, value)
        VALUES (?, ?, ?)
      `);

      for (const fv of fieldValues) {
        insertStmt.run(expenseId, fv.field_id, fv.value);
      }
    }
  }

  validateCustomFieldValue(field: CustomField, value: string): boolean {
    switch (field.field_type) {
      case 'text':
        return typeof value === 'string';
      
      case 'number':
        return !isNaN(Number(value));
      
      case 'date':
        return !isNaN(Date.parse(value));
      
      case 'boolean':
        return value === 'true' || value === 'false';
      
      case 'select':
        return field.options ? field.options.includes(value) : false;
      
      default:
        return false;
    }
  }
}
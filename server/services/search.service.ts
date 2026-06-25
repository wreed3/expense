import Database from 'better-sqlite3';
import { AdvancedSearchParams, SearchResult } from '../types/search.js';

export class SearchService {
  constructor(private db: Database.Database) {}

  searchExpenses(userId: number, params: AdvancedSearchParams): SearchResult<any> {
    const conditions: string[] = ['e.user_id = ?'];
    const values: any[] = [userId];
    const joins: string[] = [];
    const filtersApplied: string[] = [];

    // Text search
    if (params.query) {
      conditions.push('(e.description LIKE ? OR e.notes LIKE ?)');
      const searchTerm = `%${params.query}%`;
      values.push(searchTerm, searchTerm);
      filtersApplied.push('text_search');
    }

    // Date range
    if (params.start_date) {
      conditions.push('e.date >= ?');
      values.push(params.start_date);
      filtersApplied.push('start_date');
    }
    if (params.end_date) {
      conditions.push('e.date <= ?');
      values.push(params.end_date);
      filtersApplied.push('end_date');
    }

    // Amount range
    if (params.min_amount !== undefined) {
      conditions.push('e.amount >= ?');
      values.push(params.min_amount);
      filtersApplied.push('min_amount');
    }
    if (params.max_amount !== undefined) {
      conditions.push('e.amount <= ?');
      values.push(params.max_amount);
      filtersApplied.push('max_amount');
    }

    // Categories
    if (params.category_ids && params.category_ids.length > 0) {
      const placeholders = params.category_ids.map(() => '?').join(',');
      conditions.push(`e.category_id IN (${placeholders})`);
      values.push(...params.category_ids);
      filtersApplied.push('categories');
    }

    // Tags
    if (params.tag_ids && params.tag_ids.length > 0) {
      joins.push('LEFT JOIN expense_tags et ON e.id = et.expense_id');
      
      if (params.tag_match_all) {
        // Match ALL tags (AND logic)
        conditions.push(`e.id IN (
          SELECT expense_id FROM expense_tags
          WHERE tag_id IN (${params.tag_ids.map(() => '?').join(',')})
          GROUP BY expense_id
          HAVING COUNT(DISTINCT tag_id) = ?
        )`);
        values.push(...params.tag_ids, params.tag_ids.length);
      } else {
        // Match ANY tag (OR logic)
        const placeholders = params.tag_ids.map(() => '?').join(',');
        conditions.push(`et.tag_id IN (${placeholders})`);
        values.push(...params.tag_ids);
      }
      filtersApplied.push('tags');
    }

    // Currency
    if (params.currency_codes && params.currency_codes.length > 0) {
      const placeholders = params.currency_codes.map(() => '?').join(',');
      conditions.push(`e.currency_code IN (${placeholders})`);
      values.push(...params.currency_codes);
      filtersApplied.push('currencies');
    }

    // Custom fields
    if (params.custom_fields && params.custom_fields.length > 0) {
      params.custom_fields.forEach((cf, index) => {
        const alias = `cfv${index}`;
        joins.push(`
          LEFT JOIN expense_custom_field_values ${alias}
          ON e.id = ${alias}.expense_id AND ${alias}.custom_field_id = ?
        `);
        values.push(cf.field_id);

        switch (cf.operator) {
          case 'equals':
            conditions.push(`${alias}.value = ?`);
            values.push(cf.value);
            break;
          case 'contains':
            conditions.push(`${alias}.value LIKE ?`);
            values.push(`%${cf.value}%`);
            break;
          case 'gt':
            conditions.push(`CAST(${alias}.value AS REAL) > ?`);
            values.push(parseFloat(cf.value));
            break;
          case 'lt':
            conditions.push(`CAST(${alias}.value AS REAL) < ?`);
            values.push(parseFloat(cf.value));
            break;
          case 'gte':
            conditions.push(`CAST(${alias}.value AS REAL) >= ?`);
            values.push(parseFloat(cf.value));
            break;
          case 'lte':
            conditions.push(`CAST(${alias}.value AS REAL) <= ?`);
            values.push(parseFloat(cf.value));
            break;
        }
      });
      filtersApplied.push('custom_fields');
    }

    // Payment methods
    if (params.payment_methods && params.payment_methods.length > 0) {
      const placeholders = params.payment_methods.map(() => '?').join(',');
      conditions.push(`e.payment_method IN (${placeholders})`);
      values.push(...params.payment_methods);
      filtersApplied.push('payment_methods');
    }

    // Receipt filter
    if (params.has_receipt !== undefined) {
      if (params.has_receipt) {
        conditions.push('e.receipt_path IS NOT NULL');
      } else {
        conditions.push('e.receipt_path IS NULL');
      }
      filtersApplied.push('has_receipt');
    }

    // Recurring filter
    if (params.is_recurring !== undefined) {
      conditions.push('e.is_recurring = ?');
      values.push(params.is_recurring ? 1 : 0);
      filtersApplied.push('is_recurring');
    }

    // Count total results
    const countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM expenses e
      ${joins.join('\n')}
      WHERE ${conditions.join(' AND ')}
    `;
    const countResult = this.db.prepare(countQuery).get(...values) as { total: number };
    const total = countResult.total;

    // Calculate pagination
    const offset = (params.page - 1) * params.limit;
    const totalPages = Math.ceil(total / params.limit);

    // Build main query with sorting and pagination
    const sortColumn = params.sort_by === 'category' ? 'c.name' : `e.${params.sort_by}`;
    const query = `
      SELECT DISTINCT
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      ${joins.join('\n')}
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${sortColumn} ${params.sort_order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const expenses = this.db.prepare(query).all(...values, params.limit, offset);

    // Get tags and custom fields for each expense
    const expensesWithDetails = expenses.map((expense: any) => {
      const tags = this.getExpenseTags(expense.id);
      const customFields = this.getExpenseCustomFields(expense.id);
      
      return {
        ...expense,
        tags,
        custom_fields: customFields,
      };
    });

    return {
      data: expensesWithDetails,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        total_pages: totalPages,
      },
      filters_applied: filtersApplied,
    };
  }

  private getExpenseTags(expenseId: number): any[] {
    const stmt = this.db.prepare(`
      SELECT t.*
      FROM tags t
      INNER JOIN expense_tags et ON t.id = et.tag_id
      WHERE et.expense_id = ?
    `);
    return stmt.all(expenseId);
  }

  private getExpenseCustomFields(expenseId: number): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        cf.id,
        cf.name,
        cf.field_type,
        cfv.value
      FROM custom_fields cf
      INNER JOIN expense_custom_field_values cfv ON cf.id = cfv.custom_field_id
      WHERE cfv.expense_id = ?
    `);
    return stmt.all(expenseId);
  }
}
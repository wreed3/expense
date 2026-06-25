import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDatabase } from '../index';
import { logger } from '../utils/logger';
import { cache, CacheKeys } from '../utils/cache';
import { z } from 'zod';

const router = express.Router();

// Validation schema
const searchSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.number().int().positive()).optional(),
  tags: z.array(z.number().int().positive()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  currency: z.string().length(3).optional(),
  merchant: z.string().optional(),
  hasReceipt: z.boolean().optional(),
  sortBy: z.enum(['date', 'amount', 'description', 'merchant']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

// Advanced search
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const filters = searchSchema.parse(req.body);
    
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const db = getDatabase();
    
    // Build dynamic query
    let query = `
      SELECT DISTINCT e.*,
        c.name as category_name,
        json_group_array(
          DISTINCT json_object('id', t.id, 'name', t.name, 'color', t.color)
        ) FILTER (WHERE t.id IS NOT NULL) as tags
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN expense_tags et ON e.id = et.expense_id
      LEFT JOIN tags t ON et.tag_id = t.id
      WHERE e.user_id = ?
    `;
    
    const params: any[] = [userId];

    // Full-text search
    if (filters.query) {
      query += ` AND (
        e.description LIKE ? OR 
        e.merchant LIKE ? OR 
        e.notes LIKE ?
      )`;
      const searchTerm = `%${filters.query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      query += ` AND e.category_id IN (${filters.categories.map(() => '?').join(',')})`;
      params.push(...filters.categories);
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      query += ` AND e.id IN (
        SELECT expense_id FROM expense_tags 
        WHERE tag_id IN (${filters.tags.map(() => '?').join(',')})
      )`;
      params.push(...filters.tags);
    }

    // Date range filter
    if (filters.dateFrom) {
      query += ` AND e.date >= ?`;
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      query += ` AND e.date <= ?`;
      params.push(filters.dateTo);
    }

    // Amount range filter
    if (filters.amountMin !== undefined) {
      query += ` AND e.amount >= ?`;
      params.push(filters.amountMin);
    }
    if (filters.amountMax !== undefined) {
      query += ` AND e.amount <= ?`;
      params.push(filters.amountMax);
    }

    // Currency filter
    if (filters.currency) {
      query += ` AND e.currency = ?`;
      params.push(filters.currency);
    }

    // Merchant filter
    if (filters.merchant) {
      query += ` AND e.merchant LIKE ?`;
      params.push(`%${filters.merchant}%`);
    }

    // Receipt filter
    if (filters.hasReceipt !== undefined) {
      if (filters.hasReceipt) {
        query += ` AND e.receipt_url IS NOT NULL`;
      } else {
        query += ` AND e.receipt_url IS NULL`;
      }
    }

    query += ` GROUP BY e.id`;

    // Sorting
    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';
    query += ` ORDER BY e.${sortBy} ${sortOrder.toUpperCase()}`;

    // Pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute query
    const stmt = db.prepare(query);
    const expenses = stmt.all(...params).map((expense: any) => ({
      ...expense,
      tags: expense.tags ? JSON.parse(expense.tags) : []
    }));

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM expenses e
      LEFT JOIN expense_tags et ON e.id = et.expense_id
      WHERE e.user_id = ?
    `;
    
    const countParams: any[] = [userId];
    
    // Apply same filters for count (excluding pagination)
    if (filters.query) {
      countQuery += ` AND (
        e.description LIKE ? OR 
        e.merchant LIKE ? OR 
        e.notes LIKE ?
      )`;
      const searchTerm = `%${filters.query}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.categories && filters.categories.length > 0) {
      countQuery += ` AND e.category_id IN (${filters.categories.map(() => '?').join(',')})`;
      countParams.push(...filters.categories);
    }

    if (filters.tags && filters.tags.length > 0) {
      countQuery += ` AND e.id IN (
        SELECT expense_id FROM expense_tags 
        WHERE tag_id IN (${filters.tags.map(() => '?').join(',')})
      )`;
      countParams.push(...filters.tags);
    }

    if (filters.dateFrom) {
      countQuery += ` AND e.date >= ?`;
      countParams.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      countQuery += ` AND e.date <= ?`;
      countParams.push(filters.dateTo);
    }

    if (filters.amountMin !== undefined) {
      countQuery += ` AND e.amount >= ?`;
      countParams.push(filters.amountMin);
    }
    if (filters.amountMax !== undefined) {
      countQuery += ` AND e.amount <= ?`;
      countParams.push(filters.amountMax);
    }

    if (filters.currency) {
      countQuery += ` AND e.currency = ?`;
      countParams.push(filters.currency);
    }

    if (filters.merchant) {
      countQuery += ` AND e.merchant LIKE ?`;
      countParams.push(`%${filters.merchant}%`);
    }

    if (filters.hasReceipt !== undefined) {
      if (filters.hasReceipt) {
        countQuery += ` AND e.receipt_url IS NOT NULL`;
      } else {
        countQuery += ` AND e.receipt_url IS NULL`;
      }
    }

    const countStmt = db.prepare(countQuery);
    const { total } = countStmt.get(...countParams) as { total: number };

    res.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid search parameters', details: error.errors });
    }
    logger.error('Error performing search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

export default router;
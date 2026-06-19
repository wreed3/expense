import { Router } from 'express';
import { Database } from '../database.js';

export const expenseRoutes = Router();
const db = Database.getInstance().getDb();

// Get all expenses with optional filters
expenseRoutes.get('/', (req, res) => {
  try {
    const { startDate, endDate, categoryId } = req.query;
    
    let query = `
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }
    if (categoryId) {
      query += ' AND e.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC';

    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense by ID
expenseRoutes.get('/:id', (req, res) => {
  try {
    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create expense
expenseRoutes.post('/', (req, res) => {
  try {
    const { description, amount, category_id, date } = req.body;

    if (!description || !amount || !category_id || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.prepare(`
      INSERT INTO expenses (description, amount, category_id, date)
      VALUES (?, ?, ?, ?)
    `).run(description, amount, category_id, date);

    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
expenseRoutes.put('/:id', (req, res) => {
  try {
    const { description, amount, category_id, date } = req.body;

    if (!description || !amount || !category_id || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.prepare(`
      UPDATE expenses
      SET description = ?, amount = ?, category_id = ?, date = ?
      WHERE id = ?
    `).run(description, amount, category_id, date, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
expenseRoutes.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Get expense statistics
expenseRoutes.get('/stats/summary', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = 'SELECT category_id, c.name, c.color, c.icon, SUM(amount) as total FROM expenses e JOIN categories c ON e.category_id = c.id WHERE 1=1';
    const params: any[] = [];

    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY category_id ORDER BY total DESC';

    const stats = db.prepare(query).all(...params);
    
    const totalQuery = 'SELECT SUM(amount) as total FROM expenses WHERE 1=1' +
      (startDate ? ' AND date >= ?' : '') +
      (endDate ? ' AND date <= ?' : '');
    
    const totalResult = db.prepare(totalQuery).get(...params) as { total: number };
    
    res.json({
      byCategory: stats,
      total: totalResult.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});
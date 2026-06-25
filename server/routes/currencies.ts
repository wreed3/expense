import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { getDb } from '../index';

const router = express.Router();

const currencySchema = z.object({
  code: z.string().length(3).toUpperCase(),
  name: z.string().min(1),
  symbol: z.string().min(1),
  exchange_rate: z.number().positive().default(1.0),
  is_default: z.boolean().default(false),
});

// Get all currencies
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const currencies = db.prepare(`
      SELECT * FROM currencies ORDER BY is_default DESC, code ASC
    `).all();

    res.json(currencies);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

// Get default currency
router.get('/default', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const currency = db.prepare(`
      SELECT * FROM currencies WHERE is_default = 1 LIMIT 1
    `).get();

    if (!currency) {
      return res.status(404).json({ error: 'No default currency found' });
    }

    res.json(currency);
  } catch (error) {
    console.error('Error fetching default currency:', error);
    res.status(500).json({ error: 'Failed to fetch default currency' });
  }
});

// Update currency exchange rate
router.put('/:code', authenticateToken, (req, res) => {
  try {
    const { code } = req.params;
    const { exchange_rate } = req.body;

    if (!exchange_rate || exchange_rate <= 0) {
      return res.status(400).json({ error: 'Valid exchange rate required' });
    }

    const db = getDb();
    const result = db.prepare(`
      UPDATE currencies 
      SET exchange_rate = ?, updated_at = datetime('now')
      WHERE code = ?
    `).run(exchange_rate, code);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    const currency = db.prepare('SELECT * FROM currencies WHERE code = ?').get(code);
    res.json(currency);
  } catch (error) {
    console.error('Error updating currency:', error);
    res.status(500).json({ error: 'Failed to update currency' });
  }
});

// Set default currency
router.post('/:code/set-default', authenticateToken, (req, res) => {
  try {
    const { code } = req.params;
    const db = getDb();

    // Start transaction
    db.prepare('BEGIN TRANSACTION').run();

    try {
      // Remove default from all currencies
      db.prepare('UPDATE currencies SET is_default = 0').run();

      // Set new default
      const result = db.prepare(`
        UPDATE currencies 
        SET is_default = 1, updated_at = datetime('now')
        WHERE code = ?
      `).run(code);

      if (result.changes === 0) {
        throw new Error('Currency not found');
      }

      db.prepare('COMMIT').run();

      const currency = db.prepare('SELECT * FROM currencies WHERE code = ?').get(code);
      res.json(currency);
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error setting default currency:', error);
    res.status(500).json({ error: 'Failed to set default currency' });
  }
});

// Convert amount between currencies
router.post('/convert', authenticateToken, (req, res) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({ error: 'Amount, from, and to currencies required' });
    }

    const db = getDb();
    const fromCurrency = db.prepare('SELECT * FROM currencies WHERE code = ?').get(from);
    const toCurrency = db.prepare('SELECT * FROM currencies WHERE code = ?').get(to);

    if (!fromCurrency || !toCurrency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    // Convert through base currency (USD)
    const baseAmount = amount / (fromCurrency as any).exchange_rate;
    const convertedAmount = baseAmount * (toCurrency as any).exchange_rate;

    res.json({
      original_amount: amount,
      original_currency: from,
      converted_amount: Math.round(convertedAmount * 100) / 100,
      target_currency: to,
      exchange_rate: (toCurrency as any).exchange_rate / (fromCurrency as any).exchange_rate,
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

export default router;
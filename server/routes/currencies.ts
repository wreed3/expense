import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { getDatabase } from '../index.js';

const router = express.Router();

// Get all currencies
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
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
    const db = getDatabase();
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

    const db = getDatabase();
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
    console.error('Error updating exchange rate:', error);
    res.status(500).json({ error: 'Failed to update exchange rate' });
  }
});

// Set default currency
router.post('/:code/set-default', authenticateToken, (req, res) => {
  try {
    const { code } = req.params;
    const db = getDatabase();

    // Remove default from all currencies
    db.prepare('UPDATE currencies SET is_default = 0').run();

    // Set new default
    const result = db.prepare(`
      UPDATE currencies SET is_default = 1 WHERE code = ?
    `).run(code);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    const currency = db.prepare('SELECT * FROM currencies WHERE code = ?').get(code);
    res.json(currency);
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

    const db = getDatabase();
    const fromCurrency = db.prepare('SELECT * FROM currencies WHERE code = ?').get(from);
    const toCurrency = db.prepare('SELECT * FROM currencies WHERE code = ?').get(to);

    if (!fromCurrency || !toCurrency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    // Convert to base currency (USD), then to target currency
    const baseAmount = amount / (fromCurrency as any).exchange_rate;
    const convertedAmount = baseAmount * (toCurrency as any).exchange_rate;

    res.json({
      original_amount: amount,
      original_currency: from,
      converted_amount: convertedAmount,
      target_currency: to,
      exchange_rate: (toCurrency as any).exchange_rate / (fromCurrency as any).exchange_rate,
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

export default router;
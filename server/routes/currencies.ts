import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { CurrencyService } from '../utils/currency';
import { getDatabase } from '../index';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const conversionSchema = z.object({
  amount: z.number().positive(),
  from_currency: z.string().length(3),
  to_currency: z.string().length(3),
  date: z.string().optional()
});

const exchangeRateSchema = z.object({
  from_currency: z.string().length(3),
  to_currency: z.string().length(3),
  rate: z.number().positive(),
  date: z.string()
});

// Get all currencies
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    const currencies = currencyService.getCurrencies();
    res.json(currencies);
  } catch (error) {
    logger.error('Error fetching currencies:', error);
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

// Convert amount between currencies
router.post('/convert', authenticateToken, (req, res) => {
  try {
    const validated = conversionSchema.parse(req.body);
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    
    const date = validated.date || new Date().toISOString().split('T')[0];
    const result = currencyService.convertAmount(
      validated.amount,
      validated.from_currency,
      validated.to_currency,
      date
    );

    res.json({
      original_amount: validated.amount,
      converted_amount: result.convertedAmount,
      from_currency: validated.from_currency,
      to_currency: validated.to_currency,
      exchange_rate: result.exchangeRate,
      date
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    logger.error('Error converting currency:', error);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

// Get exchange rate
router.get('/rates/:from/:to', authenticateToken, (req, res) => {
  try {
    const { from, to } = req.params;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    const rate = currencyService.getExchangeRate(from, to, date);

    res.json({
      from_currency: from,
      to_currency: to,
      rate,
      date
    });
  } catch (error) {
    logger.error('Error fetching exchange rate:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

// Get historical rates
router.get('/rates/:from/:to/history', authenticateToken, (req, res) => {
  try {
    const { from, to } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    const rates = currencyService.getHistoricalRates(
      from,
      to,
      start_date as string,
      end_date as string
    );

    res.json(rates);
  } catch (error) {
    logger.error('Error fetching historical rates:', error);
    res.status(500).json({ error: 'Failed to fetch historical rates' });
  }
});

// Set exchange rate manually
router.post('/rates', authenticateToken, (req, res) => {
  try {
    const validated = exchangeRateSchema.parse(req.body);
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    
    currencyService.setExchangeRate(
      validated.from_currency,
      validated.to_currency,
      validated.rate,
      validated.date
    );

    res.json({ message: 'Exchange rate set successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    logger.error('Error setting exchange rate:', error);
    res.status(500).json({ error: 'Failed to set exchange rate' });
  }
});

// Fetch latest exchange rates from API
router.post('/rates/fetch', authenticateToken, async (req, res) => {
  try {
    const { base_currency = 'USD' } = req.body;
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    
    await currencyService.fetchExchangeRates(base_currency);
    res.json({ message: 'Exchange rates fetched successfully' });
  } catch (error) {
    logger.error('Error fetching exchange rates from API:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

export default router;
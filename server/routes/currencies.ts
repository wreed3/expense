import express from 'express';
import { CurrencyService } from '../services/currency.service.js';
import { authenticateToken } from '../middleware/auth.js';
import { currencySchema, updateCurrencySchema, exchangeRateUpdateSchema } from '../types/currency.js';
import { getDatabase } from '../index.js';

const router = express.Router();

// Get all currencies
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    const currencies = currencyService.getAllCurrencies();
    res.json(currencies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get currency by code
router.get('/:code', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    const currency = currencyService.getCurrencyByCode(req.params.code);
    
    if (!currency) {
      return res.status(404).json({ error: 'Currency not found' });
    }
    
    res.json(currency);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get base currency
router.get('/base/current', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    const currency = currencyService.getBaseCurrency();
    res.json(currency);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create currency (admin only - for now just authenticated)
router.post('/', authenticateToken, (req, res) => {
  try {
    const validatedData = currencySchema.parse(req.body);
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    
    const currency = currencyService.createCurrency(validatedData);
    res.status(201).json(currency);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid currency data', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update currency
router.put('/:code', authenticateToken, (req, res) => {
  try {
    const validatedData = updateCurrencySchema.parse(req.body);
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    
    const currency = currencyService.updateCurrency(req.params.code, validatedData);
    res.json(currency);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid currency data', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update exchange rate
router.patch('/:code/exchange-rate', authenticateToken, (req, res) => {
  try {
    const validatedData = exchangeRateUpdateSchema.parse({
      code: req.params.code,
      exchange_rate: req.body.exchange_rate,
    });
    
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    const currency = currencyService.updateExchangeRate(validatedData);
    
    res.json(currency);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid exchange rate data', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete currency
router.delete('/:code', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    currencyService.deleteCurrency(req.params.code);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Convert currency
router.post('/convert', authenticateToken, (req, res) => {
  try {
    const { amount, from, to } = req.body;
    
    if (!amount || !from || !to) {
      return res.status(400).json({ error: 'Amount, from, and to are required' });
    }
    
    const db = getDatabase();
    const currencyService = new CurrencyService(db);
    const conversion = currencyService.convertAmount(Number(amount), from, to);
    
    res.json(conversion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
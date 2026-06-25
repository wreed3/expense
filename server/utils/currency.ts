import Database from 'better-sqlite3';
import { logger } from './logger';

export class CurrencyService {
  private db: Database.Database;
  private exchangeRateApiKey?: string;

  constructor(db: Database.Database) {
    this.db = db;
    this.exchangeRateApiKey = process.env.EXCHANGE_RATE_API_KEY;
  }

  /**
   * Get all active currencies
   */
  getCurrencies() {
    const stmt = this.db.prepare(`
      SELECT * FROM currencies 
      WHERE is_active = 1 
      ORDER BY code
    `);
    return stmt.all();
  }

  /**
   * Get exchange rate between two currencies for a specific date
   */
  getExchangeRate(fromCurrency: string, toCurrency: string, date: string): number {
    if (fromCurrency === toCurrency) return 1.0;

    // Try to get cached rate
    const stmt = this.db.prepare(`
      SELECT rate FROM exchange_rates 
      WHERE from_currency = ? AND to_currency = ? AND date = ?
      ORDER BY created_at DESC LIMIT 1
    `);
    
    const cached = stmt.get(fromCurrency, toCurrency, date) as { rate: number } | undefined;
    if (cached) return cached.rate;

    // Try reverse rate
    const reverseStmt = this.db.prepare(`
      SELECT rate FROM exchange_rates 
      WHERE from_currency = ? AND to_currency = ? AND date = ?
      ORDER BY created_at DESC LIMIT 1
    `);
    
    const reverse = reverseStmt.get(toCurrency, fromCurrency, date) as { rate: number } | undefined;
    if (reverse) return 1 / reverse.rate;

    // Default to 1.0 if no rate found
    logger.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency} on ${date}`);
    return 1.0;
  }

  /**
   * Fetch and cache exchange rates from external API
   */
  async fetchExchangeRates(baseCurrency: string = 'USD', date?: string): Promise<void> {
    if (!this.exchangeRateApiKey) {
      logger.warn('Exchange rate API key not configured');
      return;
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Using exchangerate-api.com as example (free tier available)
      const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
      }

      const data = await response.json();
      const rates = data.rates as Record<string, number>;

      // Cache all rates
      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO exchange_rates (from_currency, to_currency, rate, date, source)
        VALUES (?, ?, ?, ?, 'api')
      `);

      const transaction = this.db.transaction((rates: Record<string, number>) => {
        for (const [currency, rate] of Object.entries(rates)) {
          insertStmt.run(baseCurrency, currency, rate, targetDate);
        }
      });

      transaction(rates);
      logger.info(`Cached ${Object.keys(rates).length} exchange rates for ${baseCurrency} on ${targetDate}`);
    } catch (error) {
      logger.error('Failed to fetch exchange rates:', error);
      throw error;
    }
  }

  /**
   * Convert amount between currencies
   */
  convertAmount(amount: number, fromCurrency: string, toCurrency: string, date: string): {
    convertedAmount: number;
    exchangeRate: number;
  } {
    const rate = this.getExchangeRate(fromCurrency, toCurrency, date);
    return {
      convertedAmount: amount * rate,
      exchangeRate: rate
    };
  }

  /**
   * Add or update exchange rate manually
   */
  setExchangeRate(fromCurrency: string, toCurrency: string, rate: number, date: string) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO exchange_rates (from_currency, to_currency, rate, date, source)
      VALUES (?, ?, ?, ?, 'manual')
    `);
    return stmt.run(fromCurrency, toCurrency, rate, date);
  }

  /**
   * Get historical rates for a currency pair
   */
  getHistoricalRates(fromCurrency: string, toCurrency: string, startDate: string, endDate: string) {
    const stmt = this.db.prepare(`
      SELECT date, rate, source 
      FROM exchange_rates 
      WHERE from_currency = ? AND to_currency = ? 
        AND date BETWEEN ? AND ?
      ORDER BY date DESC
    `);
    return stmt.all(fromCurrency, toCurrency, startDate, endDate);
  }
}
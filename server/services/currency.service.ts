import Database from 'better-sqlite3';
import { Currency, UpdateCurrency, ExchangeRateUpdate, CurrencyConversion } from '../types/currency.js';

export class CurrencyService {
  constructor(private db: Database.Database) {}

  getAllCurrencies(): Currency[] {
    const stmt = this.db.prepare(`
      SELECT * FROM currencies
      ORDER BY is_base DESC, code ASC
    `);
    return stmt.all() as Currency[];
  }

  getCurrencyByCode(code: string): Currency | undefined {
    const stmt = this.db.prepare('SELECT * FROM currencies WHERE code = ?');
    return stmt.get(code) as Currency | undefined;
  }

  getBaseCurrency(): Currency {
    const stmt = this.db.prepare('SELECT * FROM currencies WHERE is_base = 1');
    const currency = stmt.get() as Currency | undefined;
    
    if (!currency) {
      throw new Error('No base currency configured');
    }
    
    return currency;
  }

  createCurrency(currency: Omit<Currency, 'id' | 'created_at' | 'updated_at'>): Currency {
    const stmt = this.db.prepare(`
      INSERT INTO currencies (code, name, symbol, exchange_rate, is_base)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      currency.code,
      currency.name,
      currency.symbol,
      currency.exchange_rate,
      currency.is_base ? 1 : 0
    );

    return this.getCurrencyByCode(currency.code)!;
  }

  updateCurrency(code: string, updates: UpdateCurrency): Currency {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.symbol !== undefined) {
      fields.push('symbol = ?');
      values.push(updates.symbol);
    }
    if (updates.exchange_rate !== undefined) {
      fields.push('exchange_rate = ?');
      values.push(updates.exchange_rate);
    }
    if (updates.is_base !== undefined) {
      fields.push('is_base = ?');
      values.push(updates.is_base ? 1 : 0);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(code);

    const stmt = this.db.prepare(`
      UPDATE currencies
      SET ${fields.join(', ')}
      WHERE code = ?
    `);

    stmt.run(...values);
    return this.getCurrencyByCode(code)!;
  }

  updateExchangeRate(update: ExchangeRateUpdate): Currency {
    const stmt = this.db.prepare(`
      UPDATE currencies
      SET exchange_rate = ?, updated_at = CURRENT_TIMESTAMP
      WHERE code = ?
    `);

    stmt.run(update.exchange_rate, update.code);
    return this.getCurrencyByCode(update.code)!;
  }

  deleteCurrency(code: string): void {
    // Check if currency is in use
    const checkStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT 1 FROM expenses WHERE currency_code = ?
        UNION ALL
        SELECT 1 FROM budgets WHERE currency_code = ?
        UNION ALL
        SELECT 1 FROM income WHERE currency_code = ?
      )
    `);

    const result = checkStmt.get(code, code, code) as { count: number };

    if (result.count > 0) {
      throw new Error('Cannot delete currency that is in use');
    }

    const stmt = this.db.prepare('DELETE FROM currencies WHERE code = ? AND is_base = 0');
    const info = stmt.run(code);

    if (info.changes === 0) {
      throw new Error('Cannot delete base currency or currency not found');
    }
  }

  convertAmount(amount: number, fromCode: string, toCode: string): CurrencyConversion {
    const fromCurrency = this.getCurrencyByCode(fromCode);
    const toCurrency = this.getCurrencyByCode(toCode);

    if (!fromCurrency || !toCurrency) {
      throw new Error('Invalid currency code');
    }

    // Convert to base currency first, then to target currency
    const baseAmount = amount / fromCurrency.exchange_rate;
    const convertedAmount = baseAmount * toCurrency.exchange_rate;

    return {
      from: fromCode,
      to: toCode,
      amount,
      converted_amount: convertedAmount,
      exchange_rate: toCurrency.exchange_rate / fromCurrency.exchange_rate,
      timestamp: new Date().toISOString(),
    };
  }

  convertToBaseCurrency(amount: number, fromCode: string): number {
    const currency = this.getCurrencyByCode(fromCode);
    if (!currency) {
      throw new Error('Invalid currency code');
    }
    return amount / currency.exchange_rate;
  }

  convertFromBaseCurrency(amount: number, toCode: string): number {
    const currency = this.getCurrencyByCode(toCode);
    if (!currency) {
      throw new Error('Invalid currency code');
    }
    return amount * currency.exchange_rate;
  }
}
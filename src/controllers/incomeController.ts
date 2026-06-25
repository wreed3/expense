import { Request, Response } from 'express';
import { db } from '../db';
import { incomeSources, incomeRecords } from '../db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { z } from 'zod';
import { addMonths, addWeeks, addDays, addQuarters, addYears } from 'date-fns';

// Validation schemas
const createIncomeSourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.string().or(z.number()).refine((val) => !isNaN(parseFloat(String(val)))),
  frequency: z.enum(['one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'annually']),
  category: z.string().min(1, 'Category is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const createIncomeRecordSchema = z.object({
  amount: z.string().or(z.number()).refine((val) => !isNaN(parseFloat(String(val)))),
  category: z.string().min(1, 'Category is required'),
  date: z.string().datetime(),
  description: z.string().optional(),
  sourceId: z.number().optional(),
});

export class IncomeController {
  /**
   * Create recurring income source
   */
  async createIncomeSource(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const validated = createIncomeSourceSchema.parse(req.body);

      const [incomeSource] = await db
        .insert(incomeSources)
        .values({
          userId,
          name: validated.name,
          amount: validated.amount.toString(),
          frequency: validated.frequency,
          category: validated.category,
          startDate: new Date(validated.startDate),
          endDate: validated.endDate ? new Date(validated.endDate) : null,
          notes: validated.notes,
        })
        .returning();

      res.status(201).json({
        success: true,
        data: incomeSource,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create income source',
      });
    }
  }

  /**
   * Get all income sources for user
   */
  async getIncomeSources(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { active } = req.query;

      let query = db.select().from(incomeSources).where(eq(incomeSources.userId, userId));

      if (active === 'true') {
        query = query.where(eq(incomeSources.isActive, true));
      }

      const sources = await query;

      res.json({
        success: true,
        data: sources,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch income sources',
      });
    }
  }

  /**
   * Update income source
   */
  async updateIncomeSource(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const validated = createIncomeSourceSchema.partial().parse(req.body);

      const updateData: any = {
        ...validated,
        updatedAt: new Date(),
      };

      if (validated.amount) {
        updateData.amount = validated.amount.toString();
      }
      if (validated.startDate) {
        updateData.startDate = new Date(validated.startDate);
      }
      if (validated.endDate) {
        updateData.endDate = new Date(validated.endDate);
      }

      const [updated] = await db
        .update(incomeSources)
        .set(updateData)
        .where(and(eq(incomeSources.id, parseInt(id)), eq(incomeSources.userId, userId)))
        .returning();

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Income source not found',
        });
      }

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update income source',
      });
    }
  }

  /**
   * Delete income source
   */
  async deleteIncomeSource(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const [deleted] = await db
        .delete(incomeSources)
        .where(and(eq(incomeSources.id, parseInt(id)), eq(incomeSources.userId, userId)))
        .returning();

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Income source not found',
        });
      }

      res.json({
        success: true,
        message: 'Income source deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete income source',
      });
    }
  }

  /**
   * Create income record
   */
  async createIncomeRecord(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const validated = createIncomeRecordSchema.parse(req.body);

      const [record] = await db
        .insert(incomeRecords)
        .values({
          userId,
          sourceId: validated.sourceId || null,
          amount: validated.amount.toString(),
          category: validated.category,
          date: new Date(validated.date),
          description: validated.description,
        })
        .returning();

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create income record',
      });
    }
  }

  /**
   * Get income records with filters
   */
  async getIncomeRecords(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { startDate, endDate, category, sourceId } = req.query;

      let query = db.select().from(incomeRecords).where(eq(incomeRecords.userId, userId));

      if (startDate) {
        query = query.where(gte(incomeRecords.date, new Date(startDate as string)));
      }
      if (endDate) {
        query = query.where(lte(incomeRecords.date, new Date(endDate as string)));
      }
      if (category) {
        query = query.where(eq(incomeRecords.category, category as string));
      }
      if (sourceId) {
        query = query.where(eq(incomeRecords.sourceId, parseInt(sourceId as string)));
      }

      const records = await query.orderBy(desc(incomeRecords.date));

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch income records',
      });
    }
  }

  /**
   * Generate recurring income records
   */
  async generateRecurringIncome(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { sourceId } = req.params;

      const [source] = await db
        .select()
        .from(incomeSources)
        .where(and(eq(incomeSources.id, parseInt(sourceId)), eq(incomeSources.userId, userId)));

      if (!source) {
        return res.status(404).json({
          success: false,
          error: 'Income source not found',
        });
      }

      if (!source.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Income source is not active',
        });
      }

      // Calculate next occurrence date
      const lastRecord = await db
        .select()
        .from(incomeRecords)
        .where(and(eq(incomeRecords.sourceId, source.id), eq(incomeRecords.userId, userId)))
        .orderBy(desc(incomeRecords.date))
        .limit(1);

      const baseDate = lastRecord.length > 0 ? lastRecord[0].date : source.startDate;
      let nextDate: Date;

      switch (source.frequency) {
        case 'weekly':
          nextDate = addWeeks(baseDate, 1);
          break;
        case 'bi-weekly':
          nextDate = addWeeks(baseDate, 2);
          break;
        case 'monthly':
          nextDate = addMonths(baseDate, 1);
          break;
        case 'quarterly':
          nextDate = addQuarters(baseDate, 1);
          break;
        case 'annually':
          nextDate = addYears(baseDate, 1);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'One-time income sources cannot generate recurring records',
          });
      }

      // Check if end date has passed
      if (source.endDate && nextDate > source.endDate) {
        return res.status(400).json({
          success: false,
          error: 'Income source has ended',
        });
      }

      const [record] = await db
        .insert(incomeRecords)
        .values({
          userId,
          sourceId: source.id,
          amount: source.amount,
          category: source.category,
          date: nextDate,
          description: `Recurring income from ${source.name}`,
        })
        .returning();

      res.status(201).json({
        success: true,
        data: record,
        message: 'Recurring income record generated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate recurring income',
      });
    }
  }

  /**
   * Get income summary
   */
  async getIncomeSummary(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { startDate, endDate } = req.query;

      let query = db.select().from(incomeRecords).where(eq(incomeRecords.userId, userId));

      if (startDate) {
        query = query.where(gte(incomeRecords.date, new Date(startDate as string)));
      }
      if (endDate) {
        query = query.where(lte(incomeRecords.date, new Date(endDate as string)));
      }

      const records = await query;

      const totalIncome = records.reduce((sum, record) => sum + parseFloat(record.amount), 0);

      const byCategory = records.reduce((acc, record) => {
        if (!acc[record.category]) {
          acc[record.category] = 0;
        }
        acc[record.category] += parseFloat(record.amount);
        return acc;
      }, {} as Record<string, number>);

      res.json({
        success: true,
        data: {
          totalIncome,
          recordCount: records.length,
          byCategory,
          averageIncome: records.length > 0 ? totalIncome / records.length : 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch income summary',
      });
    }
  }
}
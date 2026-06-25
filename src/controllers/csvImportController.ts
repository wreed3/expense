import { Request, Response } from 'express';
import { db } from '../db';
import { csvImports, importMappings, expenses } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CSVParser } from '../utils/csvParser';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

const createMappingSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  dateColumn: z.string().min(1, 'Date column is required'),
  descriptionColumn: z.string().min(1, 'Description column is required'),
  amountColumn: z.string().min(1, 'Amount column is required'),
  categoryColumn: z.string().optional(),
});

export class CSVImportController {
  /**
   * Create or update import mapping
   */
  async createMapping(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const validated = createMappingSchema.parse(req.body);

      // Check if mapping exists
      const existing = await db
        .select()
        .from(importMappings)
        .where(
          and(eq(importMappings.userId, userId), eq(importMappings.bankName, validated.bankName))
        );

      let mapping;
      if (existing.length > 0) {
        // Update existing mapping
        [mapping] = await db
          .update(importMappings)
          .set({
            ...validated,
            updatedAt: new Date(),
          })
          .where(eq(importMappings.id, existing[0].id))
          .returning();
      } else {
        // Create new mapping
        [mapping] = await db.insert(importMappings).values({ userId, ...validated }).returning();
      }

      res.status(201).json({
        success: true,
        data: mapping,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create mapping',
      });
    }
  }

  /**
   * Get all mappings for user
   */
  async getMappings(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const mappings = await db
        .select()
        .from(importMappings)
        .where(eq(importMappings.userId, userId));

      res.json({
        success: true,
        data: mappings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch mappings',
      });
    }
  }

  /**
   * Import CSV file
   */
  async importCSV(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { mappingId } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Get mapping
      const [mapping] = await db
        .select()
        .from(importMappings)
        .where(and(eq(importMappings.id, parseInt(mappingId)), eq(importMappings.userId, userId)));

      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: 'Mapping not found',
        });
      }

      // Create import record
      const [importRecord] = await db
        .insert(csvImports)
        .values({
          userId,
          fileName: req.file.originalname,
          status: 'processing',
        })
        .returning();

      // Read and parse CSV
      const fileContent = await fs.readFile(req.file.path, 'utf-8');
      const parser = new CSVParser({
        dateColumn: mapping.dateColumn,
        descriptionColumn: mapping.descriptionColumn,
        amountColumn: mapping.amountColumn,
        categoryColumn: mapping.categoryColumn,
      });

      const parseResult = await parser.parseCSV(fileContent);

      if (!parseResult.success) {
        await db
          .update(csvImports)
          .set({
            status: 'failed',
            errorLog: JSON.stringify(parseResult.errors),
            totalRecords: parseResult.stats.totalRows,
            failedRecords: parseResult.stats.invalidRows,
          })
          .where(eq(csvImports.id, importRecord.id));

        return res.status(400).json({
          success: false,
          error: 'CSV parsing failed',
          details: parseResult.errors,
        });
      }

      // Get existing expenses to detect duplicates
      const existingExpenses = await db
        .select()
        .from(expenses)
        .where(eq(expenses.userId, userId));

      const { duplicates, unique } = CSVParser.detectDuplicates(
        parseResult.data!,
        existingExpenses
      );

      // Insert unique transactions
      const inserted = [];
      for (const transaction of unique) {
        const [expense] = await db
          .insert(expenses)
          .values({
            userId,
            amount: transaction.amount.toString(),
            description: transaction.description,
            category: transaction.category || 'Uncategorized',
            date: transaction.date,
          })
          .returning();
        inserted.push(expense);
      }

      // Update import record
      await db
        .update(csvImports)
        .set({
          status: 'completed',
          totalRecords: parseResult.stats.totalRows,
          successfulRecords: inserted.length,
          failedRecords: duplicates.length,
          importedAt: new Date(),
        })
        .where(eq(csvImports.id, importRecord.id));

      // Clean up uploaded file
      await fs.unlink(req.file.path);

      res.json({
        success: true,
        data: {
          importId: importRecord.id,
          imported: inserted.length,
          duplicates: duplicates.length,
          failed: parseResult.stats.invalidRows,
          total: parseResult.stats.totalRows,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import CSV',
      });
    }
  }

  /**
   * Get import history
   */
  async getImportHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const history = await db.select().from(csvImports).where(eq(csvImports.userId, userId));

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch import history',
      });
    }
  }

  /**
   * Get import details
   */
  async getImportDetails(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const [importRecord] = await db
        .select()
        .from(csvImports)
        .where(and(eq(csvImports.id, parseInt(id)), eq(csvImports.userId, userId)));

      if (!importRecord) {
        return res.status(404).json({
          success: false,
          error: 'Import record not found',
        });
      }

      res.json({
        success: true,
        data: importRecord,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch import details',
      });
    }
  }
}
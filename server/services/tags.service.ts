import Database from 'better-sqlite3';
import { Tag, CreateTag, UpdateTag, TagWithCount } from '../types/tags.js';

export class TagsService {
  constructor(private db: Database.Database) {}

  getAllTags(userId: number): TagWithCount[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        COUNT(et.expense_id) as expense_count
      FROM tags t
      LEFT JOIN expense_tags et ON t.id = et.tag_id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.name ASC
    `);
    return stmt.all(userId) as TagWithCount[];
  }

  getTagById(id: number, userId: number): Tag | undefined {
    const stmt = this.db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as Tag | undefined;
  }

  getTagsByExpenseId(expenseId: number): Tag[] {
    const stmt = this.db.prepare(`
      SELECT t.*
      FROM tags t
      INNER JOIN expense_tags et ON t.id = et.tag_id
      WHERE et.expense_id = ?
      ORDER BY t.name ASC
    `);
    return stmt.all(expenseId) as Tag[];
  }

  createTag(userId: number, data: CreateTag): Tag {
    const stmt = this.db.prepare(`
      INSERT INTO tags (user_id, name, color)
      VALUES (?, ?, ?)
    `);

    const info = stmt.run(userId, data.name, data.color || '#3B82F6');
    
    return this.getTagById(Number(info.lastInsertRowid), userId)!;
  }

  updateTag(id: number, userId: number, updates: UpdateTag): Tag {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id, userId);

    const stmt = this.db.prepare(`
      UPDATE tags
      SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

    const info = stmt.run(...values);

    if (info.changes === 0) {
      throw new Error('Tag not found');
    }

    return this.getTagById(id, userId)!;
  }

  deleteTag(id: number, userId: number): void {
    // First delete all expense_tags associations
    const deleteAssocStmt = this.db.prepare('DELETE FROM expense_tags WHERE tag_id = ?');
    deleteAssocStmt.run(id);

    // Then delete the tag
    const stmt = this.db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, userId);

    if (info.changes === 0) {
      throw new Error('Tag not found');
    }
  }

  addTagToExpense(expenseId: number, tagId: number): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO expense_tags (expense_id, tag_id)
      VALUES (?, ?)
    `);
    stmt.run(expenseId, tagId);
  }

  removeTagFromExpense(expenseId: number, tagId: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM expense_tags
      WHERE expense_id = ? AND tag_id = ?
    `);
    stmt.run(expenseId, tagId);
  }

  setExpenseTags(expenseId: number, tagIds: number[]): void {
    // Delete existing tags
    const deleteStmt = this.db.prepare('DELETE FROM expense_tags WHERE expense_id = ?');
    deleteStmt.run(expenseId);

    // Add new tags
    if (tagIds.length > 0) {
      const insertStmt = this.db.prepare(`
        INSERT INTO expense_tags (expense_id, tag_id)
        VALUES (?, ?)
      `);

      for (const tagId of tagIds) {
        insertStmt.run(expenseId, tagId);
      }
    }
  }

  searchTags(userId: number, query: string): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags
      WHERE user_id = ? AND name LIKE ?
      ORDER BY name ASC
    `);
    return stmt.all(userId, `%${query}%`) as Tag[];
  }
}
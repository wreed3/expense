import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import expenseRoutes from '../../routes/expenses.js';
import { auth } from '../../middleware/auth.js';
import {
  createTestUser,
  createTestCategory,
  createTestExpense,
  generateTestToken,
} from '../helpers/testHelpers.js';

const app = express();
app.use(express.json());
app.use(auth);
app.use('/api/expenses', expenseRoutes);

describe('Expense Routes', () => {
  let user: any;
  let token: string;
  let category: any;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user.id);
    category = createTestCategory(user.id);
  });

  describe('GET /api/expenses', () => {
    test('should return all expenses for user', async () => {
      createTestExpense(user.id, category.id, 50, 'Expense 1');
      createTestExpense(user.id, category.id, 100, 'Expense 2');

      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('expenses');
      expect(response.body.expenses).toHaveLength(2);
      expect(response.body.expenses[0]).toHaveProperty('category');
    });

    test('should filter expenses by category', async () => {
      const category2 = createTestCategory(user.id, 'Category 2', '#ff0000');
      createTestExpense(user.id, category.id, 50, 'Expense 1');
      createTestExpense(user.id, category2.id, 100, 'Expense 2');

      const response = await request(app)
        .get('/api/expenses')
        .query({ categoryId: category.id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].category_id).toBe(category.id);
    });

    test('should filter expenses by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      createTestExpense(user.id, category.id, 50, 'Today', today);
      createTestExpense(user.id, category.id, 100, 'Yesterday', yesterday);

      const response = await request(app)
        .get('/api/expenses')
        .query({ startDate: today, endDate: today })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].date).toBe(today);
    });

    test('should search expenses by description', async () => {
      createTestExpense(user.id, category.id, 50, 'Coffee');
      createTestExpense(user.id, category.id, 100, 'Lunch');

      const response = await request(app)
        .get('/api/expenses')
        .query({ search: 'coffee' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].description).toContain('Coffee');
    });

    test('should return empty array when no expenses exist', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(0);
    });
  });

  describe('POST /api/expenses', () => {
    test('should create a new expense', async () => {
      const expenseData = {
        category_id: category.id,
        amount: 75.50,
        description: 'New Expense',
        date: new Date().toISOString().split('T')[0],
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('expense');
      expect(response.body.expense.amount).toBe(75.50);
      expect(response.body.expense.description).toBe('New Expense');
      expect(response.body.expense.user_id).toBe(user.id);
    });

    test('should create recurring expense', async () => {
      const expenseData = {
        category_id: category.id,
        amount: 50,
        description: 'Monthly Subscription',
        date: new Date().toISOString().split('T')[0],
        is_recurring: true,
        recurring_frequency: 'monthly',
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body.expense.is_recurring).toBe(1);
      expect(response.body.expense.recurring_frequency).toBe('monthly');
    });

    test('should reject expense with invalid category', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category_id: 99999,
          amount: 50,
          description: 'Test',
          date: new Date().toISOString().split('T')[0],
        });

      expect(response.status).toBe(400);
    });

    test('should reject expense with negative amount', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category_id: category.id,
          amount: -50,
          description: 'Test',
          date: new Date().toISOString().split('T')[0],
        });

      expect(response.status).toBe(400);
    });

    test('should reject expense with missing required fields', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 50,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/expenses/:id', () => {
    test('should return expense by id', async () => {
      const expense = createTestExpense(user.id, category.id);

      const response = await request(app)
        .get(`/api/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('expense');
      expect(response.body.expense.id).toBe(expense.id);
      expect(response.body.expense).toHaveProperty('category');
    });

    test('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .get('/api/expenses/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test('should not return expense from different user', async () => {
      const otherUser = await createTestUser('other@example.com');
      const otherCategory = createTestCategory(otherUser.id);
      const otherExpense = createTestExpense(otherUser.id, otherCategory.id);

      const response = await request(app)
        .get(`/api/expenses/${otherExpense.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/expenses/:id', () => {
    test('should update expense', async () => {
      const expense = createTestExpense(user.id, category.id, 50, 'Original');

      const response = await request(app)
        .put(`/api/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 100,
          description: 'Updated',
        });

      expect(response.status).toBe(200);
      expect(response.body.expense.amount).toBe(100);
      expect(response.body.expense.description).toBe('Updated');
    });

    test('should not update expense from different user', async () => {
      const otherUser = await createTestUser('other@example.com');
      const otherCategory = createTestCategory(otherUser.id);
      const otherExpense = createTestExpense(otherUser.id, otherCategory.id);

      const response = await request(app)
        .put(`/api/expenses/${otherExpense.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 });

      expect(response.status).toBe(404);
    });

    test('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .put('/api/expenses/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    test('should delete expense', async () => {
      const expense = createTestExpense(user.id, category.id);

      const response = await request(app)
        .delete(`/api/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('should not delete expense from different user', async () => {
      const otherUser = await createTestUser('other@example.com');
      const otherCategory = createTestCategory(otherUser.id);
      const otherExpense = createTestExpense(otherUser.id, otherCategory.id);

      const response = await request(app)
        .delete(`/api/expenses/${otherExpense.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .delete('/api/expenses/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import budgetRoutes from '../../routes/budgets.js';
import { auth } from '../../middleware/auth.js';
import {
  createTestUser,
  createTestCategory,
  createTestBudget,
  createTestExpense,
  generateTestToken,
} from '../helpers/testHelpers.js';

const app = express();
app.use(express.json());
app.use(auth);
app.use('/api/budgets', budgetRoutes);

describe('Budget Routes', () => {
  let user: any;
  let token: string;
  let category: any;
  let currentMonth: string;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user.id);
    category = createTestCategory(user.id);
    currentMonth = new Date().toISOString().slice(0, 7);
  });

  describe('GET /api/budgets', () => {
    test('should return all budgets for user', async () => {
      const category2 = createTestCategory(user.id, 'Category 2');
      createTestBudget(user.id, category.id, 1000, currentMonth);
      createTestBudget(user.id, category2.id, 500, currentMonth);

      const response = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('budgets');
      expect(response.body.budgets).toHaveLength(2);
      expect(response.body.budgets[0]).toHaveProperty('category');
      expect(response.body.budgets[0]).toHaveProperty('spent');
      expect(response.body.budgets[0]).toHaveProperty('remaining');
      expect(response.body.budgets[0]).toHaveProperty('percentage');
    });

    test('should calculate spent amount correctly', async () => {
      createTestBudget(user.id, category.id, 1000, currentMonth);
      createTestExpense(user.id, category.id, 200, 'Expense 1', currentMonth + '-15');
      createTestExpense(user.id, category.id, 300, 'Expense 2', currentMonth + '-20');

      const response = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.budgets[0].spent).toBe(500);
      expect(response.body.budgets[0].remaining).toBe(500);
      expect(response.body.budgets[0].percentage).toBe(50);
    });

    test('should filter budgets by month', async () => {
      const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
        .toISOString().slice(0, 7);
      
      createTestBudget(user.id, category.id, 1000, currentMonth);
      createTestBudget(user.id, category.id, 800, lastMonth);

      const response = await request(app)
        .get('/api/budgets')
        .query({ month: currentMonth })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.budgets).toHaveLength(1);
      expect(response.body.budgets[0].month).toBe(currentMonth);
    });

    test('should return empty array when no budgets exist', async () => {
      const response = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.budgets).toHaveLength(0);
    });
  });

  describe('POST /api/budgets', () => {
    test('should create a new budget', async () => {
      const budgetData = {
        category_id: category.id,
        amount: 1500,
        month: currentMonth,
        alert_threshold: 0.9,
      };

      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(budgetData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('budget');
      expect(response.body.budget.amount).toBe(1500);
      expect(response.body.budget.month).toBe(currentMonth);
      expect(response.body.budget.alert_threshold).toBe(0.9);
    });

    test('should create budget with default alert threshold', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category_id: category.id,
          amount: 1000,
          month: currentMonth,
        });

      expect(response.status).toBe(201);
      expect(response.body.budget.alert_threshold).toBe(0.8);
    });

    test('should reject duplicate budget for same category and month', async () => {
      createTestBudget(user.id, category.id, 1000, currentMonth);

      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category_id: category.id,
          amount: 1500,
          month: currentMonth,
        });

      expect(response.status).toBe(400);
    });

    test('should allow budget for same category in different month', async () => {
      const nextMonth = new Date(new Date().setMonth(new Date().getMonth() + 1))
        .toISOString().slice(0, 7);
      
      createTestBudget(user.id, category.id, 1000, currentMonth);

      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category_id: category.id,
          amount: 1500,
          month: nextMonth,
        });

      expect(response.status).toBe(201);
    });

    test('should reject budget with negative amount', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category_id: category.id,
          amount: -1000,
          month: currentMonth,
        });

      expect(response.status).toBe(400);
    });

    test('should reject budget with invalid category', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category_id: 99999,
          amount: 1000,
          month: currentMonth,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/budgets/:id', () => {
    test('should update budget', async () => {
      const budget = createTestBudget(user.id, category.id, 1000, currentMonth);

      const response = await request(app)
        .put(`/api/budgets/${budget.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 1500,
          alert_threshold: 0.9,
        });

      expect(response.status).toBe(200);
      expect(response.body.budget.amount).toBe(1500);
      expect(response.body.budget.alert_threshold).toBe(0.9);
    });

    test('should not update budget from different user', async () => {
      const otherUser = await createTestUser('other@example.com');
      const otherCategory = createTestCategory(otherUser.id);
      const otherBudget = createTestBudget(otherUser.id, otherCategory.id);

      const response = await request(app)
        .put(`/api/budgets/${otherBudget.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 2000 });

      expect(response.status).toBe(404);
    });

    test('should return 404 for non-existent budget', async () => {
      const response = await request(app)
        .put('/api/budgets/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1500 });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    test('should delete budget', async () => {
      const budget = createTestBudget(user.id, category.id);

      const response = await request(app)
        .delete(`/api/budgets/${budget.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('should not delete budget from different user', async () => {
      const otherUser = await createTestUser('other@example.com');
      const otherCategory = createTestCategory(otherUser.id);
      const otherBudget = createTestBudget(otherUser.id, otherCategory.id);

      const response = await request(app)
        .delete(`/api/budgets/${otherBudget.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test('should return 404 for non-existent budget', async () => {
      const response = await request(app)
        .delete('/api/budgets/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
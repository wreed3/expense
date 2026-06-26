import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import analyticsRoutes from '../../routes/analytics.js';
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
app.use('/api/analytics', analyticsRoutes);

describe('Analytics Routes', () => {
  let user: any;
  let token: string;
  let category1: any;
  let category2: any;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user.id);
    category1 = createTestCategory(user.id, 'Food', '#3b82f6');
    category2 = createTestCategory(user.id, 'Transport', '#ef4444');
  });

  describe('GET /api/analytics/summary', () => {
    test('should return spending summary', async () => {
      const today = new Date().toISOString().split('T')[0];
      createTestExpense(user.id, category1.id, 100, 'Expense 1', today);
      createTestExpense(user.id, category2.id, 50, 'Expense 2', today);
      createTestExpense(user.id, category1.id, 75, 'Expense 3', today);

      const response = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary.total).toBe(225);
      expect(response.body.summary.count).toBe(3);
      expect(response.body.summary.average).toBeCloseTo(75, 2);
    });

    test('should filter summary by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86400000);
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      createTestExpense(user.id, category1.id, 100, 'Today', todayStr);
      createTestExpense(user.id, category1.id, 50, 'Yesterday', yesterdayStr);

      const response = await request(app)
        .get('/api/analytics/summary')
        .query({ startDate: todayStr, endDate: todayStr })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.summary.total).toBe(100);
      expect(response.body.summary.count).toBe(1);
    });

    test('should return zero values when no expenses exist', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.summary.total).toBe(0);
      expect(response.body.summary.count).toBe(0);
      expect(response.body.summary.average).toBe(0);
    });
  });

  describe('GET /api/analytics/trends', () => {
    test('should return spending trends by day', async () => {
      const today = new Date();
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today.getTime() - i * 86400000);
        return date.toISOString().split('T')[0];
      });

      dates.forEach((date, i) => {
        createTestExpense(user.id, category1.id, (i + 1) * 10, `Expense ${i}`, date);
      });

      const response = await request(app)
        .get('/api/analytics/trends')
        .query({ period: 'day' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('trends');
      expect(Array.isArray(response.body.trends)).toBe(true);
      expect(response.body.trends.length).toBeGreaterThan(0);
    });

    test('should return spending trends by month', async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      createTestExpense(user.id, category1.id, 100, 'Expense 1', currentMonth + '-01');
      createTestExpense(user.id, category1.id, 200, 'Expense 2', currentMonth + '-15');

      const response = await request(app)
        .get('/api/analytics/trends')
        .query({ period: 'month' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.trends).toBeDefined();
    });

    test('should filter trends by category', async () => {
      const today = new Date().toISOString().split('T')[0];
      createTestExpense(user.id, category1.id, 100, 'Food', today);
      createTestExpense(user.id, category2.id, 50, 'Transport', today);

      const response = await request(app)
        .get('/api/analytics/trends')
        .query({ categoryId: category1.id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.trends).toBeDefined();
    });
  });

  describe('GET /api/analytics/categories', () => {
    test('should return category breakdown', async () => {
      const today = new Date().toISOString().split('T')[0];
      createTestExpense(user.id, category1.id, 100, 'Food 1', today);
      createTestExpense(user.id, category1.id, 50, 'Food 2', today);
      createTestExpense(user.id, category2.id, 75, 'Transport', today);

      const response = await request(app)
        .get('/api/analytics/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBe(2);

      const foodCategory = response.body.categories.find(
        (c: any) => c.category_id === category1.id
      );
      expect(foodCategory.total).toBe(150);
      expect(foodCategory.count).toBe(2);
      expect(foodCategory.percentage).toBeCloseTo(66.67, 1);
    });

    test('should filter category breakdown by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      createTestExpense(user.id, category1.id, 100, 'Today', today);
      createTestExpense(user.id, category1.id, 50, 'Yesterday', yesterday);

      const response = await request(app)
        .get('/api/analytics/categories')
        .query({ startDate: today, endDate: today })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const foodCategory = response.body.categories.find(
        (c: any) => c.category_id === category1.id
      );
      expect(foodCategory.total).toBe(100);
    });

    test('should return empty array when no expenses exist', async () => {
      const response = await request(app)
        .get('/api/analytics/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toHaveLength(0);
    });
  });
});
import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import categoryRoutes from '../../routes/categories.js';
import { auth } from '../../middleware/auth.js';
import {
  createTestUser,
  createTestCategory,
  generateTestToken,
} from '../helpers/testHelpers.js';

const app = express();
app.use(express.json());
app.use(auth);
app.use('/api/categories', categoryRoutes);

describe('Category Routes', () => {
  let user: any;
  let token: string;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user.id);
  });

  describe('GET /api/categories', () => {
    test('should return all categories for user', async () => {
      createTestCategory(user.id, 'Food', '#3b82f6');
      createTestCategory(user.id, 'Transport', '#ef4444');

      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(response.body.categories).toHaveLength(2);
    });

    test('should return empty array when no categories exist', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toHaveLength(0);
    });

    test('should not return categories from other users', async () => {
      const otherUser = await createTestUser('other@example.com');
      createTestCategory(otherUser.id, 'Other Category');
      createTestCategory(user.id, 'My Category');

      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toHaveLength(1);
      expect(response.body.categories[0].name).toBe('My Category');
    });
  });

  describe('POST /api/categories', () => {
    test('should create a new category', async () => {
      const categoryData = {
        name: 'Entertainment',
        color: '#8b5cf6',
        icon: '🎮',
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('category');
      expect(response.body.category.name).toBe('Entertainment');
      expect(response.body.category.color).toBe('#8b5cf6');
      expect(response.body.category.icon).toBe('🎮');
      expect(response.body.category.user_id).toBe(user.id);
    });

    test('should create category without icon', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Shopping',
          color: '#10b981',
        });

      expect(response.status).toBe(201);
      expect(response.body.category.icon).toBeNull();
    });

    test('should reject duplicate category name for same user', async () => {
      createTestCategory(user.id, 'Food');

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Food',
          color: '#3b82f6',
        });

      expect(response.status).toBe(400);
    });

    test('should allow same category name for different users', async () => {
      const otherUser = await createTestUser('other@example.com');
      createTestCategory(otherUser.id, 'Food');

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Food',
          color: '#3b82f6',
        });

      expect(response.status).toBe(201);
    });

    test('should reject category with missing name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          color: '#3b82f6',
        });

      expect(response.status).toBe(400);
    });

    test('should reject category with invalid color', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test',
          color: 'not-a-color',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/categories/:id', () => {
    test('should update category', async () => {
      const category = createTestCategory(user.id, 'Original Name');

      const response = await request(app)
        .put(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          color: '#ef4444',
        });

      expect(response.status).toBe(200);
      expect(response.body.category.name).toBe('Updated Name');
      expect(response.body.category.color).toBe('#ef4444');
    });

    test('should update only specified fields', async () => {
      const category = createTestCategory(user.id, 'Food', '#3b82f6');

      const response = await request(app)
        .put(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          color: '#ef4444',
        });

      expect(response.status).toBe(200);
      expect(response.body.category.name).toBe('Food');
      expect(response.body.category.color).toBe('#ef4444');
    });

    test('should not update category from different user', async () => {
      const otherUser = await createTestUser('other@example.com');
      const otherCategory = createTestCategory(otherUser.id, 'Other');

      const response = await request(app)
        .put(`/api/categories/${otherCategory.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hacked' });

      expect(response.status).toBe(404);
    });

    test('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .put('/api/categories/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    test('should delete category', async () => {
      const category = createTestCategory(user.id);

      const response = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('should not delete category from different user', async () => {
      const otherUser = await createTestUser('other@example.com');
      const otherCategory = createTestCategory(otherUser.id);

      const response = await request(app)
        .delete(`/api/categories/${otherCategory.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .delete('/api/categories/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
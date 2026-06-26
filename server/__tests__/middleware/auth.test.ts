import { describe, test, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { auth } from '../../middleware/auth.js';
import { createTestUser, generateTestToken } from '../helpers/testHelpers.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  test('should authenticate valid token', async () => {
    const user = await createTestUser();
    const token = generateTestToken(user.id);

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    await auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest).toHaveProperty('userId', user.id);
  });

  test('should reject request without authorization header', async () => {
    await auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should reject request with invalid token format', async () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat',
    };

    await auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should reject request with malformed token', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid.token.here',
    };

    await auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should reject expired token', async () => {
    const user = await createTestUser();
    const expiredToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '-1h' }
    );

    mockRequest.headers = {
      authorization: `Bearer ${expiredToken}`,
    };

    await auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should reject token with invalid signature', async () => {
    const user = await createTestUser();
    const tokenWithWrongSecret = jwt.sign(
      { userId: user.id },
      'wrong-secret',
      { expiresIn: '1h' }
    );

    mockRequest.headers = {
      authorization: `Bearer ${tokenWithWrongSecret}`,
    };

    await auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should handle token without userId', async () => {
    const tokenWithoutUserId = jwt.sign(
      { someOtherField: 'value' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );

    mockRequest.headers = {
      authorization: `Bearer ${tokenWithoutUserId}`,
    };

    await auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
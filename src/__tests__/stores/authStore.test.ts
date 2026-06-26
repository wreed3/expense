import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { useAuthStore } from '../../stores/authStore';
import { mockFetchResponse, mockFetchError } from '../helpers/testHelpers';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
    localStorage.clear();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('should login successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      const mockToken = 'mock-jwt-token';

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ user: mockUser, token: mockToken })
      );

      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.error).toBeNull();
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
    });

    test('should handle login error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ error: 'Invalid credentials' }, 401)
      );

      const { login } = useAuthStore.getState();
      await login('test@example.com', 'wrongpassword');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBe('Invalid credentials');
    });

    test('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error).toBeTruthy();
    });

    test('should set loading state during login', async () => {
      let loadingDuringFetch = false;

      (global.fetch as jest.Mock).mockImplementationOnce(() => {
        loadingDuringFetch = useAuthStore.getState().isLoading;
        return mockFetchResponse({ user: {}, token: 'token' });
      });

      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');

      expect(loadingDuringFetch).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('register', () => {
    test('should register successfully', async () => {
      const mockUser = { id: 1, email: 'new@example.com', name: 'New User' };
      const mockToken = 'mock-jwt-token';

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ user: mockUser, token: mockToken })
      );

      const { register } = useAuthStore.getState();
      await register('new@example.com', 'password123', 'New User');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
    });

    test('should handle registration error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ error: 'Email already exists' }, 400)
      );

      const { register } = useAuthStore.getState();
      await register('existing@example.com', 'password123', 'User');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    test('should logout and clear state', () => {
      // Set initial state
      useAuthStore.setState({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        token: 'token',
      });

      const { logout } = useAuthStore.getState();
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('fetchUser', () => {
    test('should fetch current user with token', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      localStorage.setItem('token', 'existing-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ user: mockUser })
      );

      const { fetchUser } = useAuthStore.getState();
      await fetchUser();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
    });

    test('should not fetch user without token', async () => {
      const { fetchUser } = useAuthStore.getState();
      await fetchUser();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle fetch user error', async () => {
      localStorage.setItem('token', 'invalid-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse({ error: 'Unauthorized' }, 401)
      );

      const { fetchUser } = useAuthStore.getState();
      await fetchUser();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });
});
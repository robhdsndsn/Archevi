import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './auth-store';

// Mock the windmill client
vi.mock('@/api/windmill', () => ({
  windmill: {
    login: vi.fn(),
    logout: vi.fn(),
    verifyToken: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

import { windmill } from '@/api/windmill';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin' as const,
  family_id: 'family-001',
};

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      vi.mocked(windmill.login).mockResolvedValueOnce({
        success: true,
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 900,
        user: mockUser,
      });

      const result = await useAuthStore.getState().login('test@example.com', 'password123');

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().accessToken).toBe('test-access-token');
      expect(useAuthStore.getState().refreshToken).toBe('test-refresh-token');
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should handle login failure', async () => {
      vi.mocked(windmill.login).mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials',
      });

      const result = await useAuthStore.getState().login('test@example.com', 'wrong');

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
    });

    it('should handle network errors during login', async () => {
      vi.mocked(windmill.login).mockRejectedValueOnce(new Error('Network error'));

      const result = await useAuthStore.getState().login('test@example.com', 'password');

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBe('Network error');
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: unknown) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      vi.mocked(windmill.login).mockReturnValueOnce(loginPromise as Promise<never>);

      // Start login
      const loginCall = useAuthStore.getState().login('test@example.com', 'password');

      // Check loading state
      expect(useAuthStore.getState().isLoading).toBe(true);

      // Resolve login
      resolveLogin!({
        success: true,
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 900,
        user: mockUser,
      });

      await loginCall;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should clear state on logout', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Date.now() + 900000,
        isAuthenticated: true,
      });

      vi.mocked(windmill.logout).mockResolvedValueOnce({ success: true });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().refreshToken).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should call server logout with refresh token', async () => {
      useAuthStore.setState({
        refreshToken: 'test-refresh-token',
        isAuthenticated: true,
      });

      vi.mocked(windmill.logout).mockResolvedValueOnce({ success: true });

      await useAuthStore.getState().logout();

      expect(windmill.logout).toHaveBeenCalledWith('test-refresh-token', false);
    });

    it('should clear state even if server logout fails', async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        isAuthenticated: true,
      });

      vi.mocked(windmill.logout).mockRejectedValueOnce(new Error('Server error'));

      await useAuthStore.getState().logout();

      // State should still be cleared
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('Check Auth', () => {
    it('should return false when no tokens exist', async () => {
      const result = await useAuthStore.getState().checkAuth();

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should verify valid token', async () => {
      useAuthStore.setState({
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 900000,
      });

      vi.mocked(windmill.verifyToken).mockResolvedValueOnce({
        valid: true,
        user: mockUser,
      });

      const result = await useAuthStore.getState().checkAuth();

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should refresh token when expired', async () => {
      useAuthStore.setState({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000, // Already expired
      });

      vi.mocked(windmill.refreshToken).mockResolvedValueOnce({
        success: true,
        access_token: 'new-token',
        expires_in: 900,
        user: mockUser,
      });

      const result = await useAuthStore.getState().checkAuth();

      expect(result).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('new-token');
    });
  });

  describe('Refresh Access Token', () => {
    it('should refresh token successfully', async () => {
      useAuthStore.setState({
        refreshToken: 'valid-refresh-token',
      });

      vi.mocked(windmill.refreshToken).mockResolvedValueOnce({
        success: true,
        access_token: 'new-access-token',
        expires_in: 900,
        user: mockUser,
      });

      const result = await useAuthStore.getState().refreshAccessToken();

      expect(result).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('new-access-token');
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should logout when refresh fails', async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'old-token',
        refreshToken: 'invalid-refresh-token',
        isAuthenticated: true,
      });

      vi.mocked(windmill.refreshToken).mockResolvedValueOnce({
        success: false,
        error: 'Refresh token expired',
      });

      const result = await useAuthStore.getState().refreshAccessToken();

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should return false when no refresh token exists', async () => {
      const result = await useAuthStore.getState().refreshAccessToken();

      expect(result).toBe(false);
      expect(windmill.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Clear Error', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});

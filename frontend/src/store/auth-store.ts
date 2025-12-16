import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { windmill, type AuthUser } from '@/api/windmill';

const TOKEN_REFRESH_THRESHOLD = 2 * 60 * 1000; // Refresh 2 minutes before expiry

// 2FA pending state
interface TwoFactorPendingState {
  sessionToken: string;
  email: string;
  name: string;
  expiresAt: number;
}

interface AuthState {
  // State
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // 2FA state
  twoFactorPending: TwoFactorPendingState | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean | 'requires_2fa'>;
  verify2FA: (code: string) => Promise<boolean>;
  verifyBackupCode: (code: string) => Promise<boolean>;
  cancel2FA: () => void;
  logout: (revokeAll?: boolean) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshAccessToken: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: true, // Start loading to check auth on app load
      error: null,
      twoFactorPending: null,

      // Login with email and password
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null, twoFactorPending: null });

        try {
          const result = await windmill.login(email, password);

          // Check if 2FA is required
          if (result.success && (result as any).requires_2fa && (result as any).session_token) {
            const twoFAResult = result as any;
            set({
              twoFactorPending: {
                sessionToken: twoFAResult.session_token,
                email: twoFAResult.user?.email || email,
                name: twoFAResult.user?.name || '',
                expiresAt: Date.now() + (twoFAResult.expires_in || 300) * 1000,
              },
              isLoading: false,
              error: null,
            });
            return 'requires_2fa';
          }

          if (result.success && result.access_token && result.refresh_token && result.user) {
            const expiresAt = Date.now() + (result.expires_in || 900) * 1000;

            set({
              user: result.user,
              accessToken: result.access_token,
              refreshToken: result.refresh_token,
              expiresAt,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              twoFactorPending: null,
            });

            // Set up auto-refresh
            scheduleTokenRefresh(get, expiresAt);

            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Login failed',
            });
            return false;
          }
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Login failed',
          });
          return false;
        }
      },

      // Verify 2FA code
      verify2FA: async (code: string) => {
        const { twoFactorPending } = get();

        if (!twoFactorPending) {
          set({ error: 'No 2FA session pending' });
          return false;
        }

        // Check if session expired
        if (Date.now() > twoFactorPending.expiresAt) {
          set({
            error: 'Session expired. Please login again.',
            twoFactorPending: null,
          });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const result = await windmill.verify2FA(code, {
            sessionToken: twoFactorPending.sessionToken,
          });

          if (result.success && result.access_token && result.refresh_token && result.user) {
            const expiresAt = Date.now() + (result.expires_in || 900) * 1000;

            set({
              user: result.user,
              accessToken: result.access_token,
              refreshToken: result.refresh_token,
              expiresAt,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              twoFactorPending: null,
            });

            // Set up auto-refresh
            scheduleTokenRefresh(get, expiresAt);

            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Invalid verification code',
            });
            return false;
          }
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Verification failed',
          });
          return false;
        }
      },

      // Verify backup code
      verifyBackupCode: async (code: string) => {
        const { twoFactorPending } = get();

        if (!twoFactorPending) {
          set({ error: 'No 2FA session pending' });
          return false;
        }

        // Check if session expired
        if (Date.now() > twoFactorPending.expiresAt) {
          set({
            error: 'Session expired. Please login again.',
            twoFactorPending: null,
          });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const result = await windmill.verifyBackupCode(
            twoFactorPending.sessionToken,
            code
          );

          if (result.success && result.access_token && result.refresh_token && result.user) {
            const expiresAt = Date.now() + (result.expires_in || 900) * 1000;

            set({
              user: result.user,
              accessToken: result.access_token,
              refreshToken: result.refresh_token,
              expiresAt,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              twoFactorPending: null,
            });

            // Set up auto-refresh
            scheduleTokenRefresh(get, expiresAt);

            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Invalid backup code',
            });
            return false;
          }
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Verification failed',
          });
          return false;
        }
      },

      // Cancel 2FA verification
      cancel2FA: () => {
        set({
          twoFactorPending: null,
          error: null,
        });
      },

      // Logout
      logout: async (revokeAll = false) => {
        const { refreshToken } = get();

        // Clear state immediately for better UX
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });

        // Revoke token on server (fire and forget)
        if (refreshToken) {
          try {
            await windmill.logout(refreshToken, revokeAll);
          } catch {
            // Ignore errors - user is logged out locally anyway
          }
        }
      },

      // Check if current auth is valid
      checkAuth: async () => {
        const { accessToken, refreshToken, expiresAt } = get();

        // No tokens - not authenticated
        if (!accessToken || !refreshToken) {
          set({ isLoading: false, isAuthenticated: false });
          return false;
        }

        // Check if token is expired or about to expire
        if (expiresAt && Date.now() > expiresAt - TOKEN_REFRESH_THRESHOLD) {
          // Try to refresh
          return get().refreshAccessToken();
        }

        // Verify token is still valid
        try {
          const result = await windmill.verifyToken(accessToken);

          if (result.valid && result.user) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
            });

            // Set up auto-refresh
            if (expiresAt) {
              scheduleTokenRefresh(get, expiresAt);
            }

            return true;
          } else {
            // Token invalid - try refresh
            return get().refreshAccessToken();
          }
        } catch {
          // Verification failed - try refresh
          return get().refreshAccessToken();
        }
      },

      // Refresh access token
      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          set({ isLoading: false, isAuthenticated: false });
          return false;
        }

        try {
          const result = await windmill.refreshToken(refreshToken);

          if (result.success && result.access_token && result.user) {
            const expiresAt = Date.now() + (result.expires_in || 900) * 1000;

            set({
              user: result.user,
              accessToken: result.access_token,
              expiresAt,
              isAuthenticated: true,
              isLoading: false,
            });

            // Set up next auto-refresh
            scheduleTokenRefresh(get, expiresAt);

            return true;
          } else {
            // Refresh failed - logout
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              expiresAt: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return false;
          }
        } catch {
          // Refresh failed - logout
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return false;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'archevi-auth',
      // Only persist these fields
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user: state.user,
      }),
    }
  )
);

// Token refresh scheduler
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleTokenRefresh(get: () => AuthState, expiresAt: number) {
  // Clear existing timeout
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }

  // Calculate when to refresh (2 minutes before expiry)
  const refreshIn = expiresAt - Date.now() - TOKEN_REFRESH_THRESHOLD;

  if (refreshIn > 0) {
    refreshTimeout = setTimeout(() => {
      get().refreshAccessToken();
    }, refreshIn);
  }
}

// Initialize auth check on module load
if (typeof window !== 'undefined') {
  // Small delay to ensure store is hydrated from localStorage
  setTimeout(() => {
    useAuthStore.getState().checkAuth();
  }, 100);
}

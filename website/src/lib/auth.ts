/**
 * Auth utilities for marketing site
 * Handles signup and redirects to dashboard app
 */

// Windmill API configuration
const WINDMILL_URL = process.env.NEXT_PUBLIC_WINDMILL_URL || 'http://localhost';
const WINDMILL_TOKEN = process.env.NEXT_PUBLIC_WINDMILL_TOKEN || '';
const WORKSPACE = process.env.NEXT_PUBLIC_WINDMILL_WORKSPACE || 'archevi';

// Dashboard app URL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';

export interface SignupData {
  email: string;
  password: string;
  familyName: string;
  ownerName?: string;
  plan?: string;
}

export interface SignupResult {
  success: boolean;
  user_id?: string;
  tenant_id?: string;
  email?: string;
  name?: string;
  family_name?: string;
  slug?: string;
  plan?: string;
  trial_days?: number;
  message?: string;
  error?: string;
}

export interface LoginResult {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id: string;
    email: string;
    name: string;
    default_tenant_id?: string;
  };
  error?: string;
  requires_2fa?: boolean;
  session_token?: string;
}

/**
 * Call Windmill API endpoint
 */
async function windmillRequest<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
  const url = `${WINDMILL_URL}/api/w/${WORKSPACE}/jobs/run_wait_result/p/${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WINDMILL_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Sign up a new user and create their tenant
 */
export async function signup(data: SignupData): Promise<SignupResult> {
  return windmillRequest<SignupResult>('f/chatbot/auth_signup', {
    email: data.email,
    password: data.password,
    family_name: data.familyName,
    owner_name: data.ownerName,
    plan: data.plan || 'trial',
  });
}

/**
 * Log in an existing user
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  return windmillRequest<LoginResult>('f/chatbot/auth_login', {
    email,
    password,
  });
}

/**
 * Build redirect URL to dashboard app with auth token
 * Uses URL fragment (#) to pass token securely (not logged by servers)
 */
export function buildAppRedirectUrl(accessToken: string, refreshToken: string): string {
  const params = new URLSearchParams({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Use fragment (#) instead of query string for security
  // Fragments are not sent to server in HTTP requests
  return `${APP_URL}/auth/callback#${params.toString()}`;
}

/**
 * Get the dashboard app URL
 */
export function getAppUrl(): string {
  return APP_URL;
}

/**
 * Get the sign-in URL (dashboard app login page)
 */
export function getSignInUrl(): string {
  return `${APP_URL}/login`;
}

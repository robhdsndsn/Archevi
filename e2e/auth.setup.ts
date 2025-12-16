import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Authentication setup - runs before other tests
 * Logs in and saves authentication state for reuse
 */
setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // For development/testing, we'll use test credentials
  // In CI, these would come from environment variables
  const testEmail = process.env.TEST_USER_EMAIL || 'test@archevi.local';
  const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

  // Fill in login form
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/password/i).fill(testPassword);

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for successful login - should redirect to dashboard or main app
  await expect(page).toHaveURL(/\/(dashboard|app|chat)?$/);

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

/**
 * Admin authentication setup
 */
setup('authenticate admin', async ({ page }) => {
  const adminAuthFile = path.join(__dirname, '../playwright/.auth/admin.json');

  await page.goto('http://localhost:5174');

  // Admin login flow
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@archevi.local';
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'adminpassword123';

  // Fill admin login (adjust selectors based on actual admin UI)
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole('button', { name: /sign in|login/i }).click();

  // Wait for admin dashboard
  await expect(page).toHaveURL(/localhost:5174/);

  await page.context().storageState({ path: adminAuthFile });
});

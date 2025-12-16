import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title and key elements
    await expect(page.getByText('Archevi')).toBeVisible();
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign in/i });

    // Button should be disabled when fields are empty
    await expect(submitButton).toBeDisabled();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Submit
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 10000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);

    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button (usually an eye icon)
    await page.getByRole('button', { name: '' }).first().click();

    // Should now be text type
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should have link to forgot password', async ({ page }) => {
    await expect(page.getByText(/forgot.*password/i)).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Use test credentials
    const testEmail = process.env.TEST_USER_EMAIL || 'test@archevi.local';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to main app/dashboard
    await expect(page).toHaveURL(/\/(dashboard|app|chat)?$/, { timeout: 15000 });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/chat');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

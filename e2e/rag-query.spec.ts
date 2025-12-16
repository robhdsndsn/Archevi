import { test, expect } from '@playwright/test';

test.describe('RAG Query Flow', () => {
  // Use authenticated state
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display chat interface', async ({ page }) => {
    // Check for chat input
    await expect(page.getByPlaceholder(/ask|search|question/i)).toBeVisible();
  });

  test('should submit a query and receive response', async ({ page }) => {
    // Find and use the chat input
    const chatInput = page.getByPlaceholder(/ask|search|question/i);
    await chatInput.fill('What documents do I have about insurance?');

    // Submit the query
    await chatInput.press('Enter');

    // Wait for response (with loading indicator first)
    await expect(page.getByText(/searching|thinking|loading/i)).toBeVisible({ timeout: 5000 });

    // Wait for actual response
    await expect(page.locator('[data-testid="chat-message"]').last()).toBeVisible({ timeout: 30000 });
  });

  test('should display sources with responses', async ({ page }) => {
    const chatInput = page.getByPlaceholder(/ask|search|question/i);
    await chatInput.fill('Show me my recent documents');
    await chatInput.press('Enter');

    // Wait for response with sources
    await page.waitForSelector('[data-testid="sources-list"], [data-testid="source-citation"]', {
      timeout: 30000,
    });

    // Sources should be visible
    await expect(page.getByText(/source/i)).toBeVisible();
  });

  test('should handle follow-up questions', async ({ page }) => {
    // First question
    const chatInput = page.getByPlaceholder(/ask|search|question/i);
    await chatInput.fill('What is in my documents?');
    await chatInput.press('Enter');

    // Wait for first response
    await page.waitForSelector('[data-testid="chat-message"]', { timeout: 30000 });

    // Follow-up question
    await chatInput.fill('Tell me more about that');
    await chatInput.press('Enter');

    // Should have multiple messages
    await expect(page.locator('[data-testid="chat-message"]')).toHaveCount(4, { timeout: 30000 });
  });

  test('should show model selector', async ({ page }) => {
    // Check for model selector if available
    const modelSelector = page.getByText(/model|llm/i);
    if (await modelSelector.isVisible()) {
      await expect(modelSelector).toBeVisible();
    }
  });
});

test.describe('Search Functionality', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should perform semantic document search', async ({ page }) => {
    await page.goto('/documents');

    // Find search input
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('passport');
    await searchInput.press('Enter');

    // Results should appear
    await expect(page.getByText(/result|found|document/i)).toBeVisible({ timeout: 10000 });
  });

  test('should filter documents by category', async ({ page }) => {
    await page.goto('/documents');

    // Find category filter
    const categoryFilter = page.getByRole('combobox', { name: /category/i });
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.getByRole('option', { name: /legal|personal|financial/i }).first().click();

      // Results should update
      await expect(page.locator('[data-testid="document-card"]')).toBeVisible();
    }
  });
});

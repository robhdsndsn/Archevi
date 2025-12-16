import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.describe('Login Page', () => {
    test('should have no accessibility violations', async ({ page }) => {
      await page.goto('/login');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/login');

      // Check email input has label
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();

      // Check password input has label
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toBeVisible();
    });

    test('should be navigable by keyboard', async ({ page }) => {
      await page.goto('/login');

      // Tab through the form
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to reach the submit button
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Main Application', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('dashboard should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('[role="status"]') // Exclude toast notifications
        .analyze();

      // Filter out minor violations, focus on critical ones
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('sidebar navigation should be accessible', async ({ page }) => {
      await page.goto('/');

      // Sidebar should be navigable
      const sidebar = page.locator('[data-testid="sidebar"], nav, aside').first();
      await expect(sidebar).toBeVisible();

      // Navigation links should have proper roles
      const navLinks = sidebar.getByRole('link');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    });

    test('chat interface should be accessible', async ({ page }) => {
      await page.goto('/');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="chat-container"], main')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Documents Page', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('documents page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/documents');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('upload form should be accessible', async ({ page }) => {
      await page.goto('/documents');

      // Look for upload button/area
      const uploadTrigger = page.getByText(/upload|add document/i).first();
      if (await uploadTrigger.isVisible()) {
        await uploadTrigger.click();

        // Check upload form accessibility
        const accessibilityScanResults = await new AxeBuilder({ page })
          .include('[data-testid="upload-form"], form, dialog')
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        const criticalViolations = accessibilityScanResults.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalViolations).toEqual([]);
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('login page should have sufficient color contrast', async ({ page }) => {
      await page.goto('/login');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({ rules: { 'color-contrast': { enabled: true } } })
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === 'color-contrast'
      );

      expect(contrastViolations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support Escape key to close modals', async ({ page }) => {
      await page.goto('/');

      // Try to open command palette (Cmd/Ctrl + K)
      await page.keyboard.press('Control+k');

      // If modal opens, Escape should close it
      const modal = page.locator('[role="dialog"], [data-testid="command-palette"]');
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    });

    test('focus should be visible on interactive elements', async ({ page }) => {
      await page.goto('/login');

      // Tab to first interactive element
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Element should have visible focus indicator (outline or similar)
      const outlineStyle = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline || styles.boxShadow;
      });

      expect(outlineStyle).toBeTruthy();
    });
  });
});

test.describe('Admin Dashboard Accessibility', () => {
  test('admin dashboard should have no critical violations', async ({ page }) => {
    await page.goto('http://localhost:5174');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    // Log violations for debugging
    if (criticalViolations.length > 0) {
      console.log('Accessibility violations:', JSON.stringify(criticalViolations, null, 2));
    }

    expect(criticalViolations).toEqual([]);
  });
});

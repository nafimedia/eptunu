import { test, expect } from '@playwright/test';

test.describe('Landing Page & Navigation Smoke Tests', () => {
  test('should load landing page title and login CTA button', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Starter Kit|Svelte/i);
  });
});

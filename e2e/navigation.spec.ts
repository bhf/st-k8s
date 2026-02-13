import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/K8s/i); // Adjust based on actual title if known, or inspect <title>
    // Assuming the home page has some introductory text or links
    await expect(page.locator('h1')).toBeVisible(); 
  });

  test('should load the dashboard page with sidebar', async ({ page }) => {
    await page.goto('/k8s-dashboard');
    // Check for sidebar elements
    await expect(page.getByRole('button', { name: 'Pod Resources' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deployments' })).toBeVisible();
  });
});

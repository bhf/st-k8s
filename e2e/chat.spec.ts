import { test, expect } from '@playwright/test';

test.describe('Chat Component', () => {
  test.beforeEach(async ({ page }) => {
    // Mock general K8s metadata needed for dashboard/chat components to initialize
    await page.route('*/**/api/tools/k8s-contexts*', async route => {
      await route.fulfill({ json: { data: [{ name: 'default', isCurrent: true }] } });
    });

    await page.route('*/**/api/tools/k8s-namespaces*', async route => {
      await route.fulfill({ json: { namespaces: ['default'] } });
    });
  });

  test('should open and close the chat window', async ({ page }) => {
    await page.goto('/k8s-dashboard');

    // Chat should start closed, showing the open button
    const openButton = page.getByLabel('Open chat');
    await expect(openButton).toBeVisible();

    // Open chat
    await openButton.click();

    // Check for chat header
    await expect(page.getByText('ST-K8s Chat')).toBeVisible();

    // Check for input field
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible();

    // Close chat
    // Note: The close button is inside the header
    const closeButton = page.getByLabel('Close chat');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Should be back to open button
    await expect(openButton).toBeVisible();
  });
});

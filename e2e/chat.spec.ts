import { test, expect } from '@playwright/test';

test.describe('Chat Component', () => {
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

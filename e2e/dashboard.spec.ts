import { test, expect } from '@playwright/test';

test.describe('K8s Dashboard Functionality', () => { 
  test.beforeEach(async ({ page }) => {
    // Mock general K8s metadata needed for the dashboard to initialize
    await page.route('*/**/api/tools/k8s-contexts*', async route => {
      await route.fulfill({ json: { data: [{ name: 'default', isCurrent: true }] } });
    });
    
    await page.route('*/**/api/tools/k8s-namespaces*', async route => {
      await route.fulfill({ json: { namespaces: ['default'] } });
    });
  });

  test('should fetch and display pod resources', async ({ page }) => {
    // Mock the API response for pod resources
    await page.route('*/**/api/tools/k8s-pod-resources*', async route => {
      const json = {
        data: [
          {
            name: 'test-pod-1',
            namespace: 'default',
            status: 'Running',
            node: 'node-1'
          },
          {
            name: 'test-pod-2',
            namespace: 'default', 
            status: 'Pending',
            node: 'node-2'
          }
        ]
      };
      await route.fulfill({ json });
    });

    await page.goto('/k8s-dashboard');

    // Verify loading state is gone and table is present
    // Note: Depends on actual loading implementation, assuming it eventually shows data
    
    // Check if the table headers are visible
    // Based on DashboardContent.tsx analysis, it likely dynamically generates headers from data keys
    // "name", "namespace", "status", "node" should be headers.
    
    // Wait for the data to be potentially rendered
    await expect(page.getByRole('cell', { name: 'test-pod-1' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Running' })).toBeVisible();
  });
});

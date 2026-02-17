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

    // Wait for the data to be rendered
    // Use a longer timeout or wait for the cell specifically
    const podCell = page.getByRole('cell', { name: 'test-pod-1' });
    await expect(podCell).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: 'Running' })).toBeVisible();
  });

  test('should allow switching between contexts', async ({ page }) => {
    // Additional mock for a different context
    await page.route('*/**/api/tools/k8s-contexts*', async route => {
      await route.fulfill({ 
        json: { 
          data: [
            { name: 'default', isCurrent: true },
            { name: 'prod-cluster', isCurrent: false }
          ] 
        } 
      });
    });

    await page.route('*/**/api/tools/k8s-namespaces?context=prod-cluster*', async route => {
      await route.fulfill({ json: { namespaces: ['prod-ns'] } });
    });

    await page.route('*/**/api/tools/k8s-pod-resources?namespace=prod-ns&context=prod-cluster*', async route => {
      await route.fulfill({ 
        json: { 
          data: [{ name: 'prod-pod', namespace: 'prod-ns', status: 'Running', node: 'prod-node' }] 
        } 
      });
    });

    await page.goto('/k8s-dashboard');

    // Select the other context
    const contextSelect = page.getByLabel('Context');
    await contextSelect.selectOption('prod-cluster');

    // Wait for namespaces for the new context
    const namespaceSelect = page.getByLabel('Namespace');
    await expect(namespaceSelect).toContainText('prod-ns');
    
    // Check if the data from the new context is displayed
    await expect(page.getByRole('cell', { name: 'prod-pod' })).toBeVisible({ timeout: 10000 });
  });
});

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
    const sidebarItems = [
      'Pod Resources',
      'Deployments',
      'ReplicaSets',
      'StatefulSets',
      'DaemonSets',
      'Services',
      'Ingresses',
      'Endpoints',
      'ConfigMaps',
      'Jobs',
      'CronJobs',
      'Volumes (PVCs)',
      'Nodes',
      'Events',
      'ServiceAccounts',
      'Roles',
      'RoleBindings'
    ];

    for (const item of sidebarItems) {
      await expect(page.getByRole('button', { name: item, exact: true })).toBeVisible();
    }
  });
});

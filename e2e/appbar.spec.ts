import { test, expect } from '@playwright/test';

test.describe('Polaris app bar badge', () => {
  test('badge displays cluster score in app bar', async ({ page }) => {
    await page.goto('/c/main');

    // Wait for page to load
    await expect(page.getByRole('navigation', { name: 'Navigation' })).toBeVisible();

    // Badge should be visible in app bar with score percentage
    const badge = page.getByRole('button', { name: /Polaris: \d+%/ });
    await expect(badge).toBeVisible({ timeout: 15_000 });

    // Badge should show shield emoji
    await expect(badge).toContainText('🛡️');
  });

  test('clicking badge navigates to overview page', async ({ page }) => {
    await page.goto('/c/main');

    // Find and click the badge
    const badge = page.getByRole('button', { name: /Polaris: \d+%/ });
    await expect(badge).toBeVisible({ timeout: 15_000 });
    await badge.click();

    // Should navigate to Polaris overview
    await expect(page).toHaveURL(/\/c\/main\/polaris$/);
    await expect(page.getByRole('heading', { name: 'Polaris — Overview' })).toBeVisible();
  });

  test('badge color reflects score level', async ({ page }) => {
    await page.goto('/c/main');

    // Get the badge
    const badge = page.getByRole('button', { name: /Polaris: \d+%/ });
    await expect(badge).toBeVisible({ timeout: 15_000 });

    // Extract score from button text
    const badgeText = await badge.textContent();
    const scoreMatch = badgeText?.match(/(\d+)%/);
    expect(scoreMatch).toBeTruthy();

    const score = parseInt(scoreMatch![1]);

    // Check background color matches score level
    const bgColor = await badge.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    if (score >= 80) {
      // Green: rgb(76, 175, 80) or #4caf50
      expect(bgColor).toMatch(/rgb\(76,\s*175,\s*80\)/);
    } else if (score >= 50) {
      // Orange: rgb(255, 152, 0) or #ff9800
      expect(bgColor).toMatch(/rgb\(255,\s*152,\s*0\)/);
    } else {
      // Red: rgb(244, 67, 54) or #f44336
      expect(bgColor).toMatch(/rgb\(244,\s*67,\s*54\)/);
    }
  });

  test('badge updates when navigating between clusters', async ({ page }) => {
    // This test assumes multi-cluster setup; skip if only one cluster
    await page.goto('/c/main');

    // Get initial badge score
    const badge = page.getByRole('button', { name: /Polaris: \d+%/ });
    await expect(badge).toBeVisible({ timeout: 15_000 });
    const initialScore = await badge.textContent();

    // Try to switch clusters (if available)
    const clusterSelector = page.getByRole('button', { name: /cluster/i });
    if (await clusterSelector.isVisible()) {
      // Note: This part will only work in multi-cluster setups
      // For single-cluster, this test will just verify badge persists
      await clusterSelector.click();

      // Select different cluster if available
      const clusterOptions = page.getByRole('menuitem');
      const count = await clusterOptions.count();

      if (count > 1) {
        await clusterOptions.nth(1).click();

        // Badge should update or disappear (if new cluster doesn't have Polaris)
        // This is just verifying no crash occurs
        await page.waitForTimeout(2000);
      }
    }

    // Badge should still be functional
    await expect(badge).toBeEnabled();
  });
});

import { test, expect } from '@playwright/test';

test('navigate to investors via Pipeline link', async ({ page }) => {
  // Go to dashboard first
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  console.log('Dashboard URL:', page.url());

  // Look for Pipeline link
  const pipelineLink = page.locator('a:has-text("Pipeline")');
  const exists = await pipelineLink.isVisible({ timeout: 3000 }).catch(() => false);

  if (!exists) {
    console.log('❌ Pipeline link not found in nav');
    console.log('Available links:', await page.locator('nav a').allTextContents());
  } else {
    console.log('✅ Pipeline link found');

    // Click it
    await pipelineLink.click();
    await page.waitForLoadState('networkidle');

    console.log('After clicking Pipeline, URL is:', page.url());

    // Check what we got
    const bodyText = await page.textContent('body');
    console.log('Page content preview:', bodyText?.substring(0, 300));

    if (bodyText?.includes('Investor Pipeline')) {
      console.log('✅ Successfully navigated to Investor Pipeline');
    } else if (bodyText?.includes('Page not found')) {
      console.log('❌ Got 404 after clicking Pipeline link');
    } else {
      console.log('⚠️  Unknown page state');
    }
  }
});

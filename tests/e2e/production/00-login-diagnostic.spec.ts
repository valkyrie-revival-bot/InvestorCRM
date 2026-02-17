import { test, expect } from '@playwright/test';

test('diagnostic: login page accessibility', async ({ page }) => {
  console.log('=== Login Page Diagnostic ===');

  // Test 1: Direct navigation to /login
  console.log('\n1. Attempting direct navigation to /login...');
  await page.goto('https://valhros.com/login');
  await page.waitForLoadState('networkidle');

  const url1 = page.url();
  console.log('   Current URL:', url1);
  console.log('   Title:', await page.title());

  // Check if redirected
  if (url1 !== 'https://valhros.com/login' && url1 !== 'https://www.valhros.com/login') {
    console.log('   ⚠️  REDIRECTED! Expected /login but got:', url1);
  }

  // Test 2: Check page content
  console.log('\n2. Checking page content...');
  const hasGoogleButton = await page.locator('button:has-text("Sign in with Google")').isVisible().catch(() => false);
  const hasLoginCard = await page.locator('text=M&A Intelligence System').isVisible().catch(() => false);
  const hasCRMCard = await page.locator('text=Investor CRM').isVisible().catch(() => false);

  console.log('   Has "Sign in with Google" button:', hasGoogleButton);
  console.log('   Has login card content:', hasLoginCard);
  console.log('   Has CRM card (landing page):', hasCRMCard);

  // Test 3: Check for authentication state
  console.log('\n3. Checking authentication state...');
  const hasNav = await page.locator('nav').isVisible().catch(() => false);
  const cookies = await page.context().cookies();
  const supabaseCookies = cookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));

  console.log('   Has navigation (authenticated):', hasNav);
  console.log('   Supabase cookies found:', supabaseCookies.length);
  if (supabaseCookies.length > 0) {
    console.log('   Cookie names:', supabaseCookies.map(c => c.name).join(', '));
  }

  // Test 4: Try from landing page
  console.log('\n4. Attempting navigation from landing page...');
  await page.goto('https://valhros.com');
  await page.waitForLoadState('networkidle');

  const crmCard = page.locator('a[href="/login"]');
  const cardVisible = await crmCard.isVisible({ timeout: 3000 }).catch(() => false);
  console.log('   CRM card visible on landing:', cardVisible);

  if (cardVisible) {
    console.log('   Clicking CRM card...');
    await crmCard.click();
    await page.waitForLoadState('networkidle');

    const url2 = page.url();
    console.log('   URL after click:', url2);

    const hasButton = await page.locator('button:has-text("Sign in with Google")').isVisible({ timeout: 3000 }).catch(() => false);
    console.log('   Has login button:', hasButton);

    if (!hasButton && (url2 === 'https://valhros.com/' || url2 === 'https://www.valhros.com/')) {
      console.log('   ❌ ISSUE CONFIRMED: Clicked /login link but stayed on landing page');

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/login-diagnostic-issue.png', fullPage: true });
      console.log('   Screenshot saved to: test-results/login-diagnostic-issue.png');
    }
  }

  console.log('\n=== Diagnostic Complete ===\n');
});

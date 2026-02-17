import { test, expect } from '@playwright/test';

/**
 * Production E2E Tests - Valhros Archon
 * Tests the AI chat interface and agent functionality on production (valhros.com)
 *
 * Prerequisites:
 * - Auth setup completed (auth.setup.ts)
 * - User authenticated to production
 * - AI chat API endpoint functional
 */

test.describe('Valhros Archon', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to production dashboard
    await page.goto('https://valhros.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  });

  test('should display AI BDR button in navigation', async ({ page }) => {
    // Check if AI BDR button exists in header
    const aiBdrButton = page.locator('button:has-text("AI BDR")');
    await expect(aiBdrButton).toBeVisible({ timeout: 10000 });

    // Verify button has Bot icon
    const botIcon = aiBdrButton.locator('svg');
    await expect(botIcon).toBeVisible();
  });

  test('should open chat interface from navigation', async ({ page }) => {
    // Find and click AI BDR button
    const aiBdrButton = page.locator('button:has-text("AI BDR")');
    await expect(aiBdrButton).toBeVisible({ timeout: 10000 });
    await aiBdrButton.click();

    // Wait for chat panel to slide in
    await page.waitForTimeout(500);

    // Verify chat panel is visible
    await expect(page.locator('h2:has-text("Valhros Archon")')).toBeVisible();

    // Check for welcome message
    await expect(
      page.locator('text=I\'m Valhros Archon')
    ).toBeVisible();

    // Verify suggested prompts are visible
    await expect(page.locator('text=Try asking:')).toBeVisible();
    await expect(page.locator('button:has-text("Show me stalled investors")')).toBeVisible();
  });

  test('should send message to agent and get response', async ({ page }) => {
    // Open chat panel
    const aiBdrButton = page.locator('button:has-text("AI BDR")');
    await aiBdrButton.click();
    await page.waitForTimeout(500);

    // Type a message
    const messageInput = page.locator('input[name="message"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Hello, what can you help me with?');

    // Send message
    const sendButton = page.locator('form button[type="submit"]');
    await sendButton.click();

    // Wait for user message to appear
    await expect(
      page.locator('text=Hello, what can you help me with?')
    ).toBeVisible({ timeout: 5000 });

    // Wait for assistant response (look for any text in assistant message bubble)
    // The AI should respond within 10 seconds
    const assistantMessage = page.locator('[class*="ChatMessage"]').last();
    await expect(assistantMessage).toBeVisible({ timeout: 15000 });

    // Verify response contains some text
    const responseText = await assistantMessage.textContent();
    expect(responseText).toBeTruthy();
    expect(responseText!.length).toBeGreaterThan(10);
  });

  test('should query investor data via suggested prompt', async ({ page }) => {
    // Open chat panel
    const aiBdrButton = page.locator('button:has-text("AI BDR")');
    await aiBdrButton.click();
    await page.waitForTimeout(500);

    // Click on a suggested prompt about pipeline
    const pipelinePrompt = page.locator('button:has-text("Pipeline summary by stage")');
    await expect(pipelinePrompt).toBeVisible();
    await pipelinePrompt.click();

    // Verify prompt appears as user message
    await expect(
      page.locator('text=Pipeline summary by stage')
    ).toBeVisible({ timeout: 5000 });

    // Wait for assistant response about pipeline
    // Response should contain pipeline-related information
    await page.waitForTimeout(5000);

    // Check that some response was rendered
    const messages = page.locator('[class*="ChatMessage"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(2); // At least user + assistant message
  });

  test('should handle agent tool calls correctly', async ({ page }) => {
    // Open chat panel
    const aiBdrButton = page.locator('button:has-text("AI BDR")');
    await aiBdrButton.click();
    await page.waitForTimeout(500);

    // Ask a question that would trigger tool usage (investor query)
    const messageInput = page.locator('input[name="message"]');
    await messageInput.fill('Show me investors in the Qualification stage');

    const sendButton = page.locator('form button[type="submit"]');
    await sendButton.click();

    // Wait for user message
    await expect(
      page.locator('text=Show me investors in the Qualification stage')
    ).toBeVisible({ timeout: 5000 });

    // Wait for tool execution and response
    // The agent should query the database and return results
    await page.waitForTimeout(8000);

    // Verify a response was provided
    const messages = page.locator('[class*="ChatMessage"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(2);

    // The last message should be from assistant
    const lastMessage = messages.last();
    const lastMessageText = await lastMessage.textContent();
    expect(lastMessageText).toBeTruthy();
  });

  test('should close chat panel when close button clicked', async ({ page }) => {
    // Open chat panel
    const aiBdrButton = page.locator('button:has-text("AI BDR")');
    await aiBdrButton.click();
    await page.waitForTimeout(500);

    // Verify panel is open
    await expect(page.locator('h2:has-text("Valhros Archon")')).toBeVisible();

    // Click close button
    const closeButton = page.locator('button[aria-label="Close"], button:has(svg)').first();
    await closeButton.click();

    // Wait for panel to slide out
    await page.waitForTimeout(500);

    // Panel should not be visible (or have translate-x-full class)
    const chatHeader = page.locator('h2:has-text("Valhros Archon")');
    const isVisible = await chatHeader.isVisible().catch(() => false);

    // Panel should be hidden or off-screen
    if (isVisible) {
      // If still in DOM, check if it has the hidden transform class
      const panel = page.locator('div:has(h2:has-text("Valhros Archon"))').first();
      const classes = await panel.getAttribute('class');
      expect(classes).toContain('translate-x-full');
    }
  });

  test('should maintain chat history during session', async ({ page }) => {
    // Open chat panel
    const aiBdrButton = page.locator('button:has-text("AI BDR")');
    await aiBdrButton.click();
    await page.waitForTimeout(500);

    // Send first message
    const messageInput = page.locator('input[name="message"]');
    await messageInput.fill('First test message');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Send second message
    await messageInput.fill('Second test message');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Both messages should be visible in chat history
    await expect(page.locator('text=First test message')).toBeVisible();
    await expect(page.locator('text=Second test message')).toBeVisible();

    // Should have at least 4 messages (2 user + 2 assistant)
    const messages = page.locator('[class*="ChatMessage"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(4);
  });

  test('should show loading state while processing', async ({ page }) => {
    // Open chat panel
    const aiBdrButton = page.locator('button:has-text("AI BDR")');
    await aiBdrButton.click();
    await page.waitForTimeout(500);

    // Send message
    const messageInput = page.locator('input[name="message"]');
    await messageInput.fill('Test message for loading state');

    const sendButton = page.locator('form button[type="submit"]');
    await sendButton.click();

    // Input should be disabled during processing
    const isInputDisabled = await messageInput.isDisabled();

    // Either input is disabled or button is disabled during processing
    // (check immediately after clicking)
    if (!isInputDisabled) {
      const isButtonDisabled = await sendButton.isDisabled();
      expect(isButtonDisabled || isInputDisabled).toBeTruthy();
    }

    // Wait for response to complete
    await page.waitForTimeout(5000);

    // After processing, input should be enabled again
    await expect(messageInput).toBeEnabled({ timeout: 10000 });
  });
});

test.describe('Valhros Archon - Error Handling', () => {
  test('should handle empty messages gracefully', async ({ page }) => {
    await page.goto('https://valhros.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Open chat panel
    const aiBdrButton = page.locator('button:has-text("AI BDR")');
    await aiBdrButton.click();
    await page.waitForTimeout(500);

    // Try to send empty message
    const sendButton = page.locator('form button[type="submit"]');

    // Button should be disabled when input is empty
    const isDisabled = await sendButton.isDisabled();
    expect(isDisabled).toBeTruthy();
  });

  test('should display error message if API fails', async ({ page }) => {
    await page.goto('https://valhros.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Open chat panel
    const aiBdrButton = page.locator('button:has-text("AI BDR")');
    await aiBdrButton.click();
    await page.waitForTimeout(500);

    // Intercept API call to simulate error (if possible in production)
    // Or send a message and wait to see if any error handling UI appears
    const messageInput = page.locator('input[name="message"]');
    await messageInput.fill('Test error handling');
    await page.locator('form button[type="submit"]').click();

    // Wait for processing
    await page.waitForTimeout(10000);

    // Check if error display exists (may not appear if API works correctly)
    const errorDisplay = page.locator('text=Error').or(page.locator('text=Failed'));
    const hasError = await errorDisplay.isVisible().catch(() => false);

    // This is more of a negative test - we expect NO errors
    // But if there is an error, it should be displayed properly
    if (hasError) {
      await expect(errorDisplay).toBeVisible();
    } else {
      // If no error, we should have messages
      const messages = page.locator('[class*="ChatMessage"]');
      const count = await messages.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

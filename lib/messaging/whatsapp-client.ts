/**
 * WhatsApp Client
 * Handles sending and receiving messages via WhatsApp Web API
 * Uses whatsapp-web.js for unofficial WhatsApp Web access
 */

// Note: This will use whatsapp-web.js library which needs to be installed
// The client needs to be initialized once and kept alive
// For production, this should run in a separate service/process

interface WhatsAppClientState {
  ready: boolean;
  qrCode: string | null;
  session: any | null;
}

// In-memory state (in production, use Redis or similar)
let clientState: WhatsAppClientState = {
  ready: false,
  qrCode: null,
  session: null,
};

/**
 * Initialize WhatsApp client
 * Note: This is a placeholder - actual implementation needs whatsapp-web.js
 */
export async function initializeWhatsAppClient(): Promise<{
  success: boolean;
  qrCode?: string;
  error?: string;
}> {
  try {
    // This is a placeholder for the actual whatsapp-web.js client initialization
    // Real implementation would:
    // 1. Create Client instance
    // 2. Set up authentication
    // 3. Generate QR code for scanning
    // 4. Wait for ready state
    // 5. Set up message event handlers

    console.log('WhatsApp client initialization started');

    // For now, return mock success
    // In real implementation, this would use:
    // const { Client, LocalAuth } = require('whatsapp-web.js');
    // const client = new Client({ authStrategy: new LocalAuth() });

    return {
      success: true,
      qrCode: 'MOCK_QR_CODE', // Real QR code would be generated here
    };
  } catch (error: any) {
    console.error('Failed to initialize WhatsApp client:', error);
    return {
      success: false,
      error: error.message || 'Failed to initialize WhatsApp',
    };
  }
}

/**
 * Send a text message via WhatsApp
 */
export async function sendWhatsAppMessage(params: {
  phoneNumber: string; // E.164 format: +1234567890
  text: string;
  userId?: string; // For logging
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!clientState.ready) {
      throw new Error('WhatsApp client not ready');
    }

    // Normalize phone number to WhatsApp chat ID format
    // E.164 +1234567890 -> 1234567890@c.us
    const chatId = params.phoneNumber.replace(/\+/g, '') + '@c.us';

    // This is a placeholder for actual message sending
    // Real implementation would use:
    // const message = await client.sendMessage(chatId, params.text);

    console.log('Sending WhatsApp message to:', chatId, params.text);

    // Mock success response
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    };
  } catch (error: any) {
    console.error('Failed to send WhatsApp message:', error);
    return {
      success: false,
      error: error.message || 'Failed to send message',
    };
  }
}

/**
 * Send a formatted message with bold, italic, etc.
 */
export async function sendWhatsAppFormattedMessage(params: {
  phoneNumber: string;
  text: string;
  bold?: boolean;
  italic?: boolean;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let formattedText = params.text;

  if (params.bold) {
    formattedText = `*${formattedText}*`;
  }
  if (params.italic) {
    formattedText = `_${formattedText}_`;
  }

  return sendWhatsAppMessage({
    phoneNumber: params.phoneNumber,
    text: formattedText,
  });
}

/**
 * Check if WhatsApp client is ready
 */
export function isWhatsAppClientReady(): boolean {
  return clientState.ready;
}

/**
 * Get WhatsApp client QR code for authentication
 */
export function getWhatsAppQRCode(): string | null {
  return clientState.qrCode;
}

/**
 * Format notification for WhatsApp
 */
export function formatNotificationForWhatsApp(
  type: string,
  data: any
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

  switch (type) {
    case 'task_reminder':
      return `⏰ *Task Reminder*\n\n` +
        `Investor: ${data.investor_name}\n` +
        `Task: ${data.task_title}\n` +
        `Due: ${data.due_date}\n\n` +
        `View: ${baseUrl}/tasks?task=${data.task_id}`;

    case 'investor_update':
      return `📊 *Investor Update*\n\n` +
        `${data.investor_name}\n` +
        `${data.update_type}: ${data.details}\n\n` +
        `View: ${baseUrl}/investors/${data.investor_id}`;

    case 'pipeline_alert':
      return `🚨 *Pipeline Alert*\n\n` +
        `${data.count} ${data.alert_type}\n` +
        `${data.details}\n\n` +
        `View Dashboard: ${baseUrl}`;

    case 'ai_insight':
      let message = `💡 *AI Insight*\n\n${data.insight}`;
      if (data.related_investor_id) {
        message += `\n\nView: ${baseUrl}/investors/${data.related_investor_id}`;
      }
      return message;

    default:
      return `*Notification*\n\n${JSON.stringify(data)}`;
  }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // Check if it starts with +
  if (!cleaned.startsWith('+')) {
    return {
      valid: false,
      error: 'Phone number must start with + and country code',
    };
  }

  // Check if it has at least 10 digits (including country code)
  if (cleaned.length < 11) {
    return {
      valid: false,
      error: 'Phone number too short',
    };
  }

  return {
    valid: true,
    normalized: cleaned,
  };
}

/**
 * Handle incoming WhatsApp message
 * This would be called by the webhook/event handler
 */
export async function handleIncomingWhatsAppMessage(params: {
  from: string; // Phone number
  text: string;
  messageId: string;
}): Promise<void> {
  try {
    console.log('Received WhatsApp message:', params);

    // This is where you would:
    // 1. Find the user by phone number
    // 2. Store the message in the database
    // 3. Process commands (e.g., "pipeline summary")
    // 4. Send to AI BDR if it's a query
    // 5. Send response back

    // For now, just log it
    console.log('Processing incoming WhatsApp message...');
  } catch (error) {
    console.error('Error handling incoming WhatsApp message:', error);
  }
}

/**
 * Setup instructions for WhatsApp Web API
 */
export const WHATSAPP_SETUP_INSTRUCTIONS = `
# WhatsApp Web API Setup

## Prerequisites
1. Install whatsapp-web.js:
   npm install whatsapp-web.js

2. Install dependencies:
   npm install qrcode-terminal puppeteer

## Setup Steps
1. Run the initialization script
2. Scan the QR code with WhatsApp on your phone
3. Wait for authentication to complete
4. Client will stay connected and ready to send/receive messages

## Important Notes
- WhatsApp Web API requires the phone to be online
- Messages are end-to-end encrypted
- Rate limits: ~1000 messages per day per number
- For production, run in a separate service/Docker container
- Use Redis to share session across instances

## Alternative: WhatsApp Business API
For official, production-grade integration:
- Apply for WhatsApp Business API access
- Get approved by Meta
- Use official Cloud API or On-Premises API
- Better reliability and features
- Higher rate limits
`;

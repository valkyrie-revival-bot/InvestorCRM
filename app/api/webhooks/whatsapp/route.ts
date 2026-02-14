/**
 * WhatsApp Webhook Handler
 * Receives incoming messages from WhatsApp Web API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Received WhatsApp webhook:', body);

    // WhatsApp Web API sends message events
    if (body.type === 'message') {
      return await handleMessage(body);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error handling WhatsApp webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle incoming WhatsApp message
 */
async function handleMessage(event: any) {
  try {
    const { from, body: messageText, id: messageId } = event;

    console.log('Processing WhatsApp message:', {
      from,
      text: messageText,
      id: messageId,
    });

    // Normalize phone number (remove @c.us suffix if present)
    const phoneNumber = from.replace('@c.us', '');
    const formattedPhone = `+${phoneNumber}`;

    // Find user by phone number
    const supabase = await createAdminClient();

    const { data: prefs } = await supabase
      .from('user_messaging_preferences')
      .select('user_id')
      .eq('whatsapp_phone_number', formattedPhone)
      .eq('whatsapp_verified', true)
      .single();

    if (!prefs) {
      console.log('No verified user found for phone:', formattedPhone);
      return NextResponse.json({
        success: true,
        message: 'Phone number not registered',
      });
    }

    // Store message in database
    await supabase.from('whatsapp_messages').insert({
      user_id: prefs.user_id,
      phone_number: formattedPhone,
      whatsapp_message_id: messageId,
      chat_id: from,
      direction: 'inbound',
      sender_type: 'user',
      content: messageText,
      message_type: 'text',
    });

    // Process the message (check for commands, queries, etc.)
    const response = await processUserMessage(messageText, prefs.user_id);

    // Send response back via WhatsApp
    // Note: This would actually send via the WhatsApp client
    console.log('Would send response:', response);

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('Error handling WhatsApp message:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process user message and generate response
 */
async function processUserMessage(
  message: string,
  userId: string
): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Check for common commands
  if (
    lowerMessage.includes('pipeline') ||
    lowerMessage.includes('summary')
  ) {
    return await getPipelineSummary(userId);
  }

  if (
    lowerMessage.includes('task') ||
    lowerMessage.includes('overdue') ||
    lowerMessage.includes('due')
  ) {
    return await getTasksSummary(userId);
  }

  if (
    lowerMessage.includes('stalled') ||
    lowerMessage.includes('stuck')
  ) {
    return await getStalledInvestors(userId);
  }

  if (lowerMessage.includes('help')) {
    return getHelpMessage();
  }

  // Default response
  return `I can help you with:\n\n` +
    `📊 *pipeline* - Get pipeline summary\n` +
    `✅ *tasks* - View pending tasks\n` +
    `⚠️ *stalled* - See stalled investors\n` +
    `❓ *help* - Show this help\n\n` +
    `What would you like to know?`;
}

/**
 * Get help message
 */
function getHelpMessage(): string {
  return `🤖 *CRM Assistant Commands*\n\n` +
    `📊 *Pipeline*\n` +
    `Get overview of all investors by stage\n\n` +
    `✅ *Tasks*\n` +
    `View pending and overdue tasks\n\n` +
    `⚠️ *Stalled*\n` +
    `See investors needing attention\n\n` +
    `Just send a message and I'll do my best to help!`;
}

/**
 * Get pipeline summary
 */
async function getPipelineSummary(userId: string): Promise<string> {
  const supabase = await createAdminClient();

  const { data: investors, error } = await supabase
    .from('investors')
    .select('stage')
    .is('deleted_at', null);

  if (error || !investors) {
    return 'Unable to fetch pipeline data.';
  }

  // Count by stage
  const stageCounts: Record<string, number> = {};
  investors.forEach((inv) => {
    stageCounts[inv.stage] = (stageCounts[inv.stage] || 0) + 1;
  });

  let summary = `📊 *Pipeline Summary*\n\n`;
  summary += `Total: *${investors.length}* investors\n\n`;

  Object.entries(stageCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([stage, count]) => {
      summary += `• ${stage}: ${count}\n`;
    });

  return summary;
}

/**
 * Get tasks summary
 */
async function getTasksSummary(userId: string): Promise<string> {
  const supabase = await createAdminClient();

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('title, due_date')
    .eq('status', 'pending')
    .order('due_date', { ascending: true })
    .limit(10);

  if (error || !tasks || tasks.length === 0) {
    return '✅ *No pending tasks!*';
  }

  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(t => t.due_date && t.due_date < today);
  const dueToday = tasks.filter(t => t.due_date === today);

  let summary = `📋 *Tasks Summary*\n\n`;
  summary += `Total: ${tasks.length} pending\n`;

  if (overdue.length > 0) {
    summary += `🔴 Overdue: ${overdue.length}\n`;
  }
  if (dueToday.length > 0) {
    summary += `🟡 Due today: ${dueToday.length}\n`;
  }

  summary += `\n*Next 5 tasks:*\n`;
  tasks.slice(0, 5).forEach((task, i) => {
    const emoji = task.due_date && task.due_date < today ? '🔴' :
                  task.due_date === today ? '🟡' : '🟢';
    summary += `${emoji} ${task.title}\n`;
    if (task.due_date) {
      summary += `   Due: ${task.due_date}\n`;
    }
  });

  return summary;
}

/**
 * Get stalled investors
 */
async function getStalledInvestors(userId: string): Promise<string> {
  const supabase = await createAdminClient();

  // Investors with no activity in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: investors, error } = await supabase
    .from('investors')
    .select('firm_name, stage, updated_at')
    .is('deleted_at', null)
    .lt('updated_at', thirtyDaysAgo.toISOString())
    .order('updated_at', { ascending: true })
    .limit(10);

  if (error || !investors || investors.length === 0) {
    return '✅ *No stalled investors!*\n\nEveryone is up to date.';
  }

  let summary = `⚠️ *Stalled Investors*\n\n`;
  summary += `${investors.length} investors need attention:\n\n`;

  investors.forEach((inv, i) => {
    const daysSince = Math.floor(
      (Date.now() - new Date(inv.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    summary += `${i + 1}. *${inv.firm_name}*\n`;
    summary += `   Stage: ${inv.stage}\n`;
    summary += `   Inactive: ${daysSince} days\n\n`;
  });

  return summary;
}

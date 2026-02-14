/**
 * Google Chat Webhook Handler
 * Receives incoming messages and events from Google Chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Received Google Chat webhook:', body);

    // Google Chat sends different event types
    const eventType = body.type;

    switch (eventType) {
      case 'MESSAGE':
        return await handleMessage(body);

      case 'ADDED_TO_SPACE':
        return await handleAddedToSpace(body);

      case 'REMOVED_FROM_SPACE':
        return await handleRemovedFromSpace(body);

      default:
        console.log('Unknown event type:', eventType);
        return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error('Error handling Google Chat webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle incoming message from Google Chat
 */
async function handleMessage(event: any) {
  try {
    const message = event.message;
    const space = event.space;
    const user = event.user;

    // Extract message details
    const spaceId = space.name.replace('spaces/', '');
    const messageText = message.text;
    const messageSender = user.displayName;
    const senderEmail = user.email;

    console.log('Processing message:', {
      space: spaceId,
      from: messageSender,
      text: messageText,
    });

    // Find user by email
    const supabase = await createAdminClient();

    const { data: authUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', senderEmail)
      .single();

    if (!authUser) {
      console.log('User not found for email:', senderEmail);
      return NextResponse.json({
        text: "Sorry, I couldn't find your account. Please contact support.",
      });
    }

    // Store message in database
    await supabase.from('google_chat_messages').insert({
      user_id: authUser.id,
      space_id: spaceId,
      message_id: message.name,
      thread_id: message.thread?.name,
      direction: 'inbound',
      sender_type: 'user',
      content: messageText,
      message_type: 'text',
    });

    // Process the message (check for commands, queries, etc.)
    const response = await processUserMessage(messageText, authUser.id);

    // Return response to Google Chat
    return NextResponse.json({
      text: response,
    });
  } catch (error: any) {
    console.error('Error handling message:', error);
    return NextResponse.json({
      text: 'Sorry, something went wrong processing your message.',
    });
  }
}

/**
 * Handle bot being added to a space
 */
async function handleAddedToSpace(event: any) {
  const space = event.space;
  const spaceType = space.type; // 'DM' or 'ROOM'

  console.log('Bot added to space:', space.name, 'Type:', spaceType);

  if (spaceType === 'DM') {
    return NextResponse.json({
      text: "👋 Hi! I'm your CRM assistant. You can ask me about your pipeline, tasks, and investors.\n\n" +
        "Try:\n" +
        "• 'Pipeline summary'\n" +
        "• 'Overdue tasks'\n" +
        "• 'Stalled investors'\n" +
        "• Or just ask me anything!",
    });
  } else {
    return NextResponse.json({
      text: "👋 Hi everyone! I'm the CRM bot. Mention me to get pipeline insights and updates.",
    });
  }
}

/**
 * Handle bot being removed from a space
 */
async function handleRemovedFromSpace(event: any) {
  console.log('Bot removed from space:', event.space.name);
  return NextResponse.json({ success: true });
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

  // For other queries, could integrate with AI BDR
  return "I can help you with:\n" +
    "• Pipeline summary\n" +
    "• Task reminders\n" +
    "• Stalled investors\n\n" +
    "What would you like to know?";
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
  summary += `Total: ${investors.length} investors\n\n`;

  Object.entries(stageCounts).forEach(([stage, count]) => {
    summary += `${stage}: ${count}\n`;
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
    .select('*')
    .eq('status', 'pending')
    .order('due_date', { ascending: true })
    .limit(5);

  if (error || !tasks || tasks.length === 0) {
    return '✅ No pending tasks!';
  }

  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(t => t.due_date && t.due_date < today);

  let summary = `📋 *Tasks Summary*\n\n`;
  summary += `Total pending: ${tasks.length}\n`;

  if (overdue.length > 0) {
    summary += `⚠️ Overdue: ${overdue.length}\n\n`;
    summary += `Next 5 tasks:\n`;
    tasks.slice(0, 5).forEach(task => {
      const emoji = task.due_date && task.due_date < today ? '🔴' : '🟡';
      summary += `${emoji} ${task.title} - Due: ${task.due_date}\n`;
    });
  }

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
    .limit(5);

  if (error || !investors || investors.length === 0) {
    return '✅ No stalled investors!';
  }

  let summary = `⚠️ *Stalled Investors*\n\n`;
  summary += `${investors.length} investors need attention:\n\n`;

  investors.forEach(inv => {
    const daysSince = Math.floor(
      (Date.now() - new Date(inv.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    summary += `• ${inv.firm_name} (${inv.stage}) - ${daysSince} days\n`;
  });

  return summary;
}

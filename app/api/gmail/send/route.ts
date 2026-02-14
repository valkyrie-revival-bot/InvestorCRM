/**
 * Gmail Send API Route
 * Sends emails via Gmail API
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createGoogleClient } from '@/lib/google/client';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, subject, body: emailBody } = body;

    // Validate input
    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Create authenticated Google client
    const oauth2Client = await createGoogleClient(user.id);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email message
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      emailBody,
    ].join('\n');

    // Encode message in base64
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: response.data.id,
    });
  } catch (error: any) {
    console.error('Gmail send error:', error);

    // Handle authentication errors
    if (
      error?.message?.includes('invalid_grant') ||
      error?.message?.includes('User has not authorized')
    ) {
      return NextResponse.json(
        { error: 'Google authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

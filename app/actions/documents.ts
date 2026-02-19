'use server';

/**
 * Document workflow server actions
 * Handles signature requests and document email distribution
 */

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';
import type { SignatureRequest, DocumentEmail, DriveLink } from '@/types/google';

// ============================================================================
// SIGNATURE REQUESTS
// ============================================================================

export interface CreateSignatureRequestParams {
  investorId: string;
  driveLinkId: string;
  signerEmail: string;
  signerName?: string;
  message?: string;
}

export interface CreateSignatureRequestResult {
  success?: boolean;
  data?: SignatureRequest;
  error?: string;
}

/**
 * Create a signature request for a document
 * Sends email with link to document via Gmail API
 */
export async function createSignatureRequest(
  params: CreateSignatureRequestParams
): Promise<CreateSignatureRequestResult> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Get drive link details
    const { data: driveLink, error: driveLinkError } = await supabase
      .from('drive_links')
      .select('*')
      .eq('id', params.driveLinkId)
      .single();

    if (driveLinkError || !driveLink) {
      return { error: 'Document not found' };
    }

    // Insert signature request
    const { data: signatureRequest, error: insertError } = await supabase
      .from('signature_requests')
      .insert({
        investor_id: params.investorId,
        drive_link_id: params.driveLinkId,
        signer_email: params.signerEmail,
        signer_name: params.signerName || null,
        message: params.message || null,
        status: 'pending',
        requested_by: user.id,
      })
      .select()
      .single();

    if (insertError || !signatureRequest) {
      console.error('Failed to create signature request:', insertError);
      return { error: 'Failed to create signature request' };
    }

    // Send email notification via Gmail API
    try {
      const emailSubject = `Signature Request: ${driveLink.file_name}`;
      const emailBody = `
Hello ${params.signerName || params.signerEmail},

You have been requested to sign the following document:

Document: ${driveLink.file_name}
Link: ${driveLink.file_url}

${params.message ? `\nMessage:\n${params.message}` : ''}

Please review and sign the document at your earliest convenience.

Thank you!
`.trim();

      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: params.signerEmail,
          subject: emailSubject,
          body: emailBody,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send signature request email');
        // Don't fail the whole operation, just log the error
      }
    } catch (emailError) {
      console.error('Error sending signature request email:', emailError);
      // Don't fail the whole operation
    }

    // Log activity
    await supabase.from('activities').insert({
      investor_id: params.investorId,
      activity_type: 'note',
      description: `Signature requested from ${params.signerEmail} for ${driveLink.file_name}`,
      metadata: {
        type: 'signature_request',
        signer_email: params.signerEmail,
        document_name: driveLink.file_name,
      },
      created_by: user.id,
    });

    // Revalidate investor page
    revalidatePath(`/investors/${params.investorId}`);

    return { success: true, data: signatureRequest as SignatureRequest };
  } catch (error: any) {
    console.error('Error creating signature request:', error);
    return { error: error?.message || 'Failed to create signature request' };
  }
}

/**
 * Update signature request status
 */
export async function updateSignatureRequestStatus(
  requestId: string,
  status: 'signed' | 'declined'
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('signature_requests')
      .update({
        status,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.error('Failed to update signature request:', error);
      return { error: 'Failed to update signature request' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating signature request:', error);
    return { error: error?.message || 'Failed to update signature request' };
  }
}

/**
 * Get signature requests for an investor
 */
export async function getSignatureRequests(
  investorId: string
): Promise<{ data: SignatureRequest[] } | { error: string }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('signature_requests')
      .select('*')
      .eq('investor_id', investorId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch signature requests:', error);
      return { error: 'Failed to fetch signature requests' };
    }

    return { data: data as SignatureRequest[] };
  } catch (error: any) {
    console.error('Error fetching signature requests:', error);
    return { error: error?.message || 'Failed to fetch signature requests' };
  }
}

// ============================================================================
// DOCUMENT EMAILS
// ============================================================================

export interface SendDocumentEmailParams {
  investorId: string;
  driveLinkId: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendDocumentEmailResult {
  success?: boolean;
  data?: DocumentEmail;
  error?: string;
}

/**
 * Send a document via email with Drive link
 * Uses Gmail API to send email
 */
export async function sendDocumentEmail(
  params: SendDocumentEmailParams
): Promise<SendDocumentEmailResult> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Get drive link details
    const { data: driveLink, error: driveLinkError } = await supabase
      .from('drive_links')
      .select('*')
      .eq('id', params.driveLinkId)
      .single();

    if (driveLinkError || !driveLink) {
      return { error: 'Document not found' };
    }

    // Send email via Gmail API
    let messageId: string | null = null;
    try {
      const emailBody = `${params.body}\n\nDocument: ${driveLink.file_name}\nLink: ${driveLink.file_url}`;

      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: params.to,
          subject: params.subject,
          body: emailBody,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      messageId = result.messageId || null;
    } catch (emailError: any) {
      console.error('Error sending document email:', emailError);
      return { error: emailError?.message || 'Failed to send email' };
    }

    // Insert document email record
    const { data: documentEmail, error: insertError } = await supabase
      .from('document_emails')
      .insert({
        investor_id: params.investorId,
        drive_link_id: params.driveLinkId,
        to_address: params.to,
        subject: params.subject,
        body: params.body,
        message_id: messageId,
        sent_by: user.id,
      })
      .select()
      .single();

    if (insertError || !documentEmail) {
      console.error('Failed to log document email:', insertError);
      return { error: 'Failed to log document email' };
    }

    // Log activity
    await supabase.from('activities').insert({
      investor_id: params.investorId,
      activity_type: 'email',
      description: `Sent document "${driveLink.file_name}" to ${params.to}`,
      metadata: {
        type: 'document_email',
        to: params.to,
        subject: params.subject,
        document_name: driveLink.file_name,
        message_id: messageId,
      },
      created_by: user.id,
    });

    // Revalidate investor page
    revalidatePath(`/investors/${params.investorId}`);

    return { success: true, data: documentEmail as DocumentEmail };
  } catch (error: any) {
    console.error('Error sending document email:', error);
    return { error: error?.message || 'Failed to send document email' };
  }
}

// ============================================================================
// DOCUMENT UPLOAD (Supabase Storage)
// ============================================================================

const STORAGE_BUCKET = 'investor-documents';

/**
 * Upload a file to Supabase Storage and link it to an investor's drive_links
 */
export async function uploadInvestorDocument(
  investorId: string,
  formData: FormData
): Promise<{ data: { file_url: string; file_name: string }; error?: never } | { data?: never; error: string }> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return { error: 'No file provided' };
    }

    if (file.size > 50 * 1024 * 1024) {
      return { error: 'File size must be under 50MB' };
    }

    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${investorId}/${Date.now()}_${safeName}`;

    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await dbClient.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { error: `Upload failed: ${uploadError.message}` };
    }

    const { data: urlData } = dbClient.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    const { error: insertError } = await dbClient.from('drive_links').insert({
      investor_id: investorId,
      file_id: storagePath,
      file_name: file.name,
      file_url: fileUrl,
      mime_type: file.type || null,
      thumbnail_url: null,
      linked_by: user.id,
    });

    if (insertError) {
      await dbClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return { error: `Failed to link document: ${insertError.message}` };
    }

    revalidatePath(`/investors/${investorId}`);
    return { data: { file_url: fileUrl, file_name: file.name } };
  } catch (error) {
    console.error('uploadInvestorDocument error:', error);
    return { error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

/**
 * Get document emails for an investor
 */
export async function getDocumentEmails(
  investorId: string
): Promise<{ data: DocumentEmail[] } | { error: string }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('document_emails')
      .select('*')
      .eq('investor_id', investorId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch document emails:', error);
      return { error: 'Failed to fetch document emails' };
    }

    return { data: data as DocumentEmail[] };
  } catch (error: any) {
    console.error('Error fetching document emails:', error);
    return { error: error?.message || 'Failed to fetch document emails' };
  }
}

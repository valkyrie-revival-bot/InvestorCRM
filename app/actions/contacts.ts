'use server';

/**
 * Server actions for contact CRUD operations
 * Handles validation, auth, database operations, and activity logging
 */

import { createClient } from '@/lib/supabase/server';
import { contactSchema, type ContactInput } from '@/lib/validations/contact-schema';
import type { Contact } from '@/types/investors';

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new contact for an investor
 * If is_primary is true, sets all other contacts for this investor to is_primary = false
 */
export async function createContact(
  investorId: string,
  data: ContactInput
): Promise<
  { data: Contact; error?: never } | { data?: never; error: string }
> {
  try {
    // Validate input
    const validated = contactSchema.parse(data);

    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // If is_primary is true, unset all other primary contacts for this investor
    if (validated.is_primary) {
      await supabase
        .from('contacts')
        .update({ is_primary: false })
        .eq('investor_id', investorId)
        .eq('is_primary', true);
    }

    // Insert contact
    const { data: contact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        investor_id: investorId,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        title: validated.title,
        notes: validated.notes,
        is_primary: validated.is_primary || false,
      })
      .select()
      .single();

    if (insertError || !contact) {
      return { error: insertError?.message || 'Failed to create contact' };
    }

    // Log activity on investor
    await supabase.from('activities').insert({
      investor_id: investorId,
      activity_type: 'note',
      description: `Added contact: ${validated.name}`,
      created_by: user.id,
    });

    return { data: contact };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to create contact' };
  }
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update a single field on a contact record
 */
export async function updateContact(
  contactId: string,
  field: string,
  value: unknown
): Promise<
  { data: Contact; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Update single field
    const { data: contact, error: updateError } = await supabase
      .from('contacts')
      .update({
        [field]: value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .select()
      .single();

    if (updateError || !contact) {
      return { error: updateError?.message || 'Failed to update contact' };
    }

    return { data: contact };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to update contact' };
  }
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Soft delete a contact (set deleted_at)
 */
export async function deleteContact(contactId: string): Promise<
  { success: true; error?: never } | { success?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Soft delete by setting deleted_at
    const { error: deleteError } = await supabase
      .from('contacts')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to delete contact' };
  }
}

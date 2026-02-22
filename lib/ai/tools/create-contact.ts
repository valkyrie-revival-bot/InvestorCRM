/**
 * Create contact tool
 * Resolves investor by firm name then returns confirmation for contact creation
 * Supports adding phone numbers, emails, and contact details
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Create contact tool - proposes contact creation with confirmation
 * Resolves the firm name first, then returns confirmation payload
 */
export const createContactTool = tool({
  description:
    'Propose adding a contact (name, phone, email, title) to an investor. Returns confirmation request for user approval. Use this when asked to add a phone number or contact person to an investor.',
  inputSchema: z.object({
    firm_name: z.string().min(1).describe('Firm name to add contact to (fuzzy match)'),
    name: z.string().min(1).describe('Full name of the contact person'),
    phone: z.string().optional().describe('Phone number (e.g. +1-555-123-4567)'),
    email: z.string().email().optional().describe('Email address'),
    title: z.string().optional().describe('Job title or role (e.g. Managing Partner, CFO)'),
    is_primary: z
      .boolean()
      .optional()
      .describe('Whether this is the primary contact for the investor'),
  }),
  execute: async ({ firm_name, name, phone, email, title, is_primary }) => {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { status: 'error', message: 'Unauthorized - user not authenticated' };
    }

    // Resolve investor by firm name
    const { data: investors, error: searchError } = await supabase
      .from('investors')
      .select('id, firm_name, stage')
      .ilike('firm_name', `%${firm_name}%`)
      .is('deleted_at', null)
      .limit(5);

    if (searchError) {
      return { status: 'error', message: `Database error: ${searchError.message}` };
    }

    if (!investors || investors.length === 0) {
      return {
        status: 'error',
        message: `No investor found matching "${firm_name}". Try a different search term.`,
      };
    }

    if (investors.length > 1) {
      return {
        status: 'clarification_needed',
        message: `Multiple investors match "${firm_name}". Please be more specific.`,
        matches: investors.map((inv) => inv.firm_name),
      };
    }

    const investor = investors[0];

    return {
      status: 'confirmation_required',
      investorId: investor.id,
      firmName: investor.firm_name,
      name,
      phone: phone || null,
      email: email || null,
      title: title || null,
      is_primary: is_primary ?? false,
      message: `I'd like to add a contact to ${investor.firm_name}.`,
    };
  },
});

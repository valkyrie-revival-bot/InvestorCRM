'use server';

/**
 * Server actions for LinkedIn contact import
 * Handles CSV upload, parsing, validation, and database operations
 * Part of Phase 04.5 (Contact Intelligence)
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { parseLinkedInCSV } from '@/lib/csv/parser';
import { normalizeCompanyName } from '@/lib/csv/company-normalizer';
import { validateLinkedInRows } from '@/lib/validations/linkedin-schema';
import { detectRelationships } from '@/lib/matching/relationship-detector';
import type {
  ImportResult,
  LinkedInContactInsert,
  LinkedInContact,
  IntroPath,
} from '@/types/linkedin';

// ============================================================================
// CSV IMPORT
// ============================================================================

/**
 * Import LinkedIn CSV file and store contacts in the database
 *
 * Steps:
 * 1. Validate file (exists, is .csv, under 10MB)
 * 2. Parse CSV (handle LinkedIn's Notes preamble)
 * 3. Validate rows via Zod schema
 * 4. Normalize company names for fuzzy matching
 * 5. Batch insert into linkedin_contacts (500 rows per batch)
 * 6. Handle duplicates via unique constraint (linkedin_url, team_member_name)
 *
 * @param formData FormData with csv_file (File) and team_member_name (string)
 * @returns ImportResult with counts and errors
 */
export async function importLinkedInCSV(formData: FormData): Promise<ImportResult> {
  try {
    // 1. Get file and team member from FormData
    const file = formData.get('csv_file') as File | null;
    const teamMemberName = formData.get('team_member_name') as string | null;

    if (!file) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, message: 'No file provided' }],
        relationships_detected: 0,
      };
    }

    if (!teamMemberName) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, message: 'Team member name is required' }],
        relationships_detected: 0,
      };
    }

    // 2. Validate file type and size
    if (!file.name.endsWith('.csv')) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, message: 'File must be a CSV file' }],
        relationships_detected: 0,
      };
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, message: 'File size must be under 10MB' }],
        relationships_detected: 0,
      };
    }

    // 3. Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, message: 'Unauthorized' }],
        relationships_detected: 0,
      };
    }

    // 4. Read file as text
    const csvText = await file.text();

    // 5. Parse CSV (handles LinkedIn's Notes preamble)
    const { data: parsedRows, errors: parseErrors } = parseLinkedInCSV(csvText);

    if (parseErrors.length > 0) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: parseErrors.map((err) => ({
          row: err.row || 0,
          message: err.message || 'Parse error',
        })),
        relationships_detected: 0,
      };
    }

    // 6. Validate rows via Zod schema
    const { validated, errors: validationErrors } = validateLinkedInRows(parsedRows);

    // 7. Transform validated rows to database inserts
    const contactsToInsert: LinkedInContactInsert[] = validated.map(({ data }) => ({
      first_name: data.first_name,
      last_name: data.last_name,
      linkedin_url: data.linkedin_url,
      email: data.email,
      company: data.company,
      position: data.position,
      normalized_company: data.company ? normalizeCompanyName(data.company) : null,
      connected_on: data.connected_on,
      team_member_name: teamMemberName,
    }));

    // 8. Batch insert (500 rows per batch to avoid request size limits)
    const BATCH_SIZE = 500;
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < contactsToInsert.length; i += BATCH_SIZE) {
      const batch = contactsToInsert.slice(i, i + BATCH_SIZE);

      // Use ignoreDuplicates to handle existing (linkedin_url, team_member_name) pairs
      const { data: insertedContacts, error: insertError } = await supabase
        .from('linkedin_contacts')
        .upsert(batch, {
          onConflict: 'linkedin_url,team_member_name',
          ignoreDuplicates: false, // Update existing records
        })
        .select('id');

      if (insertError) {
        return {
          success: false,
          imported,
          skipped,
          errors: [
            ...validationErrors,
            { row: i, message: insertError.message },
          ],
          relationships_detected: 0,
        };
      }

      // Count how many were inserted vs skipped
      const insertedCount = insertedContacts?.length || 0;
      imported += insertedCount;
      skipped += batch.length - insertedCount;
    }

    // 9. Detect and store relationships (auto-trigger after import)
    let relationshipsDetected = 0;
    try {
      const detectResult = await detectAndStoreRelationships(teamMemberName);
      if (detectResult.data) {
        relationshipsDetected = detectResult.data;
      }
    } catch (detectError) {
      // Log but don't fail import if relationship detection fails
      console.error('Relationship detection failed:', detectError);
    }

    // 10. Revalidate LinkedIn and investor pages
    revalidatePath('/linkedin');
    revalidatePath('/investors');

    // Success!
    return {
      success: true,
      imported,
      skipped,
      errors: validationErrors,
      relationships_detected: relationshipsDetected,
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [
        {
          row: 0,
          message: error instanceof Error ? error.message : 'Import failed',
        },
      ],
      relationships_detected: 0,
    };
  }
}

// ============================================================================
// IMPORT STATS
// ============================================================================

/**
 * Get LinkedIn import statistics grouped by team member
 *
 * Returns count of contacts per team member to show import status
 */
export async function getLinkedInImportStats(): Promise<
  | { data: Array<{ team_member_name: string; count: number }>; error?: never }
  | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Query: SELECT team_member_name, COUNT(*) FROM linkedin_contacts GROUP BY team_member_name
    const result = await supabase
      .from('linkedin_contacts')
      .select('team_member_name');

    if (result.error) {
      return { error: result.error.message };
    }

    // Group and count manually (Supabase doesn't have native GROUP BY in select)
    const grouped = result.data.reduce((acc, row) => {
      const name = row.team_member_name;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats = Object.entries(grouped).map(([team_member_name, count]) => ({
      team_member_name,
      count,
    }));

    return { data: stats };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}

// ============================================================================
// RELATIONSHIP DETECTION
// ============================================================================

/**
 * Detect and store relationships between LinkedIn contacts and investors
 *
 * Uses fuzzy company name matching to find connections between imported
 * LinkedIn contacts and investor firms in the database. Replaces any existing
 * auto-detected relationships for the specified team member.
 *
 * @param teamMemberName Optional: only detect relationships for this team member's contacts
 * @returns Count of relationships detected
 */
export async function detectAndStoreRelationships(
  teamMemberName?: string
): Promise<{ data: number; error?: never } | { data?: never; error: string }> {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Fetch all non-deleted investors
    const { data: investors, error: investorsError } = await supabase
      .from('investors')
      .select('id, firm_name')
      .is('deleted_at', null);

    if (investorsError || !investors) {
      return { error: investorsError?.message || 'Failed to fetch investors' };
    }

    // Fetch LinkedIn contacts (optionally filtered by team member)
    let contactsQuery = supabase
      .from('linkedin_contacts')
      .select('*')
      .not('company', 'is', null); // Only contacts with a company

    if (teamMemberName) {
      contactsQuery = contactsQuery.eq('team_member_name', teamMemberName);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError || !contacts) {
      return { error: contactsError?.message || 'Failed to fetch LinkedIn contacts' };
    }

    // Detect relationships using fuzzy matching
    const relationships = detectRelationships(
      contacts as LinkedInContact[],
      investors
    );

    if (relationships.length === 0) {
      return { data: 0 };
    }

    // Clear existing auto-detected relationships for these contacts
    const contactIds = contacts.map(c => c.id);
    await supabase
      .from('investor_relationships')
      .delete()
      .eq('detected_via', 'company_match')
      .in('linkedin_contact_id', contactIds);

    // Insert new relationships (use upsert to handle duplicates)
    const { error: insertError } = await supabase
      .from('investor_relationships')
      .upsert(relationships, {
        onConflict: 'investor_id,linkedin_contact_id,relationship_type',
        ignoreDuplicates: false, // Update existing
      });

    if (insertError) {
      return { error: insertError.message };
    }

    return { data: relationships.length };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to detect relationships',
    };
  }
}

/**
 * Get warm introduction paths for a specific investor
 *
 * Returns LinkedIn contacts who have connections to the investor firm,
 * sorted by path strength (strongest first).
 *
 * @param investorId Investor ID to get connections for
 * @returns Array of IntroPath objects with contact and relationship details
 */
export async function getInvestorConnections(
  investorId: string
): Promise<{ data: IntroPath[]; error?: never } | { data?: never; error: string }> {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Query relationships with LinkedIn contact data joined
    const { data: relationships, error: queryError } = await supabase
      .from('investor_relationships')
      .select(`
        *,
        linkedin_contacts (
          id,
          first_name,
          last_name,
          full_name,
          company,
          position,
          team_member_name,
          linkedin_url,
          connected_on
        )
      `)
      .eq('investor_id', investorId)
      .order('path_strength', { ascending: false });

    if (queryError) {
      return { error: queryError.message };
    }

    if (!relationships || relationships.length === 0) {
      return { data: [] };
    }

    // Transform to IntroPath format
    const introPaths: IntroPath[] = relationships
      .filter(rel => rel.linkedin_contacts) // Filter out any broken joins
      .map(rel => {
        const contact = Array.isArray(rel.linkedin_contacts)
          ? rel.linkedin_contacts[0]
          : rel.linkedin_contacts;

        // Calculate strength label
        let strengthLabel: 'strong' | 'medium' | 'weak' = 'weak';
        if (rel.path_strength >= 0.7) strengthLabel = 'strong';
        else if (rel.path_strength >= 0.4) strengthLabel = 'medium';

        return {
          linkedin_contact_id: contact.id,
          contact_name: contact.full_name,
          contact_company: contact.company,
          contact_position: contact.position,
          team_member_name: contact.team_member_name,
          relationship_type: rel.relationship_type,
          path_strength: rel.path_strength,
          strength_label: strengthLabel,
          path_description: rel.path_description || '',
          linkedin_url: contact.linkedin_url,
        };
      });

    return { data: introPaths };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch connections',
    };
  }
}

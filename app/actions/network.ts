'use server';

/**
 * Network graph server actions
 * Query relationship paths between user, LinkedIn contacts, and investors
 * Part of Phase 04.5 (Contact Intelligence) - Network visualization
 */

import { createClient } from '@/lib/supabase/server';
import type { IntroPath } from '@/types/linkedin';

export interface NetworkPath {
  investorId: string;
  investorName: string;
  connections: IntroPath[];
  totalPaths: number;
  strongPaths: number;
  mediumPaths: number;
  weakPaths: number;
}

/**
 * Get network graph data for a specific investor
 *
 * Returns all LinkedIn connections that provide warm intro paths
 * to the target investor, with path strength calculations
 *
 * @param investorId UUID of the target investor
 * @returns NetworkPath with connections and statistics
 */
export async function getNetworkGraph(
  investorId: string
): Promise<{ data: NetworkPath; error?: never } | { data?: never; error: string }> {
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

    // Fetch investor details
    const { data: investor, error: investorError } = await supabase
      .from('investors')
      .select('id, firm_name')
      .eq('id', investorId)
      .is('deleted_at', null)
      .single();

    if (investorError || !investor) {
      return { error: 'Investor not found' };
    }

    // Fetch all relationships with LinkedIn contact details
    const { data: relationships, error: relationshipsError } = await supabase
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
          linkedin_url
        )
      `)
      .eq('investor_id', investorId)
      .order('path_strength', { ascending: false });

    if (relationshipsError) {
      return { error: relationshipsError.message };
    }

    // Transform to IntroPath format
    const connections: IntroPath[] = (relationships || [])
      .filter(rel => rel.linkedin_contacts) // Filter out broken joins
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

    // Calculate statistics
    const strongPaths = connections.filter(c => c.strength_label === 'strong').length;
    const mediumPaths = connections.filter(c => c.strength_label === 'medium').length;
    const weakPaths = connections.filter(c => c.strength_label === 'weak').length;

    return {
      data: {
        investorId: investor.id,
        investorName: investor.firm_name,
        connections,
        totalPaths: connections.length,
        strongPaths,
        mediumPaths,
        weakPaths,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch network graph',
    };
  }
}

/**
 * Get network overview for all investors
 *
 * Returns summary statistics for each investor's network connections,
 * useful for identifying which investors have the strongest warm intro paths
 *
 * @returns Array of investors with their connection counts
 */
export async function getNetworkOverview(): Promise<
  | { data: Array<{
      investorId: string;
      investorName: string;
      totalConnections: number;
      strongConnections: number;
    }>; error?: never }
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

    // Fetch all investors with their relationship counts
    const { data: investors, error: investorsError } = await supabase
      .from('investors')
      .select(`
        id,
        firm_name,
        investor_relationships (
          id,
          path_strength
        )
      `)
      .is('deleted_at', null);

    if (investorsError) {
      return { error: investorsError.message };
    }

    // Transform and calculate stats
    const overview = (investors || []).map(investor => {
      const relationships = Array.isArray(investor.investor_relationships)
        ? investor.investor_relationships
        : [];

      const totalConnections = relationships.length;
      const strongConnections = relationships.filter(
        rel => rel.path_strength >= 0.7
      ).length;

      return {
        investorId: investor.id,
        investorName: investor.firm_name,
        totalConnections,
        strongConnections,
      };
    });

    // Sort by strong connections (most valuable first)
    overview.sort((a, b) => b.strongConnections - a.strongConnections);

    return { data: overview };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch network overview',
    };
  }
}

/**
 * Calculate the shortest path between user and target investor
 *
 * Uses path strength as edge weights to find the strongest intro path.
 * Returns the best single path for warm introduction outreach.
 *
 * @param investorId UUID of target investor
 * @returns Single best IntroPath or null if none exists
 */
export async function getBestIntroPath(
  investorId: string
): Promise<{ data: IntroPath | null; error?: never } | { data?: never; error: string }> {
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

    // Get highest strength relationship for this investor
    const { data: relationship, error: relationshipError } = await supabase
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
          linkedin_url
        )
      `)
      .eq('investor_id', investorId)
      .order('path_strength', { ascending: false })
      .limit(1)
      .single();

    if (relationshipError) {
      // No relationships found
      if (relationshipError.code === 'PGRST116') {
        return { data: null };
      }
      return { error: relationshipError.message };
    }

    if (!relationship || !relationship.linkedin_contacts) {
      return { data: null };
    }

    const contact = Array.isArray(relationship.linkedin_contacts)
      ? relationship.linkedin_contacts[0]
      : relationship.linkedin_contacts;

    // Calculate strength label
    let strengthLabel: 'strong' | 'medium' | 'weak' = 'weak';
    if (relationship.path_strength >= 0.7) strengthLabel = 'strong';
    else if (relationship.path_strength >= 0.4) strengthLabel = 'medium';

    return {
      data: {
        linkedin_contact_id: contact.id,
        contact_name: contact.full_name,
        contact_company: contact.company,
        contact_position: contact.position,
        team_member_name: contact.team_member_name,
        relationship_type: relationship.relationship_type,
        path_strength: relationship.path_strength,
        strength_label: strengthLabel,
        path_description: relationship.path_description || '',
        linkedin_url: contact.linkedin_url,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch best intro path',
    };
  }
}

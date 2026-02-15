/**

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
 * Full-Text Search API Route
 * Implements PostgreSQL tsvector/tsquery for searching across multiple tables
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';

interface SearchResult {
  type: 'investor' | 'interaction' | 'task' | 'meeting';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  relevance?: number;
}

/**
 * GET /api/search?q=query&types=investor,task&limit=50
 * Full-text search across investors, interactions, tasks, and meetings
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await getSupabaseClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const typesParam = searchParams.get('types');
    const limitParam = searchParams.get('limit');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Parse search types (default to all)
    const searchTypes = typesParam
      ? typesParam.split(',')
      : ['investor', 'interaction', 'task', 'meeting'];

    // Parse limit (default 50, max 100)
    const limit = Math.min(parseInt(limitParam || '50', 10), 100);

    // Prepare search term for PostgreSQL
    const searchTerm = query.trim().split(/\s+/).join(' & ');

    const results: SearchResult[] = [];

    // Search investors
    if (searchTypes.includes('investor')) {
      try {
        const { data: investors, error } = await supabase
          .from('investors')
          .select('id, firm_name, stage, check_size_min, check_size_max, primary_contact_name, tags')
          .or(`firm_name.ilike.%${query}%,primary_contact_name.ilike.%${query}%,tags.cs.{${query}}`)
          .limit(limit);

        if (!error && investors) {
          results.push(
            ...investors.map((inv: { id: string; firm_name: string; stage: string; primary_contact_name?: string | null; check_size_min?: number | null; check_size_max?: number | null; tags?: string[] | null }) => ({
              type: 'investor' as const,
              id: inv.id,
              title: inv.firm_name,
              subtitle: inv.stage,
              description: inv.primary_contact_name || undefined,
              metadata: {
                stage: inv.stage,
                check_size_min: inv.check_size_min,
                check_size_max: inv.check_size_max,
                tags: inv.tags,
              },
            }))
          );
        }
      } catch (error) {
        console.error('Error searching investors:', error);
      }
    }

    // Search interactions
    if (searchTypes.includes('interaction')) {
      try {
        // Note: Using ilike for simplicity. For production, consider using tsvector indexes
        const { data: interactions, error } = await supabase
          .from('interactions')
          .select(`
            id,
            interaction_type,
            channel,
            notes,
            interaction_date,
            investor:investors(firm_name)
          `)
          .ilike('notes', `%${query}%`)
          .limit(limit);

        if (!error && interactions) {
          results.push(
            ...interactions.map((int: any) => ({
              type: 'interaction' as const,
              id: int.id,
              title: `${int.interaction_type} - ${int.investor?.firm_name || 'Unknown'}`,
              subtitle: new Date(int.interaction_date).toLocaleDateString(),
              description: int.notes?.substring(0, 150),
              metadata: {
                type: int.interaction_type,
                channel: int.channel,
                date: int.interaction_date,
              },
            }))
          );
        }
      } catch (error) {
        console.error('Error searching interactions:', error);
      }
    }

    // Search tasks
    if (searchTypes.includes('task')) {
      try {
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            description,
            status,
            priority,
            due_date,
            investor:investors(firm_name)
          `)
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(limit);

        if (!error && tasks) {
          results.push(
            ...tasks.map((task: any) => ({
              type: 'task' as const,
              id: task.id,
              title: task.title,
              subtitle: task.investor?.firm_name || 'No investor',
              description: task.description?.substring(0, 150),
              metadata: {
                status: task.status,
                priority: task.priority,
                due_date: task.due_date,
              },
            }))
          );
        }
      } catch (error) {
        console.error('Error searching tasks:', error);
      }
    }

    // Search meetings
    if (searchTypes.includes('meeting')) {
      try {
        const { data: meetings, error } = await supabase
          .from('meetings')
          .select(`
            id,
            meeting_title,
            meeting_date,
            status,
            investor:investors(firm_name),
            transcript:meeting_transcripts(summary, transcript_text)
          `)
          .or(`meeting_title.ilike.%${query}%`)
          .limit(limit);

        if (!error && meetings) {
          results.push(
            ...meetings.map((mtg: any) => ({
              type: 'meeting' as const,
              id: mtg.id,
              title: mtg.meeting_title,
              subtitle: mtg.investor?.firm_name || 'No investor',
              description: mtg.transcript?.[0]?.summary?.substring(0, 150) || undefined,
              metadata: {
                date: mtg.meeting_date,
                status: mtg.status,
                has_transcript: !!mtg.transcript?.[0],
              },
            }))
          );
        }

        // Also search in transcripts if available
        const { data: transcripts, error: transcriptError } = await supabase
          .from('meeting_transcripts')
          .select(`
            id,
            meeting_id,
            summary,
            transcript_text,
            meeting:meetings(
              meeting_title,
              meeting_date,
              investor:investors(firm_name)
            )
          `)
          .or(`summary.ilike.%${query}%,transcript_text.ilike.%${query}%`)
          .limit(limit);

        if (!transcriptError && transcripts) {
          results.push(
            ...transcripts
              .filter((t: any) => t.meeting) // Only include if meeting exists
              .map((t: any) => ({
                type: 'meeting' as const,
                id: t.meeting_id,
                title: t.meeting.meeting_title,
                subtitle: `${t.meeting.investor?.firm_name || 'No investor'} - Transcript`,
                description: t.summary?.substring(0, 150),
                metadata: {
                  date: t.meeting.meeting_date,
                  has_transcript: true,
                  match_in_transcript: true,
                },
              }))
          );
        }
      } catch (error) {
        console.error('Error searching meetings:', error);
      }
    }

    // Remove duplicates (e.g., same meeting found in both meetings and transcripts)
    const uniqueResults = results.reduce((acc: SearchResult[], current) => {
      const exists = acc.find(item => item.type === current.type && item.id === current.id);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Sort by relevance (simple: prioritize investors, then tasks, then meetings, then interactions)
    const typeOrder = { investor: 0, task: 1, meeting: 2, interaction: 3 };
    uniqueResults.sort((a, b) => {
      return typeOrder[a.type] - typeOrder[b.type];
    });

    // Limit final results
    const finalResults = uniqueResults.slice(0, limit);

    return NextResponse.json({
      query,
      results: finalResults,
      total: finalResults.length,
      types_searched: searchTypes,
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

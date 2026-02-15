import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/dynamic';

/**
 * GET /api/preferences/messaging
 * Fetch user messaging preferences
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('user_messaging_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ data: data || null });
  } catch (error) {
    console.error('Error fetching messaging preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences/messaging
 * Create or update user messaging preferences
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_messaging_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existing) {
      // Update existing preferences
      result = await supabase
        .from('user_messaging_preferences')
        .update(body)
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      // Create new preferences
      result = await supabase
        .from('user_messaging_preferences')
        .insert({
          user_id: user.id,
          ...body,
        })
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    console.error('Error saving messaging preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

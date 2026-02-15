import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAuditEvent } from '@/lib/supabase/auth-helpers';
import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { z } from 'zod';

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'member']),
});

export async function POST(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const body = await request.json();
    const { userId, role } = updateRoleSchema.parse(body);

    const supabase = await getSupabaseClient();

    // Check if user exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (existingRole) {
      // Update existing role
      const { error } = await supabase
        .from('user_roles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating role:', error);
        return NextResponse.json(
          { error: 'Failed to update role' },
          { status: 500 }
        );
      }
    } else {
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        console.error('Error inserting role:', error);
        return NextResponse.json(
          { error: 'Failed to insert role' },
          { status: 500 }
        );
      }
    }

    // Log audit event
    await logAuditEvent({
      eventType: 'admin',
      resourceType: 'user',
      resourceId: userId,
      action: 'role_change',
      oldData: { role: existingRole?.role || 'member' },
      newData: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/admin/users/role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

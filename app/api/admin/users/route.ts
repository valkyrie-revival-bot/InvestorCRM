import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const supabase = await createClient();

    // Fetch all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Fetch user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return NextResponse.json(
        { error: 'Failed to fetch user roles' },
        { status: 500 }
      );
    }

    // Map roles to users
    const roleMap = new Map(
      userRoles?.map((ur) => [ur.user_id, ur.role]) || []
    );

    const users = authUsers.users.map((user) => ({
      id: user.id,
      email: user.email,
      role: roleMap.get(user.id) || 'member',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

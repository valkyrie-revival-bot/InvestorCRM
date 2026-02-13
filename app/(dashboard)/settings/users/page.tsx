import { requireAdmin } from '@/lib/supabase/auth-helpers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { UserManagementTable } from '@/components/admin/user-management-table';
import { AppRole } from '@/types/auth';

interface UserData {
  id: string;
  email: string;
  role: AppRole;
  lastSignIn: string | null;
  createdAt: string;
}

export default async function UserManagementPage() {
  // Require admin role - redirects non-admins to /dashboard
  await requireAdmin();

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Query user_roles to get all users with their roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role, created_at');

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
  }

  const users: UserData[] = [];

  // For each user_id, get the email and last sign in from auth.users using admin client
  if (userRoles) {
    for (const userRole of userRoles) {
      try {
        // Get user data from auth.users using admin client
        const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(
          userRole.user_id
        );

        if (userError) {
          console.error('Error fetching user data:', userError);
          // Fallback: user_id only
          users.push({
            id: userRole.user_id,
            email: `User ${userRole.user_id.slice(0, 8)}`,
            role: userRole.role as AppRole,
            lastSignIn: null,
            createdAt: userRole.created_at,
          });
        } else if (userData?.user) {
          users.push({
            id: userRole.user_id,
            email: userData.user.email || 'No email',
            role: userRole.role as AppRole,
            lastSignIn: userData.user.last_sign_in_at || null,
            createdAt: userData.user.created_at || userRole.created_at,
          });
        }
      } catch (error) {
        console.error('Error in user lookup:', error);
        // Fallback: user_id only
        users.push({
          id: userRole.user_id,
          email: `User ${userRole.user_id.slice(0, 8)}`,
          role: userRole.role as AppRole,
          lastSignIn: null,
          createdAt: userRole.created_at,
        });
      }
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          User Management
        </h1>
        <p className="text-zinc-400 mb-4">
          Manage team members and roles. Admin-only access.
        </p>
        <div className="flex items-center gap-4">
          <div className="text-sm text-zinc-400">
            <span className="font-semibold text-zinc-200">
              {users.length}
            </span>{' '}
            team {users.length === 1 ? 'member' : 'members'}
          </div>
          <div className="text-sm text-zinc-500">
            New users are added automatically when they sign in with Google
            Workspace. Assign their role here.
          </div>
        </div>
      </div>

      <UserManagementTable users={users} />
    </div>
  );
}

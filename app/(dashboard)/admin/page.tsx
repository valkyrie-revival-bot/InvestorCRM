import { requireAdmin } from '@/lib/supabase/auth-helpers';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default async function AdminPage() {
  // Ensure user is admin (redirects if not)
  await requireAdmin();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <AdminDashboard />
    </div>
  );
}

import { requireAuth } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { AuditLogEntry } from '@/types/auth';
import { AuditLogTable } from '@/components/audit/audit-log-table';

export default async function AuditLogsPage() {
  // Ensure user is authenticated
  await requireAuth();

  const supabase = await createClient();

  // Query app audit log
  const { data: appLogs, error: appLogsError } = await supabase
    .from('app_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (appLogsError) {
    console.error('Error fetching app audit logs:', appLogsError);
  }

  // Transform app logs to AuditLogEntry format
  const entries: AuditLogEntry[] = (appLogs || []).map((log) => ({
    id: log.id,
    userId: log.user_id,
    userEmail: log.user_email,
    eventType: log.event_type,
    resourceType: log.resource_type,
    resourceId: log.resource_id,
    action: log.action,
    oldData: log.old_data,
    newData: log.new_data,
    metadata: log.metadata,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    createdAt: log.created_at,
  }));

  // Try to fetch Supabase auth audit logs (may not be accessible)
  try {
    const { data: authLogs } = await supabase
      .from('audit_log_entries')
      .select('created_at, payload, ip_address')
      .order('created_at', { ascending: false })
      .limit(50);

    if (authLogs && authLogs.length > 0) {
      // Merge auth logs with app logs
      const authEntries: AuditLogEntry[] = authLogs.map((log, index) => ({
        id: -1 - index, // Negative IDs to avoid collision with app logs
        userId: log.payload?.user_id || null,
        userEmail: log.payload?.email || null,
        eventType: 'auth',
        resourceType: null,
        resourceId: null,
        action: log.payload?.action || 'unknown',
        oldData: null,
        newData: log.payload || null,
        metadata: null,
        ipAddress: log.ip_address,
        userAgent: null,
        createdAt: log.created_at,
      }));

      entries.push(...authEntries);
    }
  } catch (error) {
    // Supabase auth.audit_log_entries not accessible from client
    // This is expected - auth logs are viewable in Supabase Dashboard
    console.log('Auth audit logs not accessible from client (expected)');
  }

  // Sort all entries by timestamp
  entries.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Audit Logs</h1>
        <p className="text-zinc-400">
          All system activity and data changes. Both admins and members can view
          audit logs.
        </p>
      </div>

      <AuditLogTable entries={entries} />
    </div>
  );
}

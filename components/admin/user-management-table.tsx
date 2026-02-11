'use client';

import { useState } from 'react';
import { AppRole } from '@/types/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/supabase/auth-helpers';

interface UserData {
  id: string;
  email: string;
  role: AppRole;
  lastSignIn: string | null;
  createdAt: string;
}

interface UserManagementTableProps {
  users: UserData[];
}

export function UserManagementTable({ users }: UserManagementTableProps) {
  const [localUsers, setLocalUsers] = useState(users);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handleRoleChange = async (userId: string, currentRole: AppRole) => {
    const newRole: AppRole = currentRole === 'admin' ? 'member' : 'admin';
    const confirmed = window.confirm(
      `Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`
    );

    if (!confirmed) return;

    setLoadingUserId(userId);

    try {
      const supabase = createClient();

      // Update the role in user_roles table
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setLocalUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      // Log the role change to audit log
      // Note: This is a client-side call, so it won't auto-fill user context
      // In a production app, this should be done via a Server Action
      await supabase.from('app_audit_log').insert({
        event_type: 'role_change',
        resource_type: 'user',
        resource_id: userId,
        action: 'update',
        old_data: { role: currentRole },
        new_data: { role: newRole },
        metadata: { changed_at: new Date().toISOString() },
      });

      // Show success feedback
      alert(`User role changed to ${newRole.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Error changing user role:', error);
      alert('Failed to change user role. Please try again.');
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Last Sign In</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="h-12 w-12 text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-zinc-400">No team members found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            localUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-zinc-900/50">
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                    className={
                      user.role === 'admin'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-700 text-zinc-300'
                    }
                  >
                    {user.role.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-zinc-400">
                  {formatDate(user.lastSignIn)}
                </TableCell>
                <TableCell className="text-sm text-zinc-400">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoleChange(user.id, user.role)}
                    disabled={loadingUserId === user.id}
                    className="text-xs"
                  >
                    {loadingUserId === user.id
                      ? 'Changing...'
                      : user.role === 'admin'
                      ? 'Make Member'
                      : 'Make Admin'}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

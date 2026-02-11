'use client';

import { ReactNode } from 'react';
import { useRole } from '@/lib/hooks/use-role';
import { AppRole } from '@/types/auth';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: RoleGuardProps) {
  const { role, loading } = useRole();

  // While loading, show nothing
  if (loading) {
    return null;
  }

  // If user has no role or role not in allowed list, show fallback
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  // User has permission, render children
  return <>{children}</>;
}

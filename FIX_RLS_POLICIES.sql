-- Fix infinite recursion in user_roles RLS policies
-- The policies were checking user_roles to see if user is admin,
-- which caused infinite recursion. Instead, use JWT claim via is_admin()

-- Drop existing policies
drop policy if exists "Admins can manage user roles" on public.user_roles;
drop policy if exists "Users can view all roles" on public.user_roles;

-- Recreate policies using is_admin() helper which checks JWT claim
create policy "Admins can manage user roles"
  on public.user_roles
  for all
  to authenticated
  using (public.is_admin());

-- All authenticated users can view roles (read-only for members)
create policy "Users can view all roles"
  on public.user_roles
  for select
  to authenticated
  using (true);

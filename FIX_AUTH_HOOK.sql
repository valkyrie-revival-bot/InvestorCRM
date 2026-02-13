-- Fix for Auth Hook failing with "unexpected_failure"
-- The hook needs SECURITY DEFINER to access user_roles table

-- Drop and recreate the function with SECURITY DEFINER
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer  -- This is the critical addition
set search_path = public
as $$
  declare
    claims jsonb;
    user_role public.app_role;
  begin
    -- Fetch user's role (only one role per user in this system)
    select role into user_role
    from public.user_roles
    where user_id = (event->>'user_id')::uuid
    limit 1;

    claims := event->'claims';

    if user_role is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      -- Default to member if no role assigned
      claims := jsonb_set(claims, '{user_role}', '"member"');
    end if;

    event := jsonb_set(event, '{claims}', claims);
    return event;
  end;
$$;

-- Ensure proper permissions (these should already exist, but we'll refresh them)
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- Grant SELECT on user_roles to the function owner (postgres) so the security definer works
grant select on public.user_roles to postgres;

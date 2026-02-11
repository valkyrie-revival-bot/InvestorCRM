-- Run in Supabase SQL Editor - Migration 2 of 6
-- Creates Auth Hook function to add user_role claim to JWT tokens
-- IMPORTANT: After running, configure in Supabase Dashboard:
-- Authentication > Hooks > Custom Access Token Hook
-- Schema: public | Function: custom_access_token_hook

-- Auth Hook to add role to JWT
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
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

-- Grant execute to supabase_auth_admin (required for hooks)
grant execute on function public.custom_access_token_hook to supabase_auth_admin;

-- Revoke from authenticated and public (security best practice)
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

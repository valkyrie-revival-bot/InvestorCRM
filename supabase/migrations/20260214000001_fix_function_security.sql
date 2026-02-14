-- Migration: Fix function security warnings
-- Purpose: Add SECURITY DEFINER and fixed search_path to all functions
-- This prevents "role mutable search_path" security warnings in Supabase
-- Security: Fixed search_path prevents search path injection attacks

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_stage_entry_date
CREATE OR REPLACE FUNCTION public.update_stage_entry_date()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.stage_entry_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix archive_strategy_on_update
CREATE OR REPLACE FUNCTION public.archive_strategy_on_update()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.current_strategy_notes IS DISTINCT FROM NEW.current_strategy_notes
     AND OLD.current_strategy_notes IS NOT NULL
     AND OLD.current_strategy_notes != '' THEN
    NEW.last_strategy_notes := OLD.current_strategy_notes;
    NEW.last_strategy_date := OLD.current_strategy_date;
    NEW.current_strategy_date := CURRENT_DATE;
    INSERT INTO public.strategy_history (
      investor_id, strategy_notes, strategy_date, created_by
    ) VALUES (
      OLD.id, OLD.current_strategy_notes, OLD.current_strategy_date, NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix update_google_oauth_tokens_updated_at
CREATE OR REPLACE FUNCTION update_google_oauth_tokens_updated_at()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE plpgsql STABLE
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (auth.jwt() ->> 'user_role')::text = 'admin';
END;
$$;

-- Fix is_authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean LANGUAGE plpgsql STABLE
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$;

-- Fix custom_access_token_hook
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  claims jsonb;
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role FROM public.user_roles
  WHERE user_id = (event->>'user_id')::uuid LIMIT 1;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"member"');
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Fix log_role_change
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  actor_email text;
BEGIN
  SELECT email INTO actor_email FROM auth.users WHERE id = auth.uid();

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.app_audit_log (
      user_id, user_email, event_type, resource_type,
      resource_id, action, new_data
    ) VALUES (
      auth.uid(), actor_email, 'role_change', 'user',
      NEW.user_id::text, 'assign_role',
      jsonb_build_object('role', NEW.role)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.app_audit_log (
      user_id, user_email, event_type, resource_type,
      resource_id, action, old_data, new_data
    ) VALUES (
      auth.uid(), actor_email, 'role_change', 'user',
      NEW.user_id::text, 'change_role',
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.app_audit_log (
      user_id, user_email, event_type, resource_type,
      resource_id, action, old_data
    ) VALUES (
      auth.uid(), actor_email, 'role_change', 'user',
      OLD.user_id::text, 'remove_role',
      jsonb_build_object('role', OLD.role)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

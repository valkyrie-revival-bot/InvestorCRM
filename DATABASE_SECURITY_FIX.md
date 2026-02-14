# Database Security Fix

## Issue
Supabase dashboard shows 31 database security warnings about "role mutable search_path". This occurs when PostgreSQL functions don't have a fixed `search_path`, which is a security best practice.

## Fix
Apply the migration `supabase/migrations/20260214000001_fix_function_security.sql` to add proper security configuration to all database functions.

## How to Apply

### Method 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20260214000001_fix_function_security.sql`
4. Copy all contents and paste into the SQL Editor
5. Click **Run** to execute
6. Verify: The security warnings should be resolved

### Method 2: Command Line (if you have direct database access)
```bash
psql YOUR_DATABASE_URL < supabase/migrations/20260214000001_fix_function_security.sql
```

## What This Migration Does

Adds `SECURITY DEFINER` and `SET search_path = public, pg_temp` to all database functions:

### Fixed Functions:
1. **update_updated_at_column** - Auto-updates `updated_at` timestamps
2. **update_stage_entry_date** - Tracks when investor entered current stage
3. **archive_strategy_on_update** - Auto-archives strategy changes
4. **update_google_oauth_tokens_updated_at** - Updates OAuth token timestamps
5. **is_admin** - RLS helper to check admin role
6. **is_authenticated** - RLS helper to check authentication
7. **custom_access_token_hook** - Auth hook for JWT claims
8. **log_role_change** - Audit logging for role changes

### Security Benefits:
- **Fixed search_path**: Prevents search path injection attacks
- **SECURITY DEFINER**: Functions run with consistent privileges
- **Explicit schema references**: Prevents ambiguous function calls

## Verification

After applying, check the Supabase dashboard security warnings:
- Before: ~31 warnings about "role mutable search_path"
- After: Security warnings should be resolved

## Related Files
- `supabase/migrations/20260214000001_fix_function_security.sql` - Main security fix
- `supabase/migrations/20260214000000_create_tasks_table.sql` - Tasks feature (apply this first if not done)

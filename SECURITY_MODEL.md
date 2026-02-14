# Security Model & RLS Policy Design

## Current Security Model

This CRM uses a **single-organization, team-wide access** security model where:
- All authenticated users can view/edit all records
- Data isolation is at the **authentication boundary** (must be logged in)
- No per-user or per-team data segregation within the organization

## Why RLS Policies Use `USING (true)`

The Supabase Security Advisor shows 19 warnings about "RLS Policy Always True". These are **intentional design decisions**, not security vulnerabilities:

### Tables with Permissive Policies

| Table | Policy | Reason for `USING (true)` |
|-------|--------|---------------------------|
| **investors** | UPDATE/DELETE | Required for soft delete support - must find records with `deleted_at` set |
| **contacts** | UPDATE/DELETE | Same soft delete pattern |
| **activities** | SELECT | Audit records - all team members need visibility |
| **app_audit_log** | SELECT/INSERT | Audit transparency - all users can view logs |
| **investor_relationships** | All operations | Shared relationship intelligence across team |
| **strategy_history** | SELECT/INSERT | Historical records visible to all |

### Security Boundaries That ARE Enforced

1. **Authentication Required**: All policies restrict to `authenticated` role
2. **Soft Deletes**: SELECT policies filter `deleted_at IS NULL` where applicable
3. **User-Owned Records**: OAuth tokens, calendar events restrict to `created_by = auth.uid()`

## Extension in Public Schema

**Warning**: `pg_trgm` extension in public schema

**Status**: Accepted - This extension is needed for fuzzy text search and is safe in public schema for single-organization deployments.

## When to Make Policies More Restrictive

Consider changing these policies if:

1. **Multi-Tenancy Required**: Multiple organizations using the same database
   - Add `organization_id` to all tables
   - Change policies to `organization_id = current_org_id()`

2. **Role-Based Access**: Different permission levels needed
   - Implement viewer/editor/admin roles
   - Change policies to check `is_editor()` or `is_admin()`

3. **User-Owned Records**: Some data should be private
   - Change policies to `created_by = auth.uid()`

## Migration to Multi-Tenant Model

If multi-tenancy is needed in the future:

```sql
-- 1. Add organization_id to all tables
ALTER TABLE investors ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- 2. Create organization context function
CREATE FUNCTION current_org_id() RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'organization_id')::UUID;
$$ LANGUAGE SQL STABLE;

-- 3. Update policies
DROP POLICY "Authenticated users can view non-deleted investors" ON investors;
CREATE POLICY "Users can view own org investors" ON investors
  FOR SELECT TO authenticated
  USING (organization_id = current_org_id() AND deleted_at IS NULL);
```

## Recommended Actions

### Option 1: Accept Current Model (Recommended)
- **Status**: These warnings reflect intentional design
- **Action**: Document and accept (this file)
- **Trade-off**: Security Advisor warnings remain

### Option 2: Suppress Specific Warnings
- **Action**: Mark these specific policy warnings as "Won't Fix" in Supabase dashboard
- **Note**: Requires documenting why each is intentional

### Option 3: Migrate to Multi-Tenant (Future)
- **Action**: Add organization-level isolation
- **Effort**: Significant - requires schema changes and data migration
- **Benefit**: Enables SaaS model with customer isolation

## Current Recommendation

**Keep existing policies** - They're correct for the current single-organization CRM use case. The Security Advisor warnings are **informational**, not vulnerabilities.

### Why These Aren't Security Issues:
1. ✅ Authentication is required (not open to public/anon)
2. ✅ Application-level access control exists (user roles)
3. ✅ Soft deletes are enforced where needed
4. ✅ Audit logging captures all changes
5. ✅ User-owned sensitive data (OAuth tokens) IS properly restricted

The permissive policies enable:
- Team collaboration without friction
- Shared pipeline visibility
- Warm introduction path finding across all contacts
- Transparent audit logs for compliance

---

**Last Updated**: 2026-02-14
**Security Model**: Single-Organization Team Access
**Supabase Advisor Warnings**: 19 (intentional)

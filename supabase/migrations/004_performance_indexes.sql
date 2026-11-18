-- Migration: 004_performance_indexes.sql
-- Description: Add functional indexes on lower(email) and composite index on memberships to accelerate RLS evaluation

CREATE INDEX IF NOT EXISTS idx_app_users_lower_email ON app_users(lower(email));
CREATE INDEX IF NOT EXISTS idx_employees_lower_email ON employees(lower(email));
CREATE INDEX IF NOT EXISTS idx_memberships_user_tenant ON memberships(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_active_tenant ON memberships(tenant_id, is_active);

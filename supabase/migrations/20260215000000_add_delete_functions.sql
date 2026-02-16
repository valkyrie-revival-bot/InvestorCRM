-- Soft delete function for single investor
-- Runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION soft_delete_investor(
  p_investor_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Soft delete the investor
  UPDATE investors
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_investor_id
    AND deleted_at IS NULL;

  -- Log the activity
  INSERT INTO activities (investor_id, activity_type, description, created_by)
  VALUES (p_investor_id, 'note', 'Investor soft-deleted', p_user_id);
END;
$$;

-- Bulk soft delete function for multiple investors
-- Runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION bulk_soft_delete_investors(
  p_investor_ids UUID[],
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Soft delete all investors
  UPDATE investors
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = ANY(p_investor_ids)
    AND deleted_at IS NULL;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_investor(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_soft_delete_investors(UUID[], UUID) TO authenticated;

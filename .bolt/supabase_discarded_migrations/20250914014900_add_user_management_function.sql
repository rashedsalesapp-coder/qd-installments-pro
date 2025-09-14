-- Create a function for admins to get all users with their roles and emails
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  role app_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function should only be callable by admins
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    p.full_name,
    u.email,
    ur.role
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id;
END;
$$;

-- Grant execute on the function to authenticated users
-- The security is handled inside the function itself
GRANT EXECUTE ON FUNCTION get_all_users_with_roles() TO authenticated;

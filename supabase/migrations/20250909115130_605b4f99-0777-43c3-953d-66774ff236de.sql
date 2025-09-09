-- Fix security issues from the previous migration

-- 1. Fix the view to not expose auth.users directly
DROP VIEW IF EXISTS public.user_roles_view;

-- Create a secure view that doesn't expose auth.users directly
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
    ur.user_id as id,
    ur.role,
    ur.created_at
FROM public.user_roles ur;

-- Grant permissions
GRANT SELECT ON public.user_roles_view TO authenticated;

-- 2. Fix search_path for functions
CREATE OR REPLACE FUNCTION public.setup_admin_user(user_id UUID, user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
    -- Insert into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$func$;

CREATE OR REPLACE FUNCTION public.update_user_role(
    p_user_id UUID,
    p_new_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
    -- Check if the calling user is an admin
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Only admins can update user roles';
    END IF;
    
    -- Delete existing roles for this user
    DELETE FROM public.user_roles WHERE user_id = p_user_id;
    
    -- Insert new role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, p_new_role);
END;
$func$;
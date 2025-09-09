-- Create default admin user setup and user management functions
-- Note: This will create the user in auth.users and set up the profile and role

-- First, let's create a function to handle admin user setup
-- This will be called after the admin user signs up through the UI

-- Create a function to set up admin user
CREATE OR REPLACE FUNCTION public.setup_admin_user(user_id UUID, user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    -- Insert into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$func$;

-- Create a function to update user roles
CREATE OR REPLACE FUNCTION public.update_user_role(
    p_user_id UUID,
    p_new_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create a view to get all users with their roles
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    COALESCE(ur.role, 'user'::app_role) as role
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id;

-- Grant necessary permissions
GRANT SELECT ON public.user_roles_view TO authenticated;
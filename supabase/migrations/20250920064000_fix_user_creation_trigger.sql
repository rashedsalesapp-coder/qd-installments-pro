-- Drop the existing function and trigger to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a new, more robust function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_role app_role;
BEGIN
  -- Safely insert into the profiles table.
  -- This assumes the profiles table has a structure like: id (UUID), full_name (TEXT)
  -- The user's full name is passed from the client in the `raw_user_meta_data`.
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  -- Determine the role based on the email address.
  -- This creates a predictable "emergency" admin user.
  IF NEW.email = 'admin@system.local' THEN
    new_user_role := 'admin';
  ELSE
    new_user_role := 'user';
  END IF;

  -- Insert the new user's role into the user_roles table.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, new_user_role);

  RETURN NEW;
END;
$$;

-- Re-create the trigger to execute the new function after a user is created.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

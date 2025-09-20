-- Step 1: Drop the old trigger that auto-assigns admin/staff roles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop the old function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Add 'pending' and 'approved' to the app_role enum
-- Note: We can't add values in a transaction, so we do it carefully.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending' AND enumtypid = 'public.app_role'::regtype) THEN
        ALTER TYPE public.app_role ADD VALUE 'pending' AFTER 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'approved' AND enumtypid = 'public.app_role'::regtype) THEN
        ALTER TYPE public.app_role ADD VALUE 'approved' AFTER 'pending';
    END IF;
END
$$;

-- Step 4: Create a new function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new row into user_roles with the 'pending' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$;

-- Step 5: Create a new trigger for new users
CREATE TRIGGER on_auth_user_created_pending
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_pending();

-- Step 6: Create the admin user
-- Note: This is an idempotent way to create the user.
-- If the user already exists, this will do nothing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'rashedsalesapp@gmail.com') THEN
    -- Create the user in auth.users
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'rashedsalesapp@gmail.com',
      crypt('Rashed@1977', gen_salt('bf')),
      now(),
      '',
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      NULL,
      now()
    );

    -- Assign the 'admin' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      (SELECT id FROM auth.users WHERE email = 'rashedsalesapp@gmail.com'),
      'admin'
    );
  END IF;
END;
$$;

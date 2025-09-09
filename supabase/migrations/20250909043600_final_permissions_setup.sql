-- ========= FINAL CONSOLIDATED PERMISSIONS SCRIPT =========
-- This single script sets up the entire role-based access control and data integrity system.
-- It is written to be idempotent and handle dependencies correctly.

-- Section 1: Types and Tables
-- Create the custom ENUM type for application roles first, as other tables will use it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END$$;

-- Create the profiles table that links to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT
);

-- Create the user_roles table to store the single role for each user
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user'
);

-- Section 2: Drop Existing Objects (in reverse order of dependency)
-- Drop policies first, as they depend on the function.
DROP POLICY IF EXISTS "Admins can view all user roles." ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;

-- Now drop the function that the policies depended on.
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.get_user_role(uuid); -- Dropping old helper function if it exists

-- Drop other functions and triggers to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_user_role(uuid, app_role);
DROP TRIGGER IF EXISTS on_payment_deleted ON public.payments;
DROP FUNCTION IF EXISTS public.handle_deleted_payment();
DROP TRIGGER IF EXISTS on_payment_updated ON public.payments;
DROP FUNCTION IF EXISTS public.handle_updated_payment();


-- Section 3: Create Helper Functions
-- Create the has_role function, which will be used by RLS policies.
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role app_role)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = p_role);
END;
$$;

-- Create the function to set/update a user's role.
CREATE OR REPLACE FUNCTION public.update_user_role(p_user_id UUID, p_new_role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update user roles.';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, p_new_role)
  ON CONFLICT (user_id) DO UPDATE SET role = p_new_role;
END;
$$;

-- Create the function for the new user trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'user');
  RETURN new;
END;
$$;

-- Section 4: Create RLS Policies
-- Note: Default policies for SELECT/INSERT for authenticated users are assumed to be in place or not needed for this feature.
-- We are only creating the new, stricter policies for admins.

-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles." ON public.profiles;
CREATE POLICY "Users can view all profiles." ON public.profiles FOR SELECT USING (true);

-- User Roles Table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles." ON public.user_roles;
CREATE POLICY "Users can view their own roles." ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all user roles." ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Transactions Table
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;
CREATE POLICY "Admins can delete transactions" ON public.transactions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Payments Table
DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;
CREATE POLICY "Admins can delete payments" ON public.payments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));


-- Section 5: Create Data Integrity Triggers and Constraints
-- Add ON DELETE CASCADE to the payments table's foreign key
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_transaction_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_transaction_id_fkey
  FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;

-- Trigger function for when a payment is DELETED
CREATE OR REPLACE FUNCTION public.handle_deleted_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.transactions
  SET remaining_balance = remaining_balance + OLD.amount,
      status = CASE WHEN status = 'completed' THEN 'active' ELSE status END
  WHERE id = OLD.transaction_id;
  RETURN OLD;
END;
$$;

-- Trigger function for when a payment is UPDATED
CREATE OR REPLACE FUNCTION public.handle_updated_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  amount_difference REAL;
BEGIN
  amount_difference := OLD.amount - NEW.amount;
  UPDATE public.transactions
  SET remaining_balance = remaining_balance + amount_difference,
      status = CASE WHEN (remaining_balance + amount_difference) <= 0 THEN 'completed' ELSE 'active' END
  WHERE id = NEW.transaction_id;
  RETURN NEW;
END;
$$;

-- Section 6: Apply Triggers and Grant Permissions
-- Apply the new user trigger
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Apply the payment integrity triggers
CREATE TRIGGER on_payment_deleted AFTER DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_payment();
CREATE TRIGGER on_payment_updated AFTER UPDATE OF amount ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_payment();

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, app_role) TO authenticated;

/*
  # Auto-assign admin role to emergency admin

  1. Function to auto-assign admin role to emergency admin email
  2. Trigger to execute after user signup
*/

-- Function to handle new user signup and assign admin role to emergency admin
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- If this is the emergency admin email, upgrade to admin
  IF NEW.email = 'admin@system.local' THEN
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- Enable RLS on user_roles if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own roles
CREATE POLICY IF NOT EXISTS "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow system to insert roles
CREATE POLICY IF NOT EXISTS "System can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (true);

-- Create policy to allow admins to manage all roles
CREATE POLICY IF NOT EXISTS "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
-- This migration script fixes the Row Level Security policies to allow users to view data
-- while maintaining appropriate restrictions on modifications.

-- RLS policies for the 'customers' table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE POLICY "Customers: Allow SELECT for all users"
ON public.customers FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'user') OR
  public.has_role(auth.uid(), 'pending')
);

CREATE OR REPLACE POLICY "Customers: Allow INSERT for admins and staff"
ON public.customers FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff')
);

CREATE OR REPLACE POLICY "Customers: Allow UPDATE for admins and staff"
ON public.customers FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff')
);

CREATE OR REPLACE POLICY "Customers: Allow DELETE for admins"
ON public.customers FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
);


-- RLS policies for the 'transactions' table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE POLICY "Transactions: Allow SELECT for all users"
ON public.transactions FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'user') OR
  public.has_role(auth.uid(), 'pending')
);

CREATE OR REPLACE POLICY "Transactions: Allow INSERT for admins and staff"
ON public.transactions FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff')
);

CREATE OR REPLACE POLICY "Transactions: Allow UPDATE for admins and staff"
ON public.transactions FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff')
);

CREATE OR REPLACE POLICY "Transactions: Allow DELETE for admins"
ON public.transactions FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
);


-- RLS policies for the 'payments' table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE POLICY "Payments: Allow SELECT for all users"
ON public.payments FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'user') OR
  public.has_role(auth.uid(), 'pending')
);

CREATE OR REPLACE POLICY "Payments: Allow INSERT for all users"
ON public.payments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff') OR
  public.has_role(auth.uid(), 'user')
);

CREATE OR REPLACE POLICY "Payments: Allow UPDATE for admins and staff"
ON public.payments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff')
);

CREATE OR REPLACE POLICY "Payments: Allow DELETE for admins"
ON public.payments FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
);

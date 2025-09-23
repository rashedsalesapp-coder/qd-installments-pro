-- =================================================================
-- MASTER DATABASE FIX SCRIPT (v2)
-- INSTRUCTIONS: Please copy the entire content of this file and
-- run it in your Supabase project's SQL Editor. This script
-- uses a more compatible syntax to avoid errors.
-- =================================================================

-- 1. Fix Row Level Security (RLS) Policies (to make data visible)
-- =================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers: Allow SELECT for all users" ON public.customers;
CREATE POLICY "Customers: Allow SELECT for all users" ON public.customers FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'pending'));
DROP POLICY IF EXISTS "Customers: Allow INSERT for admins and staff" ON public.customers;
CREATE POLICY "Customers: Allow INSERT for admins and staff" ON public.customers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Customers: Allow UPDATE for admins and staff" ON public.customers;
CREATE POLICY "Customers: Allow UPDATE for admins and staff" ON public.customers FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Customers: Allow DELETE for admins" ON public.customers;
CREATE POLICY "Customers: Allow DELETE for admins" ON public.customers FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Transactions: Allow SELECT for all users" ON public.transactions;
CREATE POLICY "Transactions: Allow SELECT for all users" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'pending'));
DROP POLICY IF EXISTS "Transactions: Allow INSERT for admins and staff" ON public.transactions;
CREATE POLICY "Transactions: Allow INSERT for admins and staff" ON public.transactions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Transactions: Allow UPDATE for admins and staff" ON public.transactions;
CREATE POLICY "Transactions: Allow UPDATE for admins and staff" ON public.transactions FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Transactions: Allow DELETE for admins" ON public.transactions;
CREATE POLICY "Transactions: Allow DELETE for admins" ON public.transactions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payments: Allow SELECT for all users" ON public.payments;
CREATE POLICY "Payments: Allow SELECT for all users" ON public.payments FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'pending'));
DROP POLICY IF EXISTS "Payments: Allow INSERT for all users" ON public.payments;
CREATE POLICY "Payments: Allow INSERT for all users" ON public.payments FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'user'));
DROP POLICY IF EXISTS "Payments: Allow UPDATE for admins and staff" ON public.payments;
CREATE POLICY "Payments: Allow UPDATE for admins and staff" ON public.payments FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Payments: Allow DELETE for admins" ON public.payments;
CREATE POLICY "Payments: Allow DELETE for admins" ON public.payments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));


-- 2. Add Foreign Keys to AI Tables (to fix dashboard errors)
-- =================================================================
ALTER TABLE public.payment_predictions DROP CONSTRAINT IF EXISTS payment_predictions_customer_id_fkey;
ALTER TABLE public.payment_predictions ADD CONSTRAINT payment_predictions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.payment_predictions DROP CONSTRAINT IF EXISTS payment_predictions_transaction_id_fkey;
ALTER TABLE public.payment_predictions ADD CONSTRAINT payment_predictions_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;
ALTER TABLE public.customer_risk_scores DROP CONSTRAINT IF EXISTS customer_risk_scores_customer_id_fkey;
ALTER TABLE public.customer_risk_scores ADD CONSTRAINT customer_risk_scores_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


-- 3. Relax Transaction Constraints (to allow importing old data)
-- =================================================================
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS positive_amounts;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS valid_installments;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_non_negative_amounts_check;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_non_negative_installments_check;

ALTER TABLE public.transactions ADD CONSTRAINT transactions_non_negative_amounts_check CHECK (amount >= 0 AND installment_amount >= 0 AND cost_price >= 0);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_non_negative_installments_check CHECK (number_of_installments >= 0);


-- 4. Alter Payments Table (to allow importing old payments)
-- =================================================================
ALTER TABLE public.payments ALTER COLUMN balance_before DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN balance_after DROP NOT NULL;


-- 5. Update Dashboard Function (to fix revenue calculation)
-- =================================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
 DECLARE stats JSON;
 BEGIN
     IF NOT public.is_authorized_user(auth.uid()) THEN
         RAISE EXCEPTION 'User is not authorized to view dashboard stats.';
     END IF;
     SELECT json_build_object(
         'totalCustomers', (SELECT COUNT(*) FROM public.customers),
         'totalActiveTransactions', (SELECT COUNT(*) FROM public.transactions WHERE "remainingBalance" > 0),
         'totalRevenue', (SELECT COALESCE(SUM(amount), 0) FROM public.payments),
         'totalOutstanding', (SELECT COALESCE(SUM("remainingBalance"), 0) FROM public.transactions),
         'totalOverdue', (SELECT COALESCE(SUM("overdueAmount"), 0) FROM public.transactions),
         'overdueTransactions', (SELECT COUNT(*) FROM public.transactions WHERE "overdueAmount" > 0)
     ) INTO stats;
     RETURN stats;
 END;
 $function$;


-- 6. Relax Payment Constraint (to allow importing zero-value payments)
-- =================================================================
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS positive_payment;
ALTER TABLE public.payments ADD CONSTRAINT non_negative_payment CHECK (amount >= 0);

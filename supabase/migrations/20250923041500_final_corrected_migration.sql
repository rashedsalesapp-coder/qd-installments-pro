-- =================================================================
-- FINAL CONSOLIDATED MIGRATION (from Supabase AI Assistant)
-- This single migration applies all necessary fixes to the database
-- using best practices for security and performance.
-- =================================================================

BEGIN;

-- Part 1: Fix Incompatible Data Types in AI Tables
-- =================================================================
ALTER TABLE public.payment_predictions ALTER COLUMN customer_id TYPE text USING customer_id::text;
ALTER TABLE public.customer_risk_scores ALTER COLUMN customer_id TYPE text USING customer_id::text;


-- Part 2: Add Foreign Keys and Performance Indexes
-- =================================================================
ALTER TABLE public.payment_predictions DROP CONSTRAINT IF EXISTS payment_predictions_customer_id_fkey;
ALTER TABLE public.payment_predictions ADD CONSTRAINT payment_predictions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.payment_predictions DROP CONSTRAINT IF EXISTS payment_predictions_transaction_id_fkey;
ALTER TABLE public.payment_predictions ADD CONSTRAINT payment_predictions_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;

ALTER TABLE public.customer_risk_scores DROP CONSTRAINT IF EXISTS customer_risk_scores_customer_id_fkey;
ALTER TABLE public.customer_risk_scores ADD CONSTRAINT customer_risk_scores_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payment_predictions_customer_id ON public.payment_predictions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_predictions_transaction_id ON public.payment_predictions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_customer_risk_scores_customer_id ON public.customer_risk_scores(customer_id);


-- Part 3: RLS Policies (Safer and More Explicit)
-- =================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers: Allow SELECT for roles" ON public.customers;
CREATE POLICY "Customers: Allow SELECT for roles" ON public.customers FOR SELECT TO authenticated USING ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') OR public.has_role((SELECT auth.uid()), 'user') OR public.has_role((SELECT auth.uid()), 'pending') );
DROP POLICY IF EXISTS "Customers: Allow INSERT for admins and staff" ON public.customers;
CREATE POLICY "Customers: Allow INSERT for admins and staff" ON public.customers FOR INSERT TO authenticated WITH CHECK ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') );
DROP POLICY IF EXISTS "Customers: Allow UPDATE for admins and staff" ON public.customers;
CREATE POLICY "Customers: Allow UPDATE for admins and staff" ON public.customers FOR UPDATE TO authenticated USING ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') ) WITH CHECK ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') );
DROP POLICY IF EXISTS "Customers: Allow DELETE for admins" ON public.customers;
CREATE POLICY "Customers: Allow DELETE for admins" ON public.customers FOR DELETE TO authenticated USING ( public.has_role((SELECT auth.uid()), 'admin') );

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Transactions: Allow SELECT for roles" ON public.transactions;
CREATE POLICY "Transactions: Allow SELECT for roles" ON public.transactions FOR SELECT TO authenticated USING ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') OR public.has_role((SELECT auth.uid()), 'user') OR public.has_role((SELECT auth.uid()), 'pending') );
DROP POLICY IF EXISTS "Transactions: Allow INSERT for admins and staff" ON public.transactions;
CREATE POLICY "Transactions: Allow INSERT for admins and staff" ON public.transactions FOR INSERT TO authenticated WITH CHECK ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') );
DROP POLICY IF EXISTS "Transactions: Allow UPDATE for admins and staff" ON public.transactions;
CREATE POLICY "Transactions: Allow UPDATE for admins and staff" ON public.transactions FOR UPDATE TO authenticated USING ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') ) WITH CHECK ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') );
DROP POLICY IF EXISTS "Transactions: Allow DELETE for admins" ON public.transactions;
CREATE POLICY "Transactions: Allow DELETE for admins" ON public.transactions FOR DELETE TO authenticated USING ( public.has_role((SELECT auth.uid()), 'admin') );

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payments: Allow SELECT for roles" ON public.payments;
CREATE POLICY "Payments: Allow SELECT for roles" ON public.payments FOR SELECT TO authenticated USING ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') OR public.has_role((SELECT auth.uid()), 'user') OR public.has_role((SELECT auth.uid()), 'pending') );
DROP POLICY IF EXISTS "Payments: Allow INSERT for roles" ON public.payments;
CREATE POLICY "Payments: Allow INSERT for roles" ON public.payments FOR INSERT TO authenticated WITH CHECK ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') OR public.has_role((SELECT auth.uid()), 'user') );
DROP POLICY IF EXISTS "Payments: Allow UPDATE for admins and staff" ON public.payments;
CREATE POLICY "Payments: Allow UPDATE for admins and staff" ON public.payments FOR UPDATE TO authenticated USING ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') ) WITH CHECK ( public.has_role((SELECT auth.uid()), 'admin') OR public.has_role((SELECT auth.uid()), 'staff') );
DROP POLICY IF EXISTS "Payments: Allow DELETE for admins" ON public.payments;
CREATE POLICY "Payments: Allow DELETE for admins" ON public.payments FOR DELETE TO authenticated USING ( public.has_role((SELECT auth.uid()), 'admin') );


-- Part 4: Relax Transaction Constraints (NULL-tolerant)
-- =================================================================
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS positive_amounts;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS valid_installments;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_non_negative_amounts_check;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_non_negative_installments_check;

ALTER TABLE public.transactions ADD CONSTRAINT transactions_non_negative_amounts_check CHECK ( (amount IS NULL OR amount >= 0) AND (installment_amount IS NULL OR installment_amount >= 0) AND (cost_price IS NULL OR cost_price >= 0) );
ALTER TABLE public.transactions ADD CONSTRAINT transactions_non_negative_installments_check CHECK ( (number_of_installments IS NULL OR number_of_installments >= 0) );


-- Part 5: Alter Payments Table (to allow NULLs for balances)
-- =================================================================
ALTER TABLE public.payments ALTER COLUMN balance_before DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN balance_after DROP NOT NULL;


-- Part 6: Update Dashboard Function (Safer and Corrected)
-- =================================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    stats JSON;
BEGIN
    IF NOT public.is_authorized_user((SELECT auth.uid())) THEN
        RAISE EXCEPTION 'User is not authorized to view dashboard stats.';
    END IF;

    SELECT json_build_object(
        'totalCustomers', (SELECT COUNT(*) FROM public.customers),
        'totalActiveTransactions', (SELECT COUNT(*) FROM public.transactions WHERE (remaining_balance IS NOT NULL AND remaining_balance > 0)),
        'totalRevenue', (SELECT COALESCE(SUM(amount), 0) FROM public.payments),
        'totalOutstanding', (SELECT COALESCE(SUM(remaining_balance), 0) FROM public.transactions),
        'totalOverdue', (SELECT COALESCE(SUM(overdue_amount), 0) FROM public.transactions),
        'overdueTransactions', (SELECT COUNT(*) FROM public.transactions WHERE (overdue_amount IS NOT NULL AND overdue_amount > 0))
    ) INTO stats;

    RETURN stats;
END;
$$;


-- Part 7: Relax Payment Constraint (NULL-tolerant)
-- =================================================================
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS positive_payment;
ALTER TABLE public.payments ADD CONSTRAINT non_negative_payment CHECK ( (amount IS NULL OR amount >= 0) );


-- Part 8: Recommended Indexes for Performance
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_remaining_balance ON public.transactions(remaining_balance);
CREATE INDEX IF NOT EXISTS idx_transactions_overdue_amount ON public.transactions(overdue_amount);

COMMIT;

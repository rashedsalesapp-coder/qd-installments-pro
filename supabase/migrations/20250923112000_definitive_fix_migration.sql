-- =================================================================
-- DEFINITIVE CONSOLIDATED MIGRATION
-- This migration incorporates all fixes and best-practice
-- recommendations from the Supabase AI assistant.
-- This should be the final migration to fix all outstanding issues.
-- =================================================================

BEGIN;

-- Part 1: Add Missing Columns to Transactions Table
-- This was the root cause of the dashboard function errors.
-- =================================================================
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS overdue_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overdue_installments INTEGER DEFAULT 0;


-- Part 2: Fix Incompatible Data Types in AI Tables
-- =================================================================
ALTER TABLE public.payment_predictions ALTER COLUMN customer_id TYPE text USING customer_id::text;
ALTER TABLE public.customer_risk_scores ALTER COLUMN customer_id TYPE text USING customer_id::text;


-- Part 3: Add Foreign Keys and Performance Indexes
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


-- Part 4: RLS Policies (Safer and More Explicit)
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


-- Part 5: Relax Transaction Constraints (NULL-tolerant)
-- =================================================================
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS positive_amounts;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS valid_installments;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_non_negative_amounts_check;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_non_negative_installments_check;

ALTER TABLE public.transactions ADD CONSTRAINT transactions_non_negative_amounts_check CHECK ( (amount IS NULL OR amount >= 0) AND (installment_amount IS NULL OR installment_amount >= 0) AND (cost_price IS NULL OR cost_price >= 0) );
ALTER TABLE public.transactions ADD CONSTRAINT transactions_non_negative_installments_check CHECK ( (number_of_installments IS NULL OR number_of_installments >= 0) );


-- Part 6: Alter Payments Table (to allow NULLs for balances)
-- =================================================================
ALTER TABLE public.payments ALTER COLUMN balance_before DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN balance_after DROP NOT NULL;


-- Part 7: Drop and Recreate Database Functions (Safer and Corrected)
-- =================================================================
DROP FUNCTION IF EXISTS public.get_dashboard_stats();
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(total_customers bigint, total_active_transactions bigint, total_revenue numeric, total_outstanding numeric, total_overdue numeric, overdue_transactions bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_authorized_user((SELECT auth.uid())) THEN
        RAISE EXCEPTION 'User is not authorized to view dashboard stats.';
    END IF;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.customers)::bigint as total_customers,
        (SELECT COUNT(*) FROM public.transactions WHERE (remaining_balance IS NOT NULL AND remaining_balance > 0))::bigint as total_active_transactions,
        (SELECT COALESCE(SUM(amount), 0) FROM public.payments) as total_revenue,
        (SELECT COALESCE(SUM(remaining_balance), 0) FROM public.transactions) as total_outstanding,
        (SELECT COALESCE(SUM(overdue_amount), 0) FROM public.transactions) as total_overdue,
        (SELECT COUNT(*) FROM public.transactions WHERE (overdue_amount IS NOT NULL AND overdue_amount > 0))::bigint as overdue_transactions;
END;
$$;

DROP FUNCTION IF EXISTS public.check_overdue_transactions();
CREATE OR REPLACE FUNCTION public.check_overdue_transactions()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    t RECORD;
    updates INT := 0;
    today DATE := CURRENT_DATE;
    months_passed INT;
    paid_installments INT;
    expected_paid_installments INT;
    overdue_installments_calc INT;
    overdue_amount_calc NUMERIC;
BEGIN
    IF NOT public.is_authorized_user((SELECT auth.uid())) THEN
        RAISE EXCEPTION 'User is not authorized to check overdue transactions.';
    END IF;

    FOR t IN
        SELECT * FROM public.transactions WHERE remaining_balance > 0 AND (has_legal_case IS NULL OR has_legal_case = false)
    LOOP
        months_passed := (EXTRACT(YEAR FROM today) - EXTRACT(YEAR FROM t.start_date)) * 12 +
                         (EXTRACT(MONTH FROM today) - EXTRACT(MONTH FROM t.start_date));

        IF months_passed >= 0 THEN
            paid_installments := floor(t.amount_paid / t.installment_amount);
            expected_paid_installments := months_passed + 1;
            overdue_installments_calc := expected_paid_installments - paid_installments;

            IF overdue_installments_calc > 0 THEN
                overdue_amount_calc := overdue_installments_calc * t.installment_amount;
                IF t.overdue_installments != overdue_installments_calc OR t.overdue_amount != overdue_amount_calc THEN
                    UPDATE public.transactions
                    SET overdue_installments = overdue_installments_calc, overdue_amount = overdue_amount_calc
                    WHERE id = t.id;
                    updates := updates + 1;
                END IF;
            END IF;
        END IF;
    END LOOP;

    RETURN 'Overdue status checked. ' || updates || ' transactions updated.';
END;
$$;


-- Part 8: Relax Payment Constraint (NULL-tolerant and Idempotent)
-- =================================================================
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS positive_payment;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS non_negative_payment;
ALTER TABLE public.payments ADD CONSTRAINT non_negative_payment CHECK ( (amount IS NULL OR amount >= 0) );


-- Part 9: Recommended Indexes for Performance
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_remaining_balance ON public.transactions(remaining_balance);
CREATE INDEX IF NOT EXISTS idx_transactions_overdue_amount ON public.transactions(overdue_amount);

COMMIT;

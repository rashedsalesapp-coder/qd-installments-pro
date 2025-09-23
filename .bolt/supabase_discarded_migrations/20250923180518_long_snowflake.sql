/*
  # Fix overdue columns and dashboard functions

  1. Database Schema Updates
    - Add `overdue_amount` (NUMERIC) column to transactions table
    - Add `overdue_installments` (INTEGER) column to transactions table

  2. Function Updates
    - Fix `get_dashboard_stats` function to use correct column names and new overdue columns
    - Fix `check_overdue_transactions` function to use correct column names and logic
    - Ensure all functions use snake_case column names matching the actual database schema

  3. Security
    - Maintain existing RLS policies and security functions
    - Ensure proper authorization checks in dashboard functions
*/

-- Add missing overdue columns to transactions table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'overdue_amount'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN overdue_amount NUMERIC(10,3) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'overdue_installments'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN overdue_installments INTEGER DEFAULT 0;
    END IF;
END $$;

-- Fix the get_dashboard_stats function with correct column names
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
    total_customers BIGINT,
    total_active_transactions BIGINT,
    total_revenue NUMERIC,
    total_cost NUMERIC,
    total_profit NUMERIC,
    total_outstanding NUMERIC,
    total_overdue NUMERIC,
    overdue_transactions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_authorized_user(auth.uid()) THEN
        RAISE EXCEPTION 'User is not authorized to view dashboard stats.';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.customers)::BIGINT as total_customers,
        (SELECT COUNT(*) FROM public.transactions WHERE remaining_balance > 0)::BIGINT as total_active_transactions,
        (SELECT COALESCE(SUM(amount), 0) FROM public.transactions) as total_revenue,
        (SELECT COALESCE(SUM(cost_price), 0) FROM public.transactions) as total_cost,
        (SELECT COALESCE(SUM(profit), 0) FROM public.transactions) as total_profit,
        (SELECT COALESCE(SUM(remaining_balance), 0) FROM public.transactions) as total_outstanding,
        (SELECT COALESCE(SUM(overdue_amount), 0) FROM public.transactions) as total_overdue,
        (SELECT COUNT(*) FROM public.transactions WHERE overdue_amount > 0)::BIGINT as overdue_transactions;
END;
$$;

-- Fix the check_overdue_transactions function with correct column names and logic
CREATE OR REPLACE FUNCTION public.check_overdue_transactions()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    t RECORD;
    updates INT := 0;
    today DATE := CURRENT_DATE;
    months_passed INT;
    paid_amount NUMERIC;
    expected_paid_installments INT;
    overdue_installments_count INT;
    calculated_overdue_amount NUMERIC;
BEGIN
    IF NOT public.is_authorized_user(auth.uid()) THEN
        RAISE EXCEPTION 'User is not authorized to check overdue transactions.';
    END IF;

    FOR t IN
        SELECT * FROM public.transactions 
        WHERE remaining_balance > 0 AND has_legal_case = false
    LOOP
        -- Calculate months passed since start date
        months_passed := (EXTRACT(YEAR FROM today) - EXTRACT(YEAR FROM t.start_date)) * 12 +
                         (EXTRACT(MONTH FROM today) - EXTRACT(MONTH FROM t.start_date));

        IF months_passed >= 0 THEN
            -- Calculate how much has been paid
            paid_amount := t.amount - t.remaining_balance;
            
            -- Calculate expected installments paid by now
            expected_paid_installments := months_passed + 1;
            
            -- Calculate actual installments paid
            -- Calculate overdue installments
            overdue_installments_count := GREATEST(0, 
                expected_paid_installments - FLOOR(paid_amount / t.installment_amount)::INT
            );

            -- Calculate overdue amount
            calculated_overdue_amount := overdue_installments_count * t.installment_amount;

            -- Update if values have changed
            IF t.overdue_installments IS DISTINCT FROM overdue_installments_count 
               OR t.overdue_amount IS DISTINCT FROM calculated_overdue_amount THEN
                UPDATE public.transactions
                SET 
                    overdue_installments = overdue_installments_count, 
                    overdue_amount = calculated_overdue_amount
                WHERE id = t.id;
                updates := updates + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN 'Overdue status checked. ' || updates || ' transactions updated.';
END;
$$;
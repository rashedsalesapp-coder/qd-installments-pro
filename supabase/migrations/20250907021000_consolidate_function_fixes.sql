-- ========= CONSOLIDATED FIX SCRIPT =========
-- This single file contains the final, correct versions of all database functions
-- modified during the session, ensuring the codebase is clean and idempotent.

-- 1. Drop all potentially conflicting or outdated functions
DROP FUNCTION IF EXISTS public.record_payment(uuid, real); -- Fixes the ambiguity error
DROP FUNCTION IF EXISTS public.record_payment(uuid, numeric, date);
DROP FUNCTION IF EXISTS public.get_dashboard_stats();
DROP FUNCTION IF EXISTS public.check_overdue_transactions();
DROP FUNCTION IF EXISTS public.search_transactions(TEXT);

-- 2. Create the final, correct version of record_payment
CREATE OR REPLACE FUNCTION public.record_payment(p_transaction_id uuid, p_amount numeric, p_payment_date date DEFAULT CURRENT_DATE)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    v_customer_id UUID;
    v_balance_before DECIMAL;
    v_balance_after DECIMAL;
BEGIN
    SELECT customer_id, remaining_balance
    INTO v_customer_id, v_balance_before
    FROM transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    v_balance_after := v_balance_before - p_amount;

    IF v_balance_after < 0 THEN
        RAISE EXCEPTION 'Payment amount exceeds remaining balance';
    END IF;

    INSERT INTO payments (transaction_id, customer_id, amount, payment_date, balance_before, balance_after)
    VALUES (p_transaction_id, v_customer_id, p_amount, p_payment_date, v_balance_before, v_balance_after);

    UPDATE transactions
    SET remaining_balance = v_balance_after,
        status = CASE WHEN v_balance_after <= 0 THEN 'completed' ELSE status END
    WHERE id = p_transaction_id;
END;
$function$;

-- 3. Create the final, correct version of get_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_customers', (SELECT COUNT(*) FROM public.customers),
        'total_active_transactions', (SELECT COUNT(*) FROM public.transactions WHERE "remaining_balance" > 0),
        'total_revenue', (SELECT COALESCE(SUM("amount"), 0) FROM public.transactions),
        'total_profit', (SELECT COALESCE(SUM("profit"), 0) FROM public.transactions),
        'total_outstanding', (SELECT COALESCE(SUM("remaining_balance"), 0) FROM public.transactions),
        'total_overdue', (SELECT COALESCE(SUM("remaining_balance"), 0) FROM public.transactions WHERE status = 'overdue'),
        'overdue_transactions', (SELECT COUNT(*) FROM public.transactions WHERE status = 'overdue')
    ) INTO stats;
    RETURN stats;
END;
$function$;

-- 4. Create the final, correct version of check_overdue_transactions
CREATE OR REPLACE FUNCTION public.check_overdue_transactions()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    t RECORD;
    updates INT := 0;
    today DATE := CURRENT_DATE;
    months_passed INT;
    paid_installments INT;
    expected_paid_installments INT;
    overdue_installments INT;
BEGIN
    FOR t IN
        SELECT * FROM public.transactions WHERE "remaining_balance" > 0 AND "has_legal_case" = false AND "start_date" IS NOT NULL AND "installment_amount" > 0
    LOOP
        months_passed := (EXTRACT(YEAR FROM today) - EXTRACT(YEAR FROM t."start_date")) * 12 +
                         (EXTRACT(MONTH FROM today) - EXTRACT(MONTH FROM t."start_date"));
        IF months_passed >= 0 THEN
            paid_installments := floor( (t.amount - t.remaining_balance) / t.installment_amount );
            expected_paid_installments := months_passed + 1;
            IF expected_paid_installments > t.number_of_installments THEN
                expected_paid_installments := t.number_of_installments;
            END IF;
            overdue_installments := expected_paid_installments - paid_installments;
            IF overdue_installments > 0 THEN
                UPDATE public.transactions SET status = 'overdue' WHERE id = t.id AND status != 'overdue';
                updates := updates + 1;
            ELSIF t.status = 'overdue' AND overdue_installments <= 0 THEN
                 UPDATE public.transactions SET status = 'active' WHERE id = t.id;
            END IF;
        END IF;
    END LOOP;
    RETURN 'Overdue status checked. ' || updates || ' transactions updated.';
END;
$function$;

-- 5. Create the final, correct version of search_transactions
CREATE OR REPLACE FUNCTION public.search_transactions(p_search_term TEXT)
RETURNS TABLE (id uuid, sequence_number text, customer_id text, amount numeric, installment_amount numeric, remaining_balance numeric, status text, created_at timestamptz, customer jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_search_term = '' THEN
        RETURN QUERY SELECT t.id, t.sequence_number, t.customer_id::text, t.amount, t.installment_amount, t.remaining_balance, t.status, t.created_at, jsonb_build_object('id', c.id, 'full_name', c.full_name) as customer FROM public.transactions t JOIN public.customers c ON t.customer_id = c.id WHERE t.status != 'completed' ORDER BY t.created_at DESC LIMIT 10;
    ELSE
        RETURN QUERY SELECT t.id, t.sequence_number, t.customer_id::text, t.amount, t.installment_amount, t.remaining_balance, t.status, t.created_at, jsonb_build_object('id', c.id, 'full_name', c.full_name) as customer FROM public.transactions t JOIN public.customers c ON t.customer_id = c.id WHERE t.status != 'completed' AND (c.full_name ILIKE '%' || p_search_term || '%' OR c.mobile_number ILIKE '%' || p_search_term || '%' OR c.civil_id ILIKE '%' || p_search_term || '%' OR t.sequence_number ILIKE '%' || p_search_term || '%') ORDER BY t.created_at DESC LIMIT 10;
    END IF;
END;
$$;

-- 6. Grant permissions for all functions
GRANT EXECUTE ON FUNCTION public.record_payment(uuid, numeric, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_overdue_transactions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_transactions(TEXT) TO authenticated;

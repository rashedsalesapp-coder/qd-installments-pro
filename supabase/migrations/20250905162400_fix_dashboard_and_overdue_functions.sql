-- 1. Fix the get_dashboard_stats function to use snake_case keys for JSON.
-- 2. Re-apply the corrected logic for check_overdue_transactions to fix the integer/interval division error.

-- Fix get_dashboard_stats function
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

-- Fix check_overdue_transactions function
-- This version avoids the integer/interval division error and uses a more robust logic.
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
    overdue_amount REAL;
BEGIN
    FOR t IN
        SELECT * FROM public.transactions WHERE "remaining_balance" > 0 AND "has_legal_case" = false AND "start_date" IS NOT NULL AND "installment_amount" > 0
    LOOP
        -- Calculate months passed since the start date
        months_passed := (EXTRACT(YEAR FROM today) - EXTRACT(YEAR FROM t."start_date")) * 12 +
                         (EXTRACT(MONTH FROM today) - EXTRACT(MONTH FROM t."start_date"));

        IF months_passed >= 0 THEN
            -- Calculate how many installments should have been paid by now
            paid_installments := floor( (t.amount - t.remaining_balance) / t.installment_amount );

            -- Expected installments is the number of months passed + 1 (for the first month)
            expected_paid_installments := months_passed + 1;

            -- If expected is more than total, cap it at total
            IF expected_paid_installments > t.number_of_installments THEN
                expected_paid_installments := t.number_of_installments;
            END IF;

            overdue_installments := expected_paid_installments - paid_installments;

            IF overdue_installments > 0 THEN
                -- There is an overdue amount
                overdue_amount := overdue_installments * t."installment_amount";

                -- Update the transaction status to 'overdue'
                UPDATE public.transactions
                SET status = 'overdue'
                WHERE id = t.id AND status != 'overdue';

                updates := updates + 1;
            ELSIF t.status = 'overdue' AND overdue_installments <= 0 THEN
                 -- If it was overdue but is now caught up, set it back to active
                 UPDATE public.transactions
                 SET status = 'active'
                 WHERE id = t.id;
            END IF;
        END IF;
    END LOOP;

    RETURN 'Overdue status checked. ' || updates || ' transactions updated.';
END;
$function$;

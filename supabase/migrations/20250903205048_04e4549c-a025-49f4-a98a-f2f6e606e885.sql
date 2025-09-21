-- Fix search_path security issues for existing database functions

-- Fix record_payment function
CREATE OR REPLACE FUNCTION public.record_payment(p_transaction_id uuid, p_amount real)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    current_paid REAL;
    current_remaining REAL;
BEGIN
    -- Lock the transaction row for update
    PERFORM * FROM public.transactions WHERE id = p_transaction_id FOR UPDATE;

    -- Get current values from the transaction
    SELECT
        amountPaid,
        remainingBalance
    INTO
        current_paid,
        current_remaining
    FROM
        public.transactions
    WHERE
        id = p_transaction_id;

    -- Insert the new payment
    INSERT INTO public.payments (transactionId, amount)
    VALUES (p_transaction_id, p_amount);

    -- Update the transaction
    UPDATE public.transactions
    SET
        amountPaid = current_paid + p_amount,
        remainingBalance = current_remaining - p_amount
    WHERE
        id = p_transaction_id;
END;
$function$;

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
        'total_active_transactions', (SELECT COUNT(*) FROM public.transactions WHERE remaining_balance > 0),
        'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM public.transactions),
        'total_cost', (SELECT COALESCE(SUM(cost_price), 0) FROM public.transactions),
        'total_profit', (SELECT COALESCE(SUM(profit), 0) FROM public.transactions),
        'total_outstanding', (SELECT COALESCE(SUM(remaining_balance), 0) FROM public.transactions),
        'total_overdue', (SELECT COALESCE(SUM(remaining_balance), 0) FROM public.transactions WHERE status = 'overdue'),
        'overdue_transactions', (SELECT COUNT(*) FROM public.transactions WHERE status = 'overdue')
    ) INTO stats;

    RETURN stats;
END;
$function$;

-- Fix check_overdue_transactions function
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
        SELECT * FROM public.transactions WHERE "remainingBalance" > 0 AND "legalCase" = false
    LOOP
        months_passed := (EXTRACT(YEAR FROM today) - EXTRACT(YEAR FROM t."firstInstallmentDate")) * 12 +
                         (EXTRACT(MONTH FROM today) - EXTRACT(MONTH FROM t."firstInstallmentDate"));

        IF months_passed >= 0 THEN
            paid_installments := floor(t."amountPaid" / t."installmentAmount");
            expected_paid_installments := months_passed + 1;
            overdue_installments := expected_paid_installments - paid_installments;

            IF overdue_installments > 0 THEN
                overdue_amount := overdue_installments * t."installmentAmount";
                IF t."overdueInstallments" != overdue_installments OR t."overdueAmount" != overdue_amount THEN
                    UPDATE public.transactions
                    SET "overdueInstallments" = overdue_installments, "overdueAmount" = overdue_amount
                    WHERE id = t.id;
                    updates := updates + 1;
                END IF;
            END IF;
        END IF;
    END LOOP;

    RETURN 'Overdue status checked. ' || updates || ' transactions updated.';
END;
$function$;
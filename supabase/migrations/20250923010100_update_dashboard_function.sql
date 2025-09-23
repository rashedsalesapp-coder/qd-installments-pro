-- This migration updates the get_dashboard_stats function to calculate
-- 'totalRevenue' as the sum of all payments, which aligns with the
-- user's business logic expectation.

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    stats JSON;
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

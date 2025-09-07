-- Update the search_transactions function to actually perform search
CREATE OR REPLACE FUNCTION public.search_transactions(p_search_term text)
 RETURNS TABLE(id uuid, sequence_number text, customer_id text, amount numeric, installment_amount numeric, remaining_balance numeric, status text, created_at timestamp with time zone, customer jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.sequence_number,
        t.customer_id,
        t.amount,
        t.installment_amount,
        t.remaining_balance,
        t.status,
        t.created_at,
        jsonb_build_object('id', c.id, 'full_name', c.full_name, 'mobile_number', c.mobile_number) as customer
    FROM
        public.transactions t
    JOIN
        public.customers c ON t.customer_id = c.id
    WHERE
        -- Search by customer name (case insensitive)
        LOWER(c.full_name) LIKE LOWER('%' || p_search_term || '%')
        OR
        -- Search by mobile number
        c.mobile_number LIKE '%' || p_search_term || '%'
        OR
        -- Search by alternate mobile number
        c.mobile_number2 LIKE '%' || p_search_term || '%'
        OR
        -- Search by transaction sequence number
        t.sequence_number LIKE '%' || p_search_term || '%'
        OR
        -- Search by civil ID
        c.civil_id LIKE '%' || p_search_term || '%'
    ORDER BY t.created_at DESC
    LIMIT 100;
END;
$function$
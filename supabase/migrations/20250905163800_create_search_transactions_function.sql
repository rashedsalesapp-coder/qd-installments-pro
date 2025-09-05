CREATE OR REPLACE FUNCTION public.search_transactions(p_search_term TEXT)
RETURNS TABLE (
    id uuid,
    sequence_number text,
    customer_id uuid,
    amount numeric,
    installment_amount numeric,
    remaining_balance numeric,
    status text,
    created_at timestamptz,
    customer jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_search_term = '' THEN
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
            jsonb_build_object('id', c.id, 'full_name', c.full_name) as customer
        FROM
            public.transactions t
        JOIN
            public.customers c ON t.customer_id = c.id
        WHERE
             t.status != 'completed'
        ORDER BY
            t.created_at DESC
        LIMIT 10;
    ELSE
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
            jsonb_build_object('id', c.id, 'full_name', c.full_name) as customer
        FROM
            public.transactions t
        JOIN
            public.customers c ON t.customer_id = c.id
        WHERE
            t.status != 'completed' AND (
                c.full_name ILIKE '%' || p_search_term || '%' OR
                c.mobile_number ILIKE '%' || p_search_term || '%' OR
                c.civil_id ILIKE '%' || p_search_term || '%' OR
                t.sequence_number::text ILIKE '%' || p_search_term || '%'
            )
        ORDER BY
            t.created_at DESC
        LIMIT 10;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_transactions(TEXT) TO authenticated;

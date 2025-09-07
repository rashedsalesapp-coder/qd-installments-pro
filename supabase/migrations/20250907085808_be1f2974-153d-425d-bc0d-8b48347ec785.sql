-- Drop the existing function to ensure a clean state
DROP FUNCTION IF EXISTS public.search_transactions(TEXT);

-- Create a minimal, simplified version for debugging
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
    -- This is a temporary query for debugging. It does not search.
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
    LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_transactions(TEXT) TO authenticated;
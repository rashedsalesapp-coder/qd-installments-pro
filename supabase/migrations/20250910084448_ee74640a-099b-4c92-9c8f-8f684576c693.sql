-- Drop existing search_transactions function to avoid conflicts
DROP FUNCTION IF EXISTS search_transactions(text);

-- Recreate search_transactions function with correct return type
CREATE OR REPLACE FUNCTION search_transactions(p_search_term TEXT)
RETURNS SETOF transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_search_term = '' THEN
        RETURN QUERY
        SELECT t.*
        FROM transactions t
        WHERE t.status != 'completed'
        ORDER BY t.created_at DESC
        LIMIT 10;
    ELSE
        RETURN QUERY
        SELECT t.*
        FROM transactions t
        JOIN customers c ON t.customer_id::uuid = c.id::uuid
        WHERE t.status != 'completed' AND (
            c.full_name ILIKE '%' || p_search_term || '%' OR
            c.mobile_number ILIKE '%' || p_search_term || '%' OR
            c.civil_id ILIKE '%' || p_search_term || '%' OR
            t.sequence_number ILIKE '%' || p_search_term || '%'
        )
        ORDER BY t.created_at DESC
        LIMIT 10;
    END IF;
END;
$$;
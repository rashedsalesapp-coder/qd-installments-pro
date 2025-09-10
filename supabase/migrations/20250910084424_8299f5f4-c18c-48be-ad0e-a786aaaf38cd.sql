-- Add missing RPC functions for search and user management

-- Function to search transactions
CREATE OR REPLACE FUNCTION search_transactions(p_search_term TEXT)
RETURNS TABLE (
    id UUID,
    sequence_number TEXT,
    customer_id UUID,
    cost_price DECIMAL,
    extra_price DECIMAL,
    amount DECIMAL,
    profit DECIMAL,
    installment_amount DECIMAL,
    start_date DATE,
    number_of_installments INTEGER,
    remaining_balance DECIMAL,
    status TEXT,
    has_legal_case BOOLEAN,
    notes TEXT,
    created_at TIMESTAMPTZ,
    customer JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.sequence_number,
        t.customer_id,
        t.cost_price,
        t.extra_price,
        t.amount,
        t.profit,
        t.installment_amount,
        t.start_date,
        t.number_of_installments,
        t.remaining_balance,
        t.status,
        t.has_legal_case,
        t.notes,
        t.created_at,
        jsonb_build_object(
            'id', c.id,
            'full_name', c.full_name,
            'mobile_number', c.mobile_number
        ) as customer
    FROM transactions t
    JOIN customers c ON t.customer_id = c.id
    WHERE 
        t.remaining_balance > 0 AND
        (
            t.sequence_number ILIKE '%' || p_search_term || '%' OR
            c.full_name ILIKE '%' || p_search_term || '%' OR
            c.mobile_number ILIKE '%' || p_search_term || '%'
        )
    ORDER BY t.created_at DESC
    LIMIT 20;
END;
$$;

-- Function to update user role
CREATE OR REPLACE FUNCTION update_user_role(p_user_id UUID, p_new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Update or insert user role
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_new_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = p_new_role, updated_at = now();
END;
$$;

-- Fix get_dashboard_stats to return single object instead of array
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_customers INTEGER,
    total_active_transactions INTEGER,
    total_revenue DECIMAL,
    total_cost DECIMAL,
    total_profit DECIMAL,
    total_outstanding DECIMAL,
    total_overdue DECIMAL,
    overdue_transactions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM customers) as total_customers,
        (SELECT COUNT(*)::INTEGER FROM transactions WHERE remaining_balance > 0) as total_active_transactions,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions) as total_revenue,
        (SELECT COALESCE(SUM(cost_price), 0) FROM transactions) as total_cost,
        (SELECT COALESCE(SUM(profit), 0) FROM transactions) as total_profit,
        (SELECT COALESCE(SUM(remaining_balance), 0) FROM transactions WHERE remaining_balance > 0) as total_outstanding,
        (SELECT COALESCE(SUM(remaining_balance), 0) FROM transactions 
         WHERE remaining_balance > 0 AND start_date + (number_of_installments * interval '1 month') < CURRENT_DATE) as total_overdue,
        (SELECT COUNT(*)::INTEGER FROM transactions 
         WHERE remaining_balance > 0 AND start_date + (number_of_installments * interval '1 month') < CURRENT_DATE) as overdue_transactions;
END;
$$;
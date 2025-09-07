-- Drop the duplicate record_payment function that has fewer parameters
DROP FUNCTION IF EXISTS public.record_payment(uuid, real);

-- Keep only the more complete version:
-- public.record_payment(p_transaction_id uuid, p_amount numeric, p_payment_date date DEFAULT CURRENT_DATE)
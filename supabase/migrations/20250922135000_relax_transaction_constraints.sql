-- This migration relaxes the CHECK constraints on the 'transactions' table
-- to allow for zero or null values in numeric fields. This is necessary
-- to support the import of historical data which may be incomplete.

-- Drop the old, strict constraints from the transactions table
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS positive_amounts;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS valid_installments;

-- Also drop the new constraints if they somehow exist, to make this script idempotent
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_non_negative_amounts_check;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_non_negative_installments_check;


-- Add new, more lenient constraints that allow for zero values.
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_non_negative_amounts_check
CHECK (amount >= 0 AND installment_amount >= 0 AND cost_price >= 0);

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_non_negative_installments_check
CHECK (number_of_installments >= 0);

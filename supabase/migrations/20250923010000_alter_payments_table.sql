-- This migration makes the 'balance_before' and 'balance_after' columns
-- in the 'payments' table nullable. This is necessary to support the
-- import of historical payment data where these values are not relevant.

ALTER TABLE public.payments
ALTER COLUMN balance_before DROP NOT NULL;

ALTER TABLE public.payments
ALTER COLUMN balance_after DROP NOT NULL;

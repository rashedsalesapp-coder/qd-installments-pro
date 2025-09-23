-- Final constraint fix for the 'payments' table
-- Please run the contents of this file in your Supabase SQL Editor.

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS positive_payment;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS non_negative_payment;
ALTER TABLE public.payments ADD CONSTRAINT non_negative_payment CHECK (amount >= 0);

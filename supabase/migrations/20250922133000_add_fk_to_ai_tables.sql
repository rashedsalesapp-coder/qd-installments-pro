-- This migration adds the missing foreign key constraints to the AI-related tables
-- (`payment_predictions` and `customer_risk_scores`) to establish proper relationships
-- with the `customers` and `transactions` tables.

-- Add foreign key for customer_id in payment_predictions
ALTER TABLE public.payment_predictions
ADD CONSTRAINT payment_predictions_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES public.customers(id)
ON DELETE CASCADE;

-- Add foreign key for transaction_id in payment_predictions
ALTER TABLE public.payment_predictions
ADD CONSTRAINT payment_predictions_transaction_id_fkey
FOREIGN KEY (transaction_id)
REFERENCES public.transactions(id)
ON DELETE CASCADE;

-- Add foreign key for customer_id in customer_risk_scores
ALTER TABLE public.customer_risk_scores
ADD CONSTRAINT customer_risk_scores_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES public.customers(id)
ON DELETE CASCADE;

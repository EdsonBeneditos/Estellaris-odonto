
-- Add CRO fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS numero_cro text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_vencimento_cro date;


CREATE TABLE public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL DEFAULT 'Geral',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolamento financeiro por clinica"
ON public.financial_transactions
FOR ALL
TO public
USING (organization_id = (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()))
WITH CHECK (organization_id = (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Super admin can read all financial"
ON public.financial_transactions
FOR SELECT
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role));

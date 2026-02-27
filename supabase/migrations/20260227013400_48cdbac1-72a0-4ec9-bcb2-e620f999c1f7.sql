
-- Create appointments table for the smart agenda
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id),
  patient_id uuid REFERENCES public.patients(id),
  patient_name text NOT NULL,
  treatment_type text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes text,
  cpf text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS: Organization isolation
CREATE POLICY "Isolamento Agendamentos por Clinica"
ON public.appointments FOR ALL
USING (organization_id = (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()))
WITH CHECK (organization_id = (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- Super admin read
CREATE POLICY "Super admin can read all appointments"
ON public.appointments FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Index for date queries
CREATE INDEX idx_appointments_date ON public.appointments(organization_id, appointment_date);

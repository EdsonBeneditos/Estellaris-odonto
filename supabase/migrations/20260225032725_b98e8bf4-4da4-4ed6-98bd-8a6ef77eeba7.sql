
-- 1. Enable RLS on profiles and organizations
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Profiles: users can read/update their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- 3. Organizations: members can read their own org
CREATE POLICY "Members can read own organization"
ON public.organizations FOR SELECT
USING (id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Allow org creation during signup (no auth context yet for the org itself)
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Add email column to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email text;

-- 5. Fix medical_records: make policies PERMISSIVE instead of RESTRICTIVE
-- Drop the existing restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Isolamento Prontuarios" ON public.medical_records;

CREATE POLICY "Isolamento Prontuarios por Clinica"
ON public.medical_records FOR ALL
USING (organization_id = (
  SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
))
WITH CHECK (organization_id = (
  SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
));

-- Fix patients: same - drop restrictive, create permissive
DROP POLICY IF EXISTS "Isolamento por Clinica" ON public.patients;

CREATE POLICY "Isolamento Pacientes por Clinica"
ON public.patients FOR ALL
USING (organization_id = (
  SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
))
WITH CHECK (organization_id = (
  SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
));

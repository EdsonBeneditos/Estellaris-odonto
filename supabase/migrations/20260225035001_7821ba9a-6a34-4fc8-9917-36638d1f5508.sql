
-- 1) Enum de papéis
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'dentist', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Tabela de papéis
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Função segura para checar papéis
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4) RLS em user_roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Super admin can read all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 5) Trigger para signup automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _id_nome text;
  _nome_clinica text;
BEGIN
  _id_nome := NEW.raw_user_meta_data->>'id_nome';
  _nome_clinica := NEW.raw_user_meta_data->>'nome_clinica';

  IF _nome_clinica IS NOT NULL AND _nome_clinica != '' THEN
    INSERT INTO public.organizations (nome_clinica)
    VALUES (_nome_clinica)
    RETURNING id INTO _org_id;
  END IF;

  INSERT INTO public.profiles (id, id_nome, organization_id, cargo)
  VALUES (NEW.id, COALESCE(_id_nome, 'user'), _org_id, 'dentista');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6) Limpar policies restritivas de INSERT em organizations
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Permitir inserção pública para cadastro" ON public.organizations;

-- 7) Super admin policies
CREATE POLICY "Super admin can read all organizations"
  ON public.organizations FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can read all patients"
  ON public.patients FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can read all medical records"
  ON public.medical_records FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 8) Seed: criar org+profile+roles para o usuário existente
DO $$
DECLARE
  _user_id uuid := '87341b0f-37b5-41e2-a0d8-82684e194296';
  _org_id uuid;
  _has_profile boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = _user_id) INTO _has_profile;
  
  IF NOT _has_profile THEN
    INSERT INTO public.organizations (nome_clinica)
    VALUES ('Clinica odonto Nexus')
    RETURNING id INTO _org_id;

    INSERT INTO public.profiles (id, id_nome, organization_id, cargo)
    VALUES (_user_id, 'dr.bene', _org_id, 'dentista');
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'), (_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

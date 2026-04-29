-- ImmoAfrik Database Schema
-- Supabase PostgreSQL with Row Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE plan_abonnement AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE statut_unite AS ENUM ('occupé', 'libre', 'maintenance');
CREATE TYPE statut_paiement AS ENUM ('payé', 'en_attente', 'rejeté', 'expiré');
CREATE TYPE operateur_momo AS ENUM ('MTN', 'Orange', 'Wave', 'Moov');
CREATE TYPE type_paiement AS ENUM ('cash', 'momo');
CREATE TYPE statut_contrat AS ENUM ('actif', 'expiré', 'résilié');
CREATE TYPE type_unite AS ENUM ('chambre_simple', 'chambre_double', 'chambre_salon', 'studio', 'appartement', 'boutique');
CREATE TYPE categorie_depense AS ENUM ('plomberie', 'electricite', 'peinture', 'menuiserie', 'autre');
CREATE TYPE pays_afrique AS ENUM ('Bénin', 'Côte d''Ivoire', 'Sénégal', 'Togo', 'Mali', 'Burkina Faso', 'Niger', 'Guinée', 'Ghana', 'Nigeria');

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  code_unique TEXT UNIQUE, -- Format: IMMO-XXXX (generated for proprietaires)
  pays pays_afrique DEFAULT 'Bénin',
  role TEXT NOT NULL DEFAULT 'proprietaire' CHECK (role IN ('proprietaire', 'locataire', 'gestionnaire')),
  abonnement_plan plan_abonnement DEFAULT 'starter',
  abonnement_expiration DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MOBILE MONEY CONFIG
-- ============================================

CREATE TABLE public.momo_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  operateur operateur_momo NOT NULL,
  numero TEXT NOT NULL,
  nom_compte TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MAISONS (Properties)
-- ============================================

CREATE TABLE public.maisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  adresse TEXT NOT NULL,
  ville TEXT NOT NULL,
  commune TEXT,
  pays pays_afrique DEFAULT 'Bénin',
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  images_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UNITES (Units within properties)
-- ============================================

CREATE TABLE public.unites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  type type_unite NOT NULL,
  loyer_mensuel INTEGER NOT NULL,
  statut statut_unite DEFAULT 'libre',
  maison_id UUID NOT NULL REFERENCES public.maisons(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOCATAIRES (Tenants)
-- ============================================

CREATE TABLE public.locataires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional link to auth user
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  email TEXT,
  nationalite TEXT,
  numero_piece_identite TEXT,
  photo_piece_url TEXT,
  unite_id UUID REFERENCES public.unites(id) ON DELETE SET NULL,
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_entree DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTRATS (Lease contracts)
-- ============================================

CREATE TABLE public.contrats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locataire_id UUID NOT NULL REFERENCES public.locataires(id) ON DELETE CASCADE,
  unite_id UUID NOT NULL REFERENCES public.unites(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_effet DATE NOT NULL,
  date_fin DATE NOT NULL,
  preavis_jours INTEGER DEFAULT 30,
  caution_mois INTEGER DEFAULT 2,
  statut statut_contrat DEFAULT 'actif',
  documents_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAIEMENTS (Payments)
-- ============================================

CREATE TABLE public.paiements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locataire_id UUID NOT NULL REFERENCES public.locataires(id) ON DELETE CASCADE,
  unite_id UUID NOT NULL REFERENCES public.unites(id) ON DELETE CASCADE,
  maison_id UUID NOT NULL REFERENCES public.maisons(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL,
  montant INTEGER NOT NULL,
  type type_paiement NOT NULL,
  statut statut_paiement DEFAULT 'en_attente',
  reference_immo TEXT UNIQUE NOT NULL,
  numero_transaction_momo TEXT,
  operateur_momo operateur_momo,
  capture_ecran_url TEXT,
  date_paiement DATE,
  confirme_par_proprio BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEPENSES (Expenses)
-- ============================================

CREATE TABLE public.depenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maison_id UUID NOT NULL REFERENCES public.maisons(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL,
  montant INTEGER NOT NULL,
  date_depense DATE NOT NULL,
  categorie categorie_depense NOT NULL,
  facture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('urgent', 'important', 'info')),
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  action_path TEXT,
  lie_a_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================

CREATE INDEX idx_maisons_proprietaire ON public.maisons(proprietaire_id);
CREATE INDEX idx_unites_maison ON public.unites(maison_id);
CREATE INDEX idx_locataires_unite ON public.locataires(unite_id);
CREATE INDEX idx_locataires_proprietaire ON public.locataires(proprietaire_id);
CREATE INDEX idx_paiements_locataire ON public.paiements(locataire_id);
CREATE INDEX idx_paiements_proprietaire ON public.paiements(proprietaire_id);
CREATE INDEX idx_paiements_statut ON public.paiements(statut);
CREATE INDEX idx_contrats_locataire ON public.contrats(locataire_id);
CREATE INDEX idx_contrats_proprietaire ON public.contrats(proprietaire_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, lu);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own profile
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- MoMo configs: proprietaires manage their own
CREATE POLICY "momo_select_own" ON public.momo_configs FOR SELECT USING (auth.uid() = proprietaire_id);
CREATE POLICY "momo_insert_own" ON public.momo_configs FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);
CREATE POLICY "momo_update_own" ON public.momo_configs FOR UPDATE USING (auth.uid() = proprietaire_id);
CREATE POLICY "momo_delete_own" ON public.momo_configs FOR DELETE USING (auth.uid() = proprietaire_id);

-- Maisons: proprietaires manage their own properties
CREATE POLICY "maisons_select_own" ON public.maisons FOR SELECT USING (auth.uid() = proprietaire_id);
CREATE POLICY "maisons_insert_own" ON public.maisons FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);
CREATE POLICY "maisons_update_own" ON public.maisons FOR UPDATE USING (auth.uid() = proprietaire_id);
CREATE POLICY "maisons_delete_own" ON public.maisons FOR DELETE USING (auth.uid() = proprietaire_id);

-- Unites: access through maison ownership
CREATE POLICY "unites_select" ON public.unites FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.maisons WHERE id = unites.maison_id AND proprietaire_id = auth.uid())
);
CREATE POLICY "unites_insert" ON public.unites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.maisons WHERE id = unites.maison_id AND proprietaire_id = auth.uid())
);
CREATE POLICY "unites_update" ON public.unites FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.maisons WHERE id = unites.maison_id AND proprietaire_id = auth.uid())
);
CREATE POLICY "unites_delete" ON public.unites FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.maisons WHERE id = unites.maison_id AND proprietaire_id = auth.uid())
);

-- Locataires: proprietaires manage their own tenants
CREATE POLICY "locataires_select_own" ON public.locataires FOR SELECT USING (auth.uid() = proprietaire_id);
CREATE POLICY "locataires_insert_own" ON public.locataires FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);
CREATE POLICY "locataires_update_own" ON public.locataires FOR UPDATE USING (auth.uid() = proprietaire_id);
CREATE POLICY "locataires_delete_own" ON public.locataires FOR DELETE USING (auth.uid() = proprietaire_id);

-- Contrats: proprietaires manage their own contracts
CREATE POLICY "contrats_select_own" ON public.contrats FOR SELECT USING (auth.uid() = proprietaire_id);
CREATE POLICY "contrats_insert_own" ON public.contrats FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);
CREATE POLICY "contrats_update_own" ON public.contrats FOR UPDATE USING (auth.uid() = proprietaire_id);
CREATE POLICY "contrats_delete_own" ON public.contrats FOR DELETE USING (auth.uid() = proprietaire_id);

-- Paiements: proprietaires manage their own payments
CREATE POLICY "paiements_select_own" ON public.paiements FOR SELECT USING (auth.uid() = proprietaire_id);
CREATE POLICY "paiements_insert_own" ON public.paiements FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);
CREATE POLICY "paiements_update_own" ON public.paiements FOR UPDATE USING (auth.uid() = proprietaire_id);

-- Depenses: proprietaires manage their own expenses
CREATE POLICY "depenses_select_own" ON public.depenses FOR SELECT USING (auth.uid() = proprietaire_id);
CREATE POLICY "depenses_insert_own" ON public.depenses FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);
CREATE POLICY "depenses_update_own" ON public.depenses FOR UPDATE USING (auth.uid() = proprietaire_id);
CREATE POLICY "depenses_delete_own" ON public.depenses FOR DELETE USING (auth.uid() = proprietaire_id);

-- Notifications: users see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate unique code for proprietaires
CREATE OR REPLACE FUNCTION generate_code_unique()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'IMMO-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE code_unique = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, prenom, email, telephone, code_unique, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nom', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'prenom', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'telephone', ''),
    generate_code_unique(),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'proprietaire')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to generate payment reference
CREATE OR REPLACE FUNCTION generate_reference_immo(
  maison_nom TEXT,
  annee INTEGER,
  mois INTEGER,
  unite_nom TEXT
)
RETURNS TEXT AS $$
DECLARE
  counter INTEGER;
  ref TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.paiements 
  WHERE paiements.annee = generate_reference_immo.annee 
    AND paiements.mois = generate_reference_immo.mois;
  
  ref := 'IMMO-' || UPPER(LEFT(maison_nom, 3)) || '-' || 
         annee || LPAD(mois::TEXT, 2, '0') || '-' || 
         UPPER(unite_nom) || '-' || LPAD(counter::TEXT, 5, '0');
  
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_maisons_updated_at BEFORE UPDATE ON public.maisons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_unites_updated_at BEFORE UPDATE ON public.unites FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_locataires_updated_at BEFORE UPDATE ON public.locataires FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contrats_updated_at BEFORE UPDATE ON public.contrats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_paiements_updated_at BEFORE UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

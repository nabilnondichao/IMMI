-- ImmoAfrik Database Schema - Core Tables
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT '',
  prenom TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telephone TEXT NOT NULL DEFAULT '',
  code_unique TEXT UNIQUE,
  pays TEXT DEFAULT 'Bénin',
  role TEXT NOT NULL DEFAULT 'proprietaire',
  abonnement_plan TEXT DEFAULT 'starter',
  abonnement_expiration DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MOBILE MONEY CONFIG
-- ============================================

CREATE TABLE IF NOT EXISTS public.momo_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  operateur TEXT NOT NULL,
  numero TEXT NOT NULL,
  nom_compte TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MAISONS (Properties)
-- ============================================

CREATE TABLE IF NOT EXISTS public.maisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  adresse TEXT NOT NULL,
  ville TEXT NOT NULL,
  commune TEXT,
  pays TEXT DEFAULT 'Bénin',
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  images_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UNITES (Units within properties)
-- ============================================

CREATE TABLE IF NOT EXISTS public.unites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  type TEXT NOT NULL,
  loyer_mensuel INTEGER NOT NULL,
  statut TEXT DEFAULT 'libre',
  maison_id UUID NOT NULL REFERENCES public.maisons(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOCATAIRES (Tenants)
-- ============================================

CREATE TABLE IF NOT EXISTS public.locataires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS public.contrats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locataire_id UUID NOT NULL REFERENCES public.locataires(id) ON DELETE CASCADE,
  unite_id UUID NOT NULL REFERENCES public.unites(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_effet DATE NOT NULL,
  date_fin DATE NOT NULL,
  preavis_jours INTEGER DEFAULT 30,
  caution_mois INTEGER DEFAULT 2,
  statut TEXT DEFAULT 'actif',
  documents_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAIEMENTS (Payments)
-- ============================================

CREATE TABLE IF NOT EXISTS public.paiements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locataire_id UUID NOT NULL REFERENCES public.locataires(id) ON DELETE CASCADE,
  unite_id UUID NOT NULL REFERENCES public.unites(id) ON DELETE CASCADE,
  maison_id UUID NOT NULL REFERENCES public.maisons(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  montant INTEGER NOT NULL,
  type TEXT NOT NULL,
  statut TEXT DEFAULT 'en_attente',
  reference_immo TEXT UNIQUE NOT NULL,
  numero_transaction_momo TEXT,
  operateur_momo TEXT,
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

CREATE TABLE IF NOT EXISTS public.depenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maison_id UUID NOT NULL REFERENCES public.maisons(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL,
  montant INTEGER NOT NULL,
  date_depense DATE NOT NULL,
  categorie TEXT NOT NULL,
  facture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  action_path TEXT,
  lie_a_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Cautions + Historique locataires + Gestionnaires
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- TABLE CAUTIONS (dépôt de garantie)
-- ============================================

CREATE TABLE IF NOT EXISTS public.cautions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locataire_id UUID NOT NULL REFERENCES public.locataires(id) ON DELETE CASCADE,
  unite_id UUID NOT NULL REFERENCES public.unites(id) ON DELETE CASCADE,
  maison_id UUID NOT NULL REFERENCES public.maisons(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  montant INTEGER NOT NULL CHECK (montant > 0),
  statut TEXT NOT NULL DEFAULT 'encaissé' CHECK (statut IN ('encaissé', 'retenu_partiel', 'restitué')),
  date_encaissement DATE NOT NULL DEFAULT CURRENT_DATE,
  date_restitution DATE,
  montant_retenu INTEGER NOT NULL DEFAULT 0 CHECK (montant_retenu >= 0),
  motif_retenue TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cautions_locataire ON public.cautions(locataire_id);
CREATE INDEX IF NOT EXISTS idx_cautions_proprietaire ON public.cautions(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_cautions_unite ON public.cautions(unite_id);

ALTER TABLE public.cautions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cautions_select_own" ON public.cautions
  FOR SELECT USING (auth.uid() = proprietaire_id);

CREATE POLICY "cautions_insert_own" ON public.cautions
  FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY "cautions_update_own" ON public.cautions
  FOR UPDATE USING (auth.uid() = proprietaire_id);

CREATE POLICY "cautions_delete_own" ON public.cautions
  FOR DELETE USING (auth.uid() = proprietaire_id);

CREATE TRIGGER update_cautions_updated_at
  BEFORE UPDATE ON public.cautions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TABLE HISTORIQUE LOCATAIRES
-- ============================================

CREATE TABLE IF NOT EXISTS public.historique_locataires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unite_id UUID NOT NULL REFERENCES public.unites(id) ON DELETE CASCADE,
  locataire_id UUID REFERENCES public.locataires(id) ON DELETE SET NULL,
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nom_locataire TEXT NOT NULL,
  prenom_locataire TEXT NOT NULL,
  telephone_locataire TEXT,
  date_entree DATE NOT NULL,
  date_sortie DATE,
  loyer_mensuel INTEGER NOT NULL,
  motif_depart TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historique_unite ON public.historique_locataires(unite_id);
CREATE INDEX IF NOT EXISTS idx_historique_proprietaire ON public.historique_locataires(proprietaire_id);

ALTER TABLE public.historique_locataires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historique_select_own" ON public.historique_locataires
  FOR SELECT USING (auth.uid() = proprietaire_id);

CREATE POLICY "historique_insert_own" ON public.historique_locataires
  FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY "historique_update_own" ON public.historique_locataires
  FOR UPDATE USING (auth.uid() = proprietaire_id);

-- ============================================
-- TABLE GESTIONNAIRES (multi-gestionnaires)
-- ============================================

CREATE TABLE IF NOT EXISTS public.gestionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_invite TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  statut TEXT NOT NULL DEFAULT 'invité' CHECK (statut IN ('invité', 'actif', 'suspendu')),
  permissions JSONB NOT NULL DEFAULT '{"maisons": true, "locataires": true, "paiements": true, "contrats": false, "depenses": false, "analytics": false}',
  code_invitation TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gestionnaires_proprietaire ON public.gestionnaires(proprietaire_id);

ALTER TABLE public.gestionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gestionnaires_select_own" ON public.gestionnaires
  FOR SELECT USING (auth.uid() = proprietaire_id OR auth.uid() = user_id);

CREATE POLICY "gestionnaires_insert_own" ON public.gestionnaires
  FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY "gestionnaires_update_own" ON public.gestionnaires
  FOR UPDATE USING (auth.uid() = proprietaire_id);

CREATE POLICY "gestionnaires_delete_own" ON public.gestionnaires
  FOR DELETE USING (auth.uid() = proprietaire_id);

CREATE TRIGGER update_gestionnaires_updated_at
  BEFORE UPDATE ON public.gestionnaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

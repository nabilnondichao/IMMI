-- Migration: Ajout de la table avances (loyers prépayés, eau, électricité)
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- TABLE AVANCES
-- ============================================

CREATE TABLE IF NOT EXISTS public.avances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locataire_id UUID NOT NULL REFERENCES public.locataires(id) ON DELETE CASCADE,
  unite_id UUID NOT NULL REFERENCES public.unites(id) ON DELETE CASCADE,
  maison_id UUID NOT NULL REFERENCES public.maisons(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('loyer', 'eau', 'electricite')),
  montant_initial INTEGER NOT NULL CHECK (montant_initial > 0),
  montant_restant INTEGER NOT NULL CHECK (montant_restant >= 0),
  date_depot DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_avances_locataire ON public.avances(locataire_id);
CREATE INDEX IF NOT EXISTS idx_avances_proprietaire ON public.avances(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_avances_type ON public.avances(type);

-- Row Level Security
ALTER TABLE public.avances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avances_select_own" ON public.avances
  FOR SELECT USING (auth.uid() = proprietaire_id);

CREATE POLICY "avances_insert_own" ON public.avances
  FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY "avances_update_own" ON public.avances
  FOR UPDATE USING (auth.uid() = proprietaire_id);

CREATE POLICY "avances_delete_own" ON public.avances
  FOR DELETE USING (auth.uid() = proprietaire_id);

-- Updated_at trigger
CREATE TRIGGER update_avances_updated_at
  BEFORE UPDATE ON public.avances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

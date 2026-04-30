-- Migration: Système de rôles et permissions avancés
-- À exécuter dans Supabase SQL Editor

-- 1. Statut du compte
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS statut TEXT NOT NULL DEFAULT 'actif'
  CHECK (statut IN ('actif', 'suspendu', 'en_attente'));

-- 2. Rôle admin (en plus du rôle de base)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT NULL
  CHECK (admin_role IN ('super_admin', 'admin', 'moderateur'));

-- 3. Permissions granulaires (JSONB)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT NULL;

-- 4. Notes admin (pour les admins noter des choses sur un compte)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT NULL;

-- 5. Date de suspension
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ DEFAULT NULL;

-- 6. Mettre Jaurès comme super_admin
UPDATE public.profiles
  SET admin_role = 'super_admin', is_super_admin = TRUE
  WHERE email = 'jauressokpin@gmail.com';

-- 7. Vue résumée pour l'admin (facilite les requêtes)
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT
  p.id,
  p.nom,
  p.prenom,
  p.email,
  p.telephone,
  p.pays,
  p.role,
  p.admin_role,
  p.is_super_admin,
  p.statut,
  p.permissions,
  p.admin_notes,
  p.code_unique,
  p.created_at,
  p.suspended_at,
  (SELECT COUNT(*) FROM public.maisons m WHERE m.proprietaire_id = p.id) AS nb_maisons,
  (SELECT COUNT(*) FROM public.locataires l WHERE l.proprietaire_id = p.id) AS nb_locataires
FROM public.profiles p
ORDER BY p.created_at DESC;

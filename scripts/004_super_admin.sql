-- Migration: Ajout colonne is_super_admin + configuration Super Admin
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter colonne is_super_admin à profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Mettre à jour la politique RLS pour que les super admins voient tout
-- (Les super admins peuvent lire tous les profils)
CREATE POLICY IF NOT EXISTS "super_admin_select_all_profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_super_admin = TRUE)
  );

-- 3. Permettre aux super admins de voir toutes les maisons
CREATE POLICY IF NOT EXISTS "super_admin_select_all_maisons" ON public.maisons
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_super_admin = TRUE)
  );

-- 4. Permettre aux super admins de voir tous les paiements
CREATE POLICY IF NOT EXISTS "super_admin_select_all_paiements" ON public.paiements
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_super_admin = TRUE)
  );

-- 5. Permettre aux super admins de voir tous les locataires
CREATE POLICY IF NOT EXISTS "super_admin_select_all_locataires" ON public.locataires
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_super_admin = TRUE)
  );

-- Note: Après avoir créé le compte de Jaurès via l'app ou l'API,
-- exécuter cette requête pour l'élever en super admin:
-- UPDATE public.profiles SET is_super_admin = TRUE WHERE email = 'jauressokpin@gmail.com';

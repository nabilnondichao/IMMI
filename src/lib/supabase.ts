/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Singleton — UNE seule instance dans toute l'app pour éviter les conflits de lock auth
let _instance: SupabaseClient | null = null;

function createSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_instance) {
    _instance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'immoafrik-auth',
        storage: window?.localStorage,
      },
      global: {
        headers: { 'x-app-name': 'immoafrik' },
      },
    });
  }
  return _instance;
}

export const supabase = createSupabase();

// Alias pour compatibilité
export function getSupabase(): SupabaseClient {
  if (!_instance) throw new Error('Supabase non initialisé');
  return _instance;
}

// Database types based on our schema
export interface Profile {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  code_unique: string;
  pays: string;
  role: 'proprietaire' | 'locataire';
  is_super_admin: boolean;
  admin_role: 'super_admin' | 'admin' | 'moderateur' | null;
  statut: 'actif' | 'suspendu' | 'en_attente';
  permissions: Record<string, boolean> | null;
  admin_notes: string | null;
  suspended_at: string | null;
  abonnement_plan: 'starter' | 'pro' | 'enterprise';
  abonnement_expiration: string | null;
  created_at: string;
  updated_at: string;
}

// Helper pour afficher les montants avec la bonne devise
export function formatMontantPays(montant: number, pays: string): string {
  // Import dynamique évité — on garde la logique simple ici
  const FCFA_PAYS = ['Bénin',"Côte d'Ivoire",'Sénégal','Togo','Burkina Faso','Mali','Niger','Guinée-Bissau'];
  if (FCFA_PAYS.includes(pays)) return `${montant.toLocaleString('fr-FR')} FCFA`;
  if (pays === 'Ghana') return `GH₵ ${montant.toLocaleString('fr-FR')}`;
  if (pays === 'Nigeria') return `₦ ${montant.toLocaleString('fr-FR')}`;
  if (pays === 'Guinée') return `${montant.toLocaleString('fr-FR')} GNF`;
  if (pays === 'Sierra Leone') return `Le ${montant.toLocaleString('fr-FR')}`;
  if (pays === 'Liberia') return `L$ ${montant.toLocaleString('fr-FR')}`;
  if (pays === 'Gambie') return `D ${montant.toLocaleString('fr-FR')}`;
  if (pays === 'Mauritanie') return `${montant.toLocaleString('fr-FR')} MRU`;
  return `${montant.toLocaleString('fr-FR')} FCFA`;
}

export interface MomoConfig {
  id: string;
  proprietaire_id: string;
  operateur: 'MTN' | 'Orange' | 'Wave' | 'Moov';
  numero: string;
  nom_compte: string;
  is_primary: boolean;
  created_at: string;
}

export interface Maison {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  commune: string | null;
  pays: string;
  proprietaire_id: string;
  images_urls: string[] | null;
  created_at: string;
  updated_at: string;
  // Extended properties
  whatsapp_contact?: string;
  email_contact?: string;
  description?: string;
  type_propriete?: string;
}

export interface Unite {
  id: string;
  nom: string;
  type: string;
  loyer_mensuel: number;
  statut: 'libre' | 'occupé' | 'maintenance';
  maison_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  // Extended properties
  etage?: number;
  numero_chambre?: string;
  position?: string;
  type_location?: 'court_terme' | 'long_terme' | 'mixte';
  photos?: string[];
  video_url?: string;
  amenities?: string[];
  superficie_m2?: number;
  meuble?: boolean;
  disponible_a_partir?: string;
  loyer_journalier?: number;
  loyer_hebdomadaire?: number;
  caution_mois?: number;
}

export interface Locataire {
  id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  nationalite: string | null;
  numero_piece_identite: string | null;
  photo_piece_url: string | null;
  unite_id: string | null;
  proprietaire_id: string;
  date_entree: string;
  created_at: string;
  updated_at: string;
}

export interface Contrat {
  id: string;
  locataire_id: string;
  unite_id: string;
  proprietaire_id: string;
  date_effet: string;
  date_fin: string;
  preavis_jours: number;
  caution_mois: number;
  statut: 'actif' | 'expiré' | 'résilié';
  documents_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Paiement {
  id: string;
  locataire_id: string;
  unite_id: string;
  maison_id: string;
  proprietaire_id: string;
  mois: number;
  annee: number;
  montant: number;
  type: 'cash' | 'momo';
  statut: 'payé' | 'en_attente' | 'rejeté' | 'expiré';
  reference_immo: string;
  numero_transaction_momo: string | null;
  operateur_momo: string | null;
  capture_ecran_url: string | null;
  date_paiement: string | null;
  confirme_par_proprio: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Depense {
  id: string;
  maison_id: string;
  proprietaire_id: string;
  libelle: string;
  montant: number;
  date_depense: string;
  categorie: string;
  facture_url: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  titre: string;
  message: string;
  lu: boolean;
  action_path: string | null;
  lie_a_id: string | null;
  created_at: string;
}

export interface Reservation {
  id: string;
  unite_id: string;
  maison_id: string;
  proprietaire_id: string;
  nom_client: string;
  telephone_client: string;
  email_client: string | null;
  date_debut: string;
  date_fin: string;
  nombre_nuits: number;
  montant_total: number;
  statut: 'en_attente' | 'confirmee' | 'annulee' | 'terminee';
  notes: string | null;
  source: 'direct' | 'whatsapp' | 'booking' | 'airbnb';
  created_at: string;
}

export interface Actif {
  id: string;
  proprietaire_id: string;
  nom: string;
  type: 'maison' | 'appartement' | 'terrain' | 'boutique' | 'immeuble' | 'villa' | 'autre';
  adresse: string;
  ville: string;
  valeur_achat: number;
  valeur_actuelle: number;
  date_acquisition: string | null;
  superficie_m2: number | null;
  statut_juridique: 'titre_foncier' | 'permis_habiter' | 'acte_vente' | 'en_cours' | 'autre';
  revenus_mensuel: number;
  charges_mensuel: number;
  hypotheque: boolean;
  montant_hypotheque: number;
  notes: string | null;
  documents_urls: string[] | null;
  lien_maison_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Avance {
  id: string;
  locataire_id: string;
  unite_id: string;
  maison_id: string;
  proprietaire_id: string;
  type: 'loyer' | 'eau' | 'electricite';
  montant_initial: number;
  montant_restant: number;
  date_depot: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Caution {
  id: string;
  locataire_id: string;
  unite_id: string;
  maison_id: string;
  proprietaire_id: string;
  montant: number;
  statut: 'encaissé' | 'retenu_partiel' | 'restitué';
  date_encaissement: string;
  date_restitution: string | null;
  montant_retenu: number;
  motif_retenue: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HistoriqueLocataire {
  id: string;
  unite_id: string;
  locataire_id: string | null;
  proprietaire_id: string;
  nom_locataire: string;
  prenom_locataire: string;
  telephone_locataire: string | null;
  date_entree: string;
  date_sortie: string | null;
  loyer_mensuel: number;
  motif_depart: string | null;
  notes: string | null;
  created_at: string;
}

export interface Gestionnaire {
  id: string;
  proprietaire_id: string;
  email_invite: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  user_id: string | null;
  statut: 'invité' | 'actif' | 'suspendu';
  permissions: {
    maisons: boolean;
    locataires: boolean;
    paiements: boolean;
    contrats: boolean;
    depenses: boolean;
    analytics: boolean;
  };
  code_invitation: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

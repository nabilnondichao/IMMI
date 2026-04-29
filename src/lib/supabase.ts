/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Initialize the Supabase client
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key must be configured in environment variables');
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}

// Export for backwards compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
  abonnement_plan: 'starter' | 'pro' | 'enterprise';
  abonnement_expiration: string | null;
  created_at: string;
  updated_at: string;
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

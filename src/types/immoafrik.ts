/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TYPES ET INTERFACES - IMMOAFRIK
 * Spécialisé pour la gestion immobilière en Afrique de l'Ouest
 */

// --- ENUMS ---

export enum PlanAbonnement {
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export enum StatutUnite {
  OCCUPE = 'occupé',
  LIBRE = 'libre',
  MAINTENANCE = 'maintenance'
}

export enum StatutPaiement {
  PAYE = 'payé',
  EN_ATTENTE = 'en_attente',
  REJETE = 'rejeté',
  EXPIRE = 'expiré'
}

export enum OperateurMoMo {
  MTN = 'MTN',
  ORANGE = 'Orange',
  WAVE = 'Wave',
  MOOV = 'Moov'
}

export enum TypePaiement {
  CASH = 'cash',
  MOMO = 'momo'
}

export enum StatutContrat {
  ACTIF = 'actif',
  EXPIRE = 'expiré',
  RESILIE = 'résilié'
}

export enum TypeUnite {
  CHAMBRE_SIMPLE = 'chambre_simple',
  CHAMBRE_DOUBLE = 'chambre_double',
  CHAMBRE_SALON = 'chambre_salon',
  STUDIO = 'studio',
  APPARTEMENT = 'appartement',
  BOUTIQUE = 'boutique'
}

export enum CategorieDepense {
  PLOMBERIE = 'plomberie',
  ELECTRICITE = 'electricite',
  PEINTURE = 'peinture',
  MENUISERIE = 'menuiserie',
  AUTRE = 'autre'
}

export enum TypeAlerte {
  ARRIERE = 'arriere',
  CONTRAT_EXPIRE = 'contrat_expire',
  MOMO_EN_ATTENTE = 'momo_en_attente',
  AVANCE_FAIBLE = 'avance_faible'
}

export enum UrgenceAlerte {
  HAUTE = 'haute',
  MOYENNE = 'moyenne',
  BASSE = 'basse'
}

// --- UTILISATEURS ---

export interface MobileMoneyConfig {
  operateur: OperateurMoMo;
  numero: string;
  nom_compte: string;
}

export interface Proprietaire {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  code_unique: string; // Format: IMMO-XXXX
  pays: 'Bénin' | "Côte d'Ivoire" | 'Sénégal' | 'Togo';
  momo_config: MobileMoneyConfig[];
  abonnement: {
    plan: PlanAbonnement;
    date_expiration: string;
  };
}

export interface Locataire {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  nationalite: string;
  numero_piece_identite: string;
  photo_piece_url?: string;
  unite_id: string; // Unité actuelle
  date_entree: string;
}

// --- IMMOBILIER ---

export interface Maison {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  commune?: string;
  pays: string;
  proprietaire_id: string;
  images_urls?: string[];
  whatsapp_contact?: string;
  email_contact?: string;
  description?: string;
  type_propriete?: 'immeuble' | 'villa' | 'appartement' | 'terrain' | 'commercial';
}

export type TypeLocation = 'court_terme' | 'long_terme' | 'mixte';

export interface Unite {
  id: string;
  nom: string; // Ex: R1, Z1, Bureau 4
  type: TypeUnite;
  loyer_mensuel: number;
  statut: StatutUnite;
  maison_id: string;
  description?: string;
  // Nouvelles propriétés
  etage?: number;
  numero_chambre?: string;
  position?: string; // Ex: "Vue sur rue", "Côté cour"
  type_location?: TypeLocation;
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

export interface Reservation {
  id: string;
  unite_id: string;
  maison_id: string;
  proprietaire_id: string;
  nom_client: string;
  telephone_client: string;
  email_client?: string;
  date_debut: string;
  date_fin: string;
  nombre_nuits: number;
  montant_total: number;
  statut: 'en_attente' | 'confirmee' | 'annulee' | 'terminee';
  notes?: string;
  source?: 'direct' | 'whatsapp' | 'booking' | 'airbnb';
  created_at?: string;
}

// --- FINANCIER ---

export interface Paiement {
  id: string;
  locataire_id: string;
  unite_id: string;
  maison_id: string;
  mois: number; // 1-12
  annee: number;
  montant: number;
  type: TypePaiement;
  statut: StatutPaiement;
  reference_immo: string; // Format: IMMO-GDM-202506-R1-00142
  numero_transaction_momo?: string;
  operateur_momo?: OperateurMoMo;
  capture_ecran_url?: string;
  date_paiement: string;
  confirme_par_proprio: boolean;
  notes?: string;
}

export interface Arriere {
  locataire_id: string;
  mois_dus: number;
  montant_total: number;
  paiements_id: string[]; // Références aux paiements en statut EN_RETARD
}

export interface Contrat {
  id: string;
  locataire_id: string;
  unite_id: string;
  proprietaire_id?: string;
  date_effet: string;
  date_fin: string;
  preavis_jours: number;
  caution_mois: number;
  statut: StatutContrat;
  documents_url?: string;
  fichier_contrat_url?: string;
  signe_par_locataire?: boolean;
  signe_par_proprio?: boolean;
  montant_loyer?: number;
  montant_caution?: number;
  jour_paiement?: number;
}

export interface Depense {
  id: string;
  maison_id: string;
  libelle: string;
  montant: number;
  date_depense: string;
  categorie: CategorieDepense;
  facture_url?: string;
}

// --- DASHBOARD & ANALYTICS ---

export interface BilanMensuel {
  total_attendu: number;
  total_encaisse: number;
  total_arrieres: number;
  total_depenses: number;
  revenu_net: number;
  taux_occupation: number; // en pourcentage
}

export interface Alerte {
  id: string;
  type: TypeAlerte;
  message: string;
  urgence: UrgenceAlerte;
  date_creation: string;
  lie_a_id?: string; // ID du locataire, contrat ou paiement
}

// --- API & FORMS ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export interface FormState {
  isSubmitting: boolean;
  error: string | null;
  isSuccess: boolean;
}

export interface LocataireFormState extends FormState {
  fields: {
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    unite_id: string;
  };
}

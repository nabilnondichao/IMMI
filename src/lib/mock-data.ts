import { 
  Proprietaire, 
  Maison, 
  Unite, 
  Locataire, 
  Paiement, 
  Depense, 
  Contrat,
  PlanAbonnement,
  StatutUnite,
  StatutPaiement,
  OperateurMoMo,
  TypePaiement,
  StatutContrat,
  TypeUnite,
  CategorieDepense
} from '../types/immoafrik';

// 1. PROPRIÉTAIRES
export const PROPRIETAIRES: Proprietaire[] = [
  {
    id: 'prop-1',
    nom: 'ADANHOUNME',
    prenom: 'Koffi',
    email: 'koffi.adanhoume@example.com',
    telephone: '+229 97 00 11 22',
    code_unique: 'IMMO-4289',
    momo_config: [
      { operateur: OperateurMoMo.MTN, numero: '+229 97 00 11 22', nom_compte: 'Koffi ADANHOUNME' },
      { operateur: OperateurMoMo.WAVE, numero: '+229 60 44 55 66', nom_compte: 'Koffi ADANHOUNME' }
    ],
    abonnement: {
      plan: PlanAbonnement.PRO,
      date_expiration: '2025-12-31'
    },
    pays: 'Bénin'
  },
  {
    id: 'prop-2',
    nom: 'DIALLO',
    prenom: 'Amadou',
    email: 'diallo.amadou@example.com',
    telephone: '+225 07 08 09 10 11',
    code_unique: 'IMMO-9901',
    momo_config: [
      { operateur: OperateurMoMo.ORANGE, numero: '+225 07 08 09 10 11', nom_compte: 'Amadou DIALLO' },
      { operateur: OperateurMoMo.WAVE, numero: '+225 05 06 07 08 09', nom_compte: 'Amadou DIALLO' }
    ],
    abonnement: {
      plan: PlanAbonnement.STARTER,
      date_expiration: '2024-06-15'
    },
    pays: "Côte d'Ivoire"
  }
];

// 2. MAISONS (8 pour le proprio 1)
export const MAISONS: Maison[] = [
  { id: 'm-gdm', nom: 'Maison GDM', adresse: 'Cotonou, Fidjrossè', ville: 'Cotonou', pays: 'Bénin', proprietaire_id: 'prop-1' },
  { id: 'm-z', nom: 'Maison Z', adresse: 'Calavi, Zogbadjè', ville: 'Abomey-Calavi', pays: 'Bénin', proprietaire_id: 'prop-1' },
  { id: 'm-v', nom: 'Maison V', adresse: 'Ouidah, Centre', ville: 'Ouidah', pays: 'Bénin', proprietaire_id: 'prop-1' },
  { id: 'm-t1', nom: 'Maison T1', adresse: 'Porto-Novo, Agbokou', ville: 'Porto-Novo', pays: 'Bénin', proprietaire_id: 'prop-1' },
  { id: 'm-t2', nom: 'Maison T2', adresse: 'Akpakpa, PK10', ville: 'Cotonou', pays: 'Bénin', proprietaire_id: 'prop-1' },
  { id: 'm-cc', nom: 'Maison CC', adresse: 'Cadjehoun', ville: 'Cotonou', pays: 'Bénin', proprietaire_id: 'prop-1' },
  { id: 'm-pk', nom: 'Maison PK', adresse: 'Sèmè-Podji', ville: 'Sèmè-Podji', pays: 'Bénin', proprietaire_id: 'prop-1' },
  { id: 'm-pkg', nom: 'Maison PKG', adresse: 'Gbégamey', ville: 'Cotonou', pays: 'Bénin', proprietaire_id: 'prop-1' }
];

// 3. UNITÉS
export const UNITES: Unite[] = [
  // Maison GDM
  { id: 'u-gdm-r1', nom: 'R1', type: TypeUnite.APPARTEMENT, loyer_mensuel: 150000, statut: StatutUnite.OCCUPE, maison_id: 'm-gdm' },
  { id: 'u-gdm-r2', nom: 'R2', type: TypeUnite.APPARTEMENT, loyer_mensuel: 120000, statut: StatutUnite.OCCUPE, maison_id: 'm-gdm' },
  // Maison Z
  { id: 'u-z-z1', nom: 'Z1', type: TypeUnite.STUDIO, loyer_mensuel: 45000, statut: StatutUnite.OCCUPE, maison_id: 'm-z' },
  { id: 'u-z-z2', nom: 'Z2', type: TypeUnite.CHAMBRE_SIMPLE, loyer_mensuel: 25000, statut: StatutUnite.LIBRE, maison_id: 'm-z' },
  // Maison CC
  { id: 'u-cc-1', nom: 'CC1', type: TypeUnite.BOUTIQUE, loyer_mensuel: 80000, statut: StatutUnite.OCCUPE, maison_id: 'm-cc' },
  // Maison PKG
  { id: 'u-pkg-b1', nom: 'PKGB1', type: TypeUnite.BOUTIQUE, loyer_mensuel: 100000, statut: StatutUnite.OCCUPE, maison_id: 'm-pkg' },
  { id: 'u-pkg-s1', nom: 'PKGS1', type: TypeUnite.STUDIO, loyer_mensuel: 55000, statut: StatutUnite.MAINTENANCE, maison_id: 'm-pkg' },
  // Maison PK
  { id: 'u-pk-1', nom: 'PK1', type: TypeUnite.CHAMBRE_SIMPLE, loyer_mensuel: 30000, statut: StatutUnite.OCCUPE, maison_id: 'm-pk' },
  { id: 'u-pk-2', nom: 'PK2', type: TypeUnite.CHAMBRE_SIMPLE, loyer_mensuel: 30000, statut: StatutUnite.OCCUPE, maison_id: 'm-pk' },
  { id: 'u-pk-3', nom: 'PK3', type: TypeUnite.CHAMBRE_SIMPLE, loyer_mensuel: 30000, statut: StatutUnite.OCCUPE, maison_id: 'm-pk' },
  { id: 'u-pk-4', nom: 'PK4', type: TypeUnite.CHAMBRE_SIMPLE, loyer_mensuel: 30000, statut: StatutUnite.OCCUPE, maison_id: 'm-pk' },
  { id: 'u-pk-5', nom: 'PK5', type: TypeUnite.CHAMBRE_SIMPLE, loyer_mensuel: 30000, statut: StatutUnite.OCCUPE, maison_id: 'm-pk' },
  // Autres
  { id: 'u-t1-1', nom: 'T1-1', type: TypeUnite.APPARTEMENT, loyer_mensuel: 135000, statut: StatutUnite.OCCUPE, maison_id: 'm-t1' },
  { id: 'u-t2-1', nom: 'T2-1', type: TypeUnite.STUDIO, loyer_mensuel: 60000, statut: StatutUnite.OCCUPE, maison_id: 'm-t2' },
  { id: 'u-v-1', nom: 'V1', type: TypeUnite.CHAMBRE_SIMPLE, loyer_mensuel: 28000, statut: StatutUnite.OCCUPE, maison_id: 'm-v' }
];

// 4. LOCATAIRES
export const LOCATAIRES: Locataire[] = [
  { id: 'loc-1', nom: 'TOSSOU', prenom: 'Kofi', telephone: '+229 90 01 02 03', email: 'kofi.tossou@mail.com', nationalite: 'Béninoise', unite_id: 'u-gdm-r1', date_entree: '2023-01-01', numero_piece_identite: 'ID-445566' },
  { id: 'loc-2', nom: 'SOW', prenom: 'Fatou', telephone: '+229 97 11 22 33', email: 'f.sow@mail.com', nationalite: 'Sénégalaise', unite_id: 'u-gdm-r2', date_entree: '2023-05-10', numero_piece_identite: 'ID-889900' },
  { id: 'loc-3', nom: 'KONÉ', prenom: 'Moussa', telephone: '+225 01 02 03 04', email: 'm.kone@mail.com', nationalite: 'Ivoirienne', unite_id: 'u-z-z1', date_entree: '2023-11-01', numero_piece_identite: 'ID-112233' },
  { id: 'loc-4', nom: 'OUÉDRAOGO', prenom: 'Aminata', telephone: '+226 70 00 00 01', email: 'aminata.o@mail.com', nationalite: 'Burkinabè', unite_id: 'u-cc-1', date_entree: '2023-02-15', numero_piece_identite: 'ID-998877' },
  { id: 'loc-5', nom: 'BAH', prenom: 'Yao', telephone: '+229 66 55 44 33', email: 'yao.bah@mail.com', nationalite: 'Béninoise', unite_id: 'u-pkg-b1', date_entree: '2022-06-01', numero_piece_identite: 'ID-123456' },
  { id: 'loc-6', nom: 'MENSAH', prenom: 'Akosua', telephone: '+233 24 555 666', email: 'akosua.m@mail.com', nationalite: 'Ghanéenne', unite_id: 'u-pk-1', date_entree: '2024-01-01', numero_piece_identite: 'ID-000111' },
  { id: 'loc-7', nom: 'COULIBALY', prenom: 'Ibrahim', telephone: '+223 70 01 02 03', email: 'i.coulibaly@mail.com', nationalite: 'Malienne', unite_id: 'u-pk-2', date_entree: '2023-12-15', numero_piece_identite: 'ID-222333' },
  { id: 'loc-8', nom: 'DIOP', prenom: 'Ousmane', telephone: '+221 77 123 45 67', email: 'o.diop@mail.com', nationalite: 'Sénégalaise', unite_id: 'u-pk-3', date_entree: '2023-10-01', numero_piece_identite: 'ID-333444' },
  { id: 'loc-9', nom: 'TRAORÉ', prenom: 'Bakary', telephone: '+224 60 11 22 33', email: 'b.traore@mail.com', nationalite: 'Guinéenne', unite_id: 'u-pk-4', date_entree: '2024-02-01', numero_piece_identite: 'ID-444555' },
  { id: 'loc-10', nom: 'ZOH', prenom: 'Clarisse', telephone: '+229 60 70 80 90', email: 'c.zoh@mail.com', nationalite: 'Béninoise', unite_id: 'u-pk-5', date_entree: '2023-09-01', numero_piece_identite: 'ID-555666' },
  { id: 'loc-11', nom: 'ADAMOU', prenom: 'Issifou', telephone: '+227 90 11 11 11', email: 'i.adamou@mail.com', nationalite: 'Nigérienne', unite_id: 'u-t1-1', date_entree: '2023-08-01', numero_piece_identite: 'ID-666777' },
  { id: 'loc-12', nom: 'OKE', prenom: 'Samuel', telephone: '+234 80 12345678', email: 's.oke@mail.com', nationalite: 'Nigériane', unite_id: 'u-t2-1', date_entree: '2023-11-20', numero_piece_identite: 'ID-777888' },
  { id: 'loc-13', nom: 'BOCO', prenom: 'Pierre', telephone: '+229 95 00 11 22', email: 'p.boco@mail.com', nationalite: 'Béninoise', unite_id: 'u-v-1', date_entree: '2023-04-01', numero_piece_identite: 'ID-888999' },
  { id: 'loc-14', nom: 'NDIAYE', prenom: 'Awa', telephone: '+221 70 999 88 77', email: 'a.ndiaye@mail.com', nationalite: 'Sénégalaise', unite_id: 'u-pkg-s1', date_entree: '2024-03-01', numero_piece_identite: 'ID-009988' },
  { id: 'loc-15', nom: 'AGOSSOU', prenom: 'Marius', telephone: '+229 61 22 33 44', email: 'm.agossou@mail.com', nationalite: 'Béninoise', unite_id: 'u-z-z2', date_entree: '2024-04-01', numero_piece_identite: 'ID-221133' }
];

// 5. PAIEMENTS (Historique 6 mois)
export const PAIEMENTS: Paiement[] = [
  // Paiements réussis pour loc-1 (GDM R1)
  { id: 'p-1', locataire_id: 'loc-1', unite_id: 'u-gdm-r1', maison_id: 'm-gdm', mois: 1, annee: 2024, montant: 150000, type: TypePaiement.CASH, statut: StatutPaiement.PAYE, reference_immo: 'IMMO-GDM-202401-R1-001', date_paiement: '2024-01-05', confirme_par_proprio: true },
  { id: 'p-2', locataire_id: 'loc-1', unite_id: 'u-gdm-r1', maison_id: 'm-gdm', mois: 2, annee: 2024, montant: 150000, type: TypePaiement.MOMO, statut: StatutPaiement.PAYE, reference_immo: 'IMMO-GDM-202402-R1-002', numero_transaction_momo: 'TXN889221', operateur_momo: OperateurMoMo.MTN, date_paiement: '2024-02-02', confirme_par_proprio: true },
  { id: 'p-3', locataire_id: 'loc-1', unite_id: 'u-gdm-r1', maison_id: 'm-gdm', mois: 3, annee: 2024, montant: 150000, type: TypePaiement.MOMO, statut: StatutPaiement.PAYE, reference_immo: 'IMMO-GDM-202403-R1-003', numero_transaction_momo: 'TXN990112', operateur_momo: OperateurMoMo.MTN, date_paiement: '2024-03-03', confirme_par_proprio: true },
  { id: 'p-4', locataire_id: 'loc-1', unite_id: 'u-gdm-r1', maison_id: 'm-gdm', mois: 4, annee: 2024, montant: 150000, type: TypePaiement.MOMO, statut: StatutPaiement.EN_ATTENTE, reference_immo: 'IMMO-GDM-202404-R1-004', numero_transaction_momo: 'TXN001122', operateur_momo: OperateurMoMo.WAVE, date_paiement: '2024-04-25', confirme_par_proprio: false },

  // Arriéré pour loc-3 (Z1 - Mars impayé)
  { id: 'p-5', locataire_id: 'loc-3', unite_id: 'u-z-z1', maison_id: 'm-z', mois: 3, annee: 2024, montant: 45000, type: TypePaiement.MOMO, statut: StatutPaiement.REJETE, reference_immo: 'IMMO-Z-202403-Z1-001', date_paiement: '', confirme_par_proprio: false },

  // Paiement en attente MoMo
  { id: 'p-6', locataire_id: 'loc-4', unite_id: 'u-cc-1', maison_id: 'm-cc', mois: 4, annee: 2024, montant: 80000, type: TypePaiement.MOMO, statut: StatutPaiement.EN_ATTENTE, reference_immo: 'IMMO-CC-202404-CC1-002', numero_transaction_momo: 'TXN778899', operateur_momo: OperateurMoMo.MTN, date_paiement: '2024-04-27', confirme_par_proprio: false },

  // Arriéré multiple pour loc-13
  { id: 'p-7', locataire_id: 'loc-13', unite_id: 'u-v-1', maison_id: 'm-v', mois: 2, annee: 2024, montant: 28000, type: TypePaiement.CASH, statut: StatutPaiement.EXPIRE, reference_immo: 'IMMO-V-202402-V1-001', date_paiement: '', confirme_par_proprio: false },
  { id: 'p-8', locataire_id: 'loc-13', unite_id: 'u-v-1', maison_id: 'm-v', mois: 3, annee: 2024, montant: 28000, type: TypePaiement.CASH, statut: StatutPaiement.EXPIRE, reference_immo: 'IMMO-V-202403-V1-001', date_paiement: '', confirme_par_proprio: false }
];

// 7. DÉPENSES
export const DEPENSES: Depense[] = [
  { id: 'd-1', maison_id: 'm-gdm', libelle: 'Réparation Plomberie R1', montant: 15000, date_depense: '2024-02-10', categorie: CategorieDepense.PLOMBERIE },
  { id: 'd-2', maison_id: 'm-pkg', libelle: 'Peinture Façade', montant: 45000, date_depense: '2024-03-20', categorie: CategorieDepense.PEINTURE },
  { id: 'd-3', maison_id: 'm-z', libelle: 'Réparation Portail', montant: 8500, date_depense: '2024-04-05', categorie: CategorieDepense.AUTRE }
];

// 8. CONTRATS
export const CONTRATS: Contrat[] = [
  { id: 'c-1', locataire_id: 'loc-1', unite_id: 'u-gdm-r1', date_effet: '2024-01-01', date_fin: '2024-12-31', preavis_jours: 30, caution_mois: 2, statut: StatutContrat.ACTIF },
  { id: 'c-2', locataire_id: 'loc-12', unite_id: 'u-t2-1', date_effet: '2023-11-20', date_fin: '2024-05-20', preavis_jours: 30, caution_mois: 3, statut: StatutContrat.ACTIF }, // Expire bientôt
  { id: 'c-3', locataire_id: 'loc-3', unite_id: 'u-z-z1', date_effet: '2023-11-01', date_fin: '2024-10-31', preavis_jours: 30, caution_mois: 1, statut: StatutContrat.ACTIF }
];

// 9. NOTIFICATIONS
export enum TypeNotification {
  URGENT = 'urgent',
  IMPORTANT = 'important',
  INFO = 'info'
}

export interface Notification {
  id: string;
  type: TypeNotification;
  titre: string;
  message: string;
  date: string;
  lu: boolean;
  actionPath?: string;
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: TypeNotification.URGENT,
    titre: 'Paiement en attente',
    message: 'Kofi Mensah a soumis une preuve de paiement MoMo (55,000 FCFA) il y a 4h.',
    date: '2026-04-28T08:30:00Z',
    lu: false,
    actionPath: '/dashboard/paiements'
  },
  {
    id: 'notif-2',
    type: TypeNotification.URGENT,
    titre: 'Contrat expiré',
    message: 'Le contrat de Moussa Traoré (Unité B2) est expiré depuis 3 jours.',
    date: '2026-04-25T10:00:00Z',
    lu: false,
    actionPath: '/dashboard/contrats'
  },
  {
    id: 'notif-3',
    type: TypeNotification.IMPORTANT,
    titre: 'Avance électricité faible',
    message: 'Le crédit électricité de l\'Unité R1 (Maison GDM) sera épuisé dans environ 15 jours.',
    date: '2026-04-27T15:45:00Z',
    lu: false,
    actionPath: '/dashboard'
  },
  {
    id: 'notif-4',
    type: TypeNotification.INFO,
    titre: 'Bilan mensuel prêt',
    message: 'Le rapport financier complet pour le mois de Mars est disponible dans vos archives.',
    date: '2026-04-01T09:00:00Z',
    lu: true,
    actionPath: '/dashboard/impots'
  },
  {
    id: 'notif-5',
    type: TypeNotification.IMPORTANT,
    titre: 'Contrat arrive à échéance',
    message: 'Le bail de Fatou Sow expire dans 28 jours.',
    date: '2026-04-28T07:15:00Z',
    lu: false,
    actionPath: '/dashboard/contrats'
  }
];

// Fonctions utilitaires
export const getArrieresLocataire = (locataireId: string) => {
  return PAIEMENTS.filter(p => p.locataire_id === locataireId && (p.statut === StatutPaiement.REJETE || p.statut === StatutPaiement.EXPIRE));
};

export const getTotalArrieres = (locataireId: string) => {
  return getArrieresLocataire(locataireId).reduce((sum, p) => sum + p.montant, 0);
};

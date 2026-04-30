/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import useSWR from 'swr';
import { supabase, Maison, Unite, Locataire, Paiement, Contrat, Depense, MomoConfig, Profile, Reservation, Avance, Actif, Caution, HistoriqueLocataire, Gestionnaire } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function generateReferenceImmo(maisonNom: string, annee: number, mois: number, uniteNom: string): string {
  const maisonCode = maisonNom.replace(/\s/g, '').substring(0, 3).toUpperCase();
  const uniteCode = uniteNom.replace(/\s/g, '').toUpperCase();
  const counter = Date.now().toString().slice(-5);
  return `IMMO-${maisonCode}-${annee}${String(mois).padStart(2, '0')}-${uniteCode}-${counter}`;
}

// Generic fetcher for Supabase
async function fetcher<T>(key: string): Promise<T[]> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const [table, ...filters] = key.split(':');
  let query = supabase.from(table).select('*');
  
  // Apply filters if provided
  for (const filter of filters) {
    const [field, value] = filter.split('=');
    if (field && value) {
      query = query.eq(field, value);
    }
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as T[];
}

// Hook for fetching maisons (properties)
export function useMaisons() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Maison[]>(
    user ? `maisons:proprietaire_id=${user.id}` : null,
    fetcher
  );

  return {
    maisons: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for fetching a single maison with its units
export function useMaisonDetails(maisonId: string) {
  const { data: maison, error: maisonError, isLoading: maisonLoading } = useSWR<Maison[]>(
    maisonId ? `maisons:id=${maisonId}` : null,
    fetcher
  );

  const { data: unites, error: unitesError, isLoading: unitesLoading } = useSWR<Unite[]>(
    maisonId ? `unites:maison_id=${maisonId}` : null,
    fetcher
  );

  const { data: locataires, error: locatairesError, isLoading: locatairesLoading } = useSWR<Locataire[]>(
    maisonId ? async () => {
      if (!supabase || !maisonId) return [];
      // Get locataires via their units in this maison
      const unitIds = unites?.map(u => u.id) || [];
      if (unitIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('locataires')
        .select('*')
        .in('unite_id', unitIds);
      
      if (error) throw error;
      return data;
    } : null
  );

  return {
    maison: maison?.[0] || null,
    unites: unites || [],
    locataires: locataires || [],
    isLoading: maisonLoading || unitesLoading || locatairesLoading,
    isError: maisonError || unitesError || locatairesError,
  };
}

// Hook for fetching units
export function useUnites(maisonId?: string) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<Unite[]>(
    user && maisonId ? `unites:maison_id=${maisonId}` : null,
    fetcher
  );

  return {
    unites: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for fetching all units across all properties
export function useAllUnites() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<Unite[]>(
    user ? async () => {
      if (!supabase) return [];
      
      // First get all maisons for this user
      const { data: maisons, error: maisonsError } = await supabase
        .from('maisons')
        .select('id')
        .eq('proprietaire_id', user.id);
      
      if (maisonsError) throw maisonsError;
      if (!maisons || maisons.length === 0) return [];
      
      const maisonIds = maisons.map(m => m.id);
      
      const { data: unites, error: unitesError } = await supabase
        .from('unites')
        .select('*')
        .in('maison_id', maisonIds);
      
      if (unitesError) throw unitesError;
      return unites;
    } : null,
    { fallbackData: [] }
  );

  return {
    unites: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for fetching locataires (tenants)
export function useLocataires() {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<Locataire[]>(
    user ? `locataires:proprietaire_id=${user.id}` : null,
    fetcher
  );

  return {
    locataires: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for fetching paiements (payments)
export function usePaiements(filters?: { mois?: number; annee?: number; statut?: string }) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<Paiement[]>(
    user ? async () => {
      if (!supabase) return [];
      
      let query = supabase
        .from('paiements')
        .select('*')
        .eq('proprietaire_id', user.id);
      
      if (filters?.mois) query = query.eq('mois', filters.mois);
      if (filters?.annee) query = query.eq('annee', filters.annee);
      if (filters?.statut) query = query.eq('statut', filters.statut);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } : null,
    { fallbackData: [] }
  );

  return {
    paiements: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for pending payments
export function usePendingPaiements() {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<Paiement[]>(
    user ? async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('paiements')
        .select('*')
        .eq('proprietaire_id', user.id)
        .eq('statut', 'en_attente')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } : null,
    { fallbackData: [] }
  );

  return {
    pendingPaiements: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for fetching contrats (contracts)
export function useContrats() {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<Contrat[]>(
    user ? `contrats:proprietaire_id=${user.id}` : null,
    fetcher
  );

  return {
    contrats: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for fetching depenses (expenses)
export function useDepenses(maisonId?: string) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<Depense[]>(
    user ? async () => {
      if (!supabase) return [];
      
      let query = supabase
        .from('depenses')
        .select('*')
        .eq('proprietaire_id', user.id);
      
      if (maisonId) query = query.eq('maison_id', maisonId);
      
      const { data, error } = await query.order('date_depense', { ascending: false });
      if (error) throw error;
      return data;
    } : null,
    { fallbackData: [] }
  );

  return {
    depenses: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for MoMo configuration
export function useMomoConfigs() {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<MomoConfig[]>(
    user ? `momo_configs:proprietaire_id=${user.id}` : null,
    fetcher
  );

  return {
    momoConfigs: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Hook for dashboard stats
export function useDashboardStats() {
  const { user } = useAuth();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data, error, isLoading } = useSWR(
    user ? `dashboard-stats-${user.id}-${currentMonth}-${currentYear}` : null,
    async () => {
      if (!supabase || !user) return null;

      // Fetch maisons first, then all others in parallel
      const maisonsRes = await supabase.from('maisons').select('id').eq('proprietaire_id', user.id);
      const maisonIds = maisonsRes.data?.map(m => m.id) || [];

      const [unitesRes, paiementsRes, locatairesRes] = await Promise.all([
        maisonIds.length > 0
          ? supabase.from('unites').select('id, statut, maison_id, loyer_mensuel').in('maison_id', maisonIds)
          : Promise.resolve({ data: [] }),
        supabase.from('paiements').select('montant, mois, annee, statut').eq('proprietaire_id', user.id),
        supabase.from('locataires').select('id').eq('proprietaire_id', user.id),
      ]);

      const maisons = maisonsRes.data || [];
      const unites = unitesRes.data || [];
      const paiements = paiementsRes.data || [];

      // Calculate metrics
      const totalUnites = unites.length;
      const unitesOccupees = unites.filter(u => u.statut === 'occupé').length;
      const tauxOccupation = totalUnites > 0 ? Math.round((unitesOccupees / totalUnites) * 100) : 0;

      const totalEncaisseMois = paiements
        .filter(p => p.mois === currentMonth && p.annee === currentYear && p.statut === 'payé')
        .reduce((sum, p) => sum + p.montant, 0);

      const pendingPayments = paiements.filter(p => p.statut === 'en_attente');

      // Calculate total expected rent
      const totalAttendu = unites
        .filter(u => u.statut === 'occupé')
        .reduce((sum, u) => sum + (u.loyer_mensuel || 0), 0);

      // Calculate arrears (simplified: unpaid months)
      const totalArrieres = paiements
        .filter(p => p.statut === 'en_attente' || p.statut === 'rejeté')
        .reduce((sum, p) => sum + p.montant, 0);

      return {
        totalMaisons: maisons.length,
        totalUnites,
        unitesOccupees,
        tauxOccupation,
        totalEncaisseMois,
        totalAttendu,
        totalArrieres,
        pendingPaymentsCount: pendingPayments.length,
        totalLocataires: locatairesRes.data?.length || 0,
      };
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
  };
}

// CRUD Operations

export async function createMaison(data: Omit<Maison, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: result, error } = await supabase
    .from('maisons')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

export async function updateMaison(id: string, data: Partial<Maison>) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: result, error } = await supabase
    .from('maisons')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

export async function deleteMaison(id: string) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase.from('maisons').delete().eq('id', id);
  if (error) throw error;
}

export async function createUnite(data: Omit<Unite, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: result, error } = await supabase
    .from('unites')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

export async function updateUnite(id: string, data: Partial<Unite>) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: result, error } = await supabase
    .from('unites')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

export async function createLocataire(data: Omit<Locataire, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: result, error } = await supabase
    .from('locataires')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

export async function updateLocataire(id: string, data: Partial<Locataire>) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: result, error } = await supabase
    .from('locataires')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

export async function createPaiement(
  data: Omit<Paiement, 'id' | 'created_at' | 'updated_at' | 'reference_immo'>,
  maisonNom: string,
  uniteNom: string
) {
  if (!supabase) throw new Error('Supabase not configured');

  const reference_immo = generateReferenceImmo(maisonNom, data.annee, data.mois, uniteNom);

  const { data: result, error } = await supabase
    .from('paiements')
    .insert({ ...data, reference_immo })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updatePaiement(id: string, data: Partial<Paiement>) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: result, error } = await supabase
    .from('paiements')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

export async function confirmPaiement(id: string) {
  return updatePaiement(id, { 
    statut: 'payé', 
    confirme_par_proprio: true,
    date_paiement: new Date().toISOString().split('T')[0],
  });
}

export async function rejectPaiement(id: string, notes?: string) {
  return updatePaiement(id, { 
    statut: 'rejeté', 
    notes: notes || 'Paiement rejeté par le propriétaire',
  });
}

export async function createContrat(data: Omit<Contrat, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: result, error } = await supabase
    .from('contrats')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

export async function createMomoConfig(data: Omit<MomoConfig, 'id' | 'created_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: result, error } = await supabase
    .from('momo_configs')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

export async function deleteMomoConfig(id: string) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase.from('momo_configs').delete().eq('id', id);
  if (error) throw error;
}

// Hook for reservations (short-term rentals)
export function useReservations(maisonId?: string) {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user ? async () => {
      if (!supabase) return [];

      let query = supabase
        .from('reservations')
        .select('*')
        .eq('proprietaire_id', user.id);

      if (maisonId) query = query.eq('maison_id', maisonId);

      const { data, error } = await query.order('date_debut', { ascending: false });
      if (error) throw error;
      return data;
    } : null,
    { fallbackData: [] }
  );

  return {
    reservations: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Create reservation
export async function createReservation(data: Omit<Reservation, 'id' | 'created_at'>) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: result, error } = await supabase
    .from('reservations')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Update reservation
export async function updateReservation(id: string, data: Partial<Reservation>) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: result, error } = await supabase
    .from('reservations')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function createDepense(data: Omit<Depense, 'id' | 'created_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: result, error } = await supabase.from('depenses').insert(data).select().single();
  if (error) throw error;
  return result;
}

export async function deleteDepense(id: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('depenses').delete().eq('id', id);
  if (error) throw error;
}

export function useAvances(locataireId?: string) {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Avance[]>(
    user ? async () => {
      if (!supabase) return [];
      let query = supabase.from('avances').select('*').eq('proprietaire_id', user.id);
      if (locataireId) query = query.eq('locataire_id', locataireId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } : null,
    { fallbackData: [] }
  );
  return { avances: data || [], isLoading, isError: error, refresh: mutate };
}

// ============================================
// INVITATIONS
// ============================================

export interface Invitation {
  id: string;
  proprietaire_id: string;
  unite_id: string | null;
  locataire_nom: string | null;
  locataire_prenom: string | null;
  locataire_telephone: string | null;
  code: string;
  statut: 'en_attente' | 'utilisé' | 'expiré';
  expires_at: string;
  created_at: string;
}

// ============================================
// ACTIFS IMMOBILIERS
// ============================================

export function useActifs() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Actif[]>(
    user ? `actifs-${user.id}` : null,
    async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('actifs').select('*').eq('proprietaire_id', user!.id)
        .order('valeur_actuelle', { ascending: false });
      if (error) throw error;
      return data;
    },
    { fallbackData: [] }
  );
  return { actifs: data || [], isLoading, isError: error, refresh: mutate };
}

export async function createActif(data: Omit<Actif, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: result, error } = await supabase.from('actifs').insert(data).select().single();
  if (error) throw error;
  return result;
}

export async function updateActif(id: string, data: Partial<Actif>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: result, error } = await supabase.from('actifs').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return result;
}

export async function deleteActif(id: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('actifs').delete().eq('id', id);
  if (error) throw error;
}

export function useInvitations() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Invitation[]>(
    user ? `invitations-${user.id}` : null,
    async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('proprietaire_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    { fallbackData: [] }
  );
  return { invitations: data || [], isLoading, isError: error, refresh: mutate };
}

export async function createInvitation(data: Omit<Invitation, 'id' | 'created_at' | 'code' | 'statut' | 'expires_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const code = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: result, error } = await supabase
    .from('invitations')
    .insert({ ...data, code, statut: 'en_attente', expires_at })
    .select().single();
  if (error) throw error;
  return result;
}

export async function marquerInvitationUtilisee(code: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('invitations')
    .update({ statut: 'utilisé' })
    .eq('code', code)
    .select().single();
  if (error) throw error;
  return data;
}

export async function getInvitationByCode(code: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('invitations')
    .select('*, unites(nom, loyer_mensuel, maison_id, maisons(nom)), profiles(nom, prenom)')
    .eq('code', code.toUpperCase())
    .eq('statut', 'en_attente')
    .single();
  if (error) return null;
  return data;
}

export async function createAvance(data: Omit<Avance, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: result, error } = await supabase.from('avances').insert(data).select().single();
  if (error) throw error;
  return result;
}

export async function imputerAvance(avanceId: string, montantImpute: number, montantRestantActuel: number) {
  if (!supabase) throw new Error('Supabase not configured');
  const nouveau = Math.max(0, montantRestantActuel - montantImpute);
  const { data: result, error } = await supabase
    .from('avances')
    .update({ montant_restant: nouveau, updated_at: new Date().toISOString() })
    .eq('id', avanceId)
    .select()
    .single();
  if (error) throw error;
  return result;
}

// ============================================
// NOTIFICATIONS (réelles depuis Supabase)
// ============================================

export interface NotifDB {
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

export function useNotifications() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<NotifDB[]>(
    user ? `notifications-${user.id}` : null,
    async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    { fallbackData: [], refreshInterval: 30000 }
  );
  return { notifications: data || [], isLoading, isError: error, refresh: mutate };
}

export async function markNotificationRead(id: string) {
  if (!supabase) throw new Error('Supabase not configured');
  await supabase.from('notifications').update({ lu: true }).eq('id', id);
}

export async function markAllNotificationsRead(userId: string) {
  if (!supabase) throw new Error('Supabase not configured');
  await supabase.from('notifications').update({ lu: true }).eq('user_id', userId).eq('lu', false);
}

export async function deleteNotification(id: string) {
  if (!supabase) throw new Error('Supabase not configured');
  await supabase.from('notifications').delete().eq('id', id);
}

// ============================================
// PROFIL LOCATAIRE (côté locataire connecté)
// ============================================

export function useMyLocataireProfile() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Locataire | null>(
    user ? `my-locataire-${user.id}` : null,
    async () => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('locataires')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) return null;
      return data;
    }
  );
  return { locataire: data || null, isLoading, isError: error, refresh: mutate };
}

export async function linkLocataireToUser(
  userId: string,
  proprietaireId: string,
  nom: string,
  prenom: string,
  telephone: string,
  email?: string | null,
  uniteId?: string | null,
  maisonId?: string | null,
) {
  if (!supabase) throw new Error('Supabase not configured');

  // Chercher un locataire existant (même nom + proprio, sans user_id encore)
  const { data: existing } = await supabase
    .from('locataires')
    .select('id, unite_id')
    .eq('proprietaire_id', proprietaireId)
    .ilike('nom', nom)
    .ilike('prenom', prenom)
    .is('user_id', null)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, unknown> = { user_id: userId };
    if (uniteId && !existing.unite_id) updates.unite_id = uniteId;
    if (email) updates.email = email;
    await supabase.from('locataires').update(updates).eq('id', existing.id);
    if (uniteId) {
      await supabase.from('unites').update({ statut: 'occupé' }).eq('id', uniteId);
    }
    return existing.id;
  }

  // Créer un nouveau record locataire complet
  const payload: Record<string, unknown> = {
    user_id: userId,
    proprietaire_id: proprietaireId,
    nom, prenom, telephone,
    email: email || null,
    unite_id: uniteId || null,
    date_entree: new Date().toISOString().split('T')[0],
    photo_piece_url: null,
    nationalite: null,
    numero_piece_identite: null,
  };
  const { data, error } = await supabase.from('locataires').insert(payload).select().single();
  if (error) throw error;

  if (uniteId) {
    await supabase.from('unites').update({ statut: 'occupé' }).eq('id', uniteId);
  }
  return data.id;
}

// ============================================
// CAUTIONS
// ============================================

export function useCautions(uniteId?: string) {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Caution[]>(
    user ? async () => {
      if (!supabase) return [];
      let query = supabase.from('cautions').select('*').eq('proprietaire_id', user.id);
      if (uniteId) query = query.eq('unite_id', uniteId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } : null,
    { fallbackData: [] }
  );
  return { cautions: data || [], isLoading, isError: error, refresh: mutate };
}

export async function createCaution(data: Omit<Caution, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: result, error } = await supabase.from('cautions').insert(data).select().single();
  if (error) throw error;
  return result;
}

export async function updateCaution(id: string, data: Partial<Caution>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: result, error } = await supabase
    .from('cautions')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return result;
}

export async function deleteCaution(id: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('cautions').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// HISTORIQUE LOCATAIRES
// ============================================

export function useHistoriqueLocataires(uniteId?: string) {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<HistoriqueLocataire[]>(
    user ? async () => {
      if (!supabase) return [];
      let query = supabase.from('historique_locataires').select('*').eq('proprietaire_id', user.id);
      if (uniteId) query = query.eq('unite_id', uniteId);
      const { data, error } = await query.order('date_entree', { ascending: false });
      if (error) throw error;
      return data;
    } : null,
    { fallbackData: [] }
  );
  return { historique: data || [], isLoading, isError: error, refresh: mutate };
}

export async function createHistorique(data: Omit<HistoriqueLocataire, 'id' | 'created_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: result, error } = await supabase.from('historique_locataires').insert(data).select().single();
  if (error) throw error;
  return result;
}

export async function updateHistorique(id: string, data: Partial<HistoriqueLocataire>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: result, error } = await supabase
    .from('historique_locataires').update(data).eq('id', id).select().single();
  if (error) throw error;
  return result;
}

// ============================================
// GESTIONNAIRES
// ============================================

export function useGestionnaires() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Gestionnaire[]>(
    user ? async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('gestionnaires').select('*').eq('proprietaire_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } : null,
    { fallbackData: [] }
  );
  return { gestionnaires: data || [], isLoading, isError: error, refresh: mutate };
}

export async function inviterGestionnaire(data: Omit<Gestionnaire, 'id' | 'created_at' | 'updated_at' | 'code_invitation' | 'user_id' | 'expires_at'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const code = 'GEST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: result, error } = await supabase
    .from('gestionnaires')
    .insert({ ...data, code_invitation: code, expires_at, statut: 'invité' })
    .select().single();
  if (error) throw error;
  return result;
}

export async function updateGestionnaire(id: string, data: Partial<Gestionnaire>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: result, error } = await supabase
    .from('gestionnaires').update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return result;
}

export async function supprimerGestionnaire(id: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('gestionnaires').delete().eq('id', id);
  if (error) throw error;
}

// Track virtual tour visit
export async function trackVirtualTourVisit(uniteId: string, source?: string) {
  if (!supabase) throw new Error('Supabase not configured');

  try {
    const { error } = await supabase
      .from('visites_virtuelles')
      .insert({
        unite_id: uniteId,
        source: source || 'direct',
      });

    if (error) console.error('[v0] Error tracking visit:', error);
  } catch (err) {
    console.error('[v0] Error tracking virtual tour visit:', err);
  }
}

// Get single unit
export function getUniteById(uniteId: string) {
  return useSWR(
    uniteId ? async () => {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('unites')
        .select('*')
        .eq('id', uniteId)
        .single();

      if (error) throw error;
      return data;
    } : null
  );
}

// Get public unit listing (for tenants/public)
export function usePublicUnites(filters?: {
  ville?: string;
  type_location?: string;
  type?: string;
}) {
  const { data, error, isLoading } = useSWR(
    ['public-unites', filters?.ville, filters?.type_location],
    async () => {
      if (!supabase) return [];

      const query = supabase
        .from('unites')
        .select('*, maisons:maison_id(*)');

      const { data: unitesData, error: queryError } = await query;
      if (queryError) throw queryError;

      let result = unitesData || [];

      // Filter by city if specified
      if (filters?.ville) {
        result = result.filter(u => u.maisons?.ville === filters.ville);
      }

      // Filter by rental type if specified
      if (filters?.type_location) {
        result = result.filter(u => u.type_location === filters.type_location);
      }

      return result;
    }
  );

  return {
    unites: data || [],
    isLoading,
    isError: error,
  };
}

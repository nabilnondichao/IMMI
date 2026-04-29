/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import useSWR from 'swr';
import { supabase, Maison, Unite, Locataire, Paiement, Contrat, Depense, MomoConfig, Profile, Reservation, Avance } from '../lib/supabase';
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

      // Fetch all required data in parallel
      const [maisonsRes, unitesRes, paiementsRes, locatairesRes] = await Promise.all([
        supabase.from('maisons').select('id').eq('proprietaire_id', user.id),
        supabase.from('unites').select('id, statut, maison_id, loyer_mensuel').in('maison_id', 
          (await supabase.from('maisons').select('id').eq('proprietaire_id', user.id)).data?.map(m => m.id) || []
        ),
        supabase.from('paiements').select('*').eq('proprietaire_id', user.id),
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

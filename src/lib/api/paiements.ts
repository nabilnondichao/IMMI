/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabase';
import { PAIEMENTS } from '../mock-data';
import { Paiement } from '@/types/immoafrik';

export const getPaiements = async () => {
  if (!supabase) return PAIEMENTS;

  const { data, error } = await supabase
    .from('paiements')
    .select('*, locataire:locataires(*), unite:unites(*)')
    .order('created_at', { ascending: false });

  if (error) return PAIEMENTS;
  return data;
};

export const createPaiement = async (paiement: Partial<Paiement>) => {
  if (!supabase) {
    console.log('Mock: Paiement submitted', paiement);
    return { data: paiement, error: null };
  }
  return await supabase.from('paiements').insert([paiement]).select().single();
};

export const confirmerMoMo = async (id: string, statut: string) => {
  if (!supabase) return { success: true };
  return await supabase.from('paiements').update({ statut }).eq('id', id);
};

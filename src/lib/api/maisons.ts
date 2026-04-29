/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabase';
import { MAISONS } from '../mock-data';
import { Maison } from '@/types/immoafrik';

export const getMaisons = async (): Promise<Maison[]> => {
  if (!supabase) return MAISONS;

  const { data, error } = await supabase
    .from('maisons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching maisons:', error);
    return MAISONS;
  }
  return data as Maison[];
};

export const createMaison = async (maison: Partial<Maison>) => {
  if (!supabase) {
    console.log('Mock: Maison created locally', maison);
    return { data: maison, error: null };
  }

  return await supabase.from('maisons').insert([maison]).select().single();
};

export const updateMaison = async (id: string, updates: Partial<Maison>) => {
  if (!supabase) return { data: updates, error: null };
  return await supabase.from('maisons').update(updates).eq('id', id).select().single();
};

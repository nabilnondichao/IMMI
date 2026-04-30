import React, { useState, useMemo } from 'react';
import {
  ClipboardList, Plus, Loader2, Home, CheckCircle2,
  AlertCircle, Clock, Edit2, Trash2, ChevronRight,
  User, Calendar, FileText, Camera
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useMaisons, useAllUnites, useLocataires } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import useSWR from 'swr';

interface EtatDesLieux {
  id: string;
  proprietaire_id: string;
  locataire_id: string | null;
  unite_id: string;
  maison_id: string;
  type: 'entree' | 'sortie';
  date_etat: string;
  statut: 'brouillon' | 'finalise' | 'signe';
  observations: string | null;
  pieces: PieceEtat[];
  created_at: string;
}

interface PieceEtat {
  nom: string;
  etat: 'bon' | 'moyen' | 'mauvais';
  observations: string;
}

const PIECES_DEFAULT: PieceEtat[] = [
  { nom: 'Salon', etat: 'bon', observations: '' },
  { nom: 'Chambre', etat: 'bon', observations: '' },
  { nom: 'Cuisine', etat: 'bon', observations: '' },
  { nom: 'Salle de bain', etat: 'bon', observations: '' },
  { nom: 'WC', etat: 'bon', observations: '' },
  { nom: 'Entrée', etat: 'bon', observations: '' },
];

const ETAT_CONFIG = {
  bon:    { label: 'Bon état',   color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  moyen:  { label: 'Moyen',      color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  mauvais:{ label: 'Dégradé',    color: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
};

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', color: 'bg-slate-100 text-slate-600' },
  finalise:  { label: 'Finalisé',  color: 'bg-blue-100 text-blue-700'   },
  signe:     { label: 'Signé',     color: 'bg-green-100 text-green-700' },
};

function useEtatsDesLieux() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    user ? `etats_des_lieux-${user.id}` : null,
    async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('etats_des_lieux')
        .select('*')
        .eq('proprietaire_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EtatDesLieux[];
    },
    { fallbackData: [] }
  );
  return { etats: data || [], isLoading, isError: error, refresh: mutate };
}

export default function EtatsDesLieuxPage() {
  const { user } = useAuth();
  const { etats, isLoading, refresh } = useEtatsDesLieux();
  const { maisons } = useMaisons();
  const { unites } = useAllUnites();
  const { locataires } = useLocataires();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    unite_id: '', locataire_id: '',
    type: 'entree' as 'entree' | 'sortie',
    date_etat: new Date().toISOString().split('T')[0],
    observations: '',
    pieces: PIECES_DEFAULT.map(p => ({ ...p })),
  });

  const stats = useMemo(() => ({
    total: etats.length,
    finalises: etats.filter(e => e.statut !== 'brouillon').length,
    entrees: etats.filter(e => e.type === 'entree').length,
    sorties: etats.filter(e => e.type === 'sortie').length,
  }), [etats]);

  function openCreate() {
    setForm({ unite_id: '', locataire_id: '', type: 'entree', date_etat: new Date().toISOString().split('T')[0], observations: '', pieces: PIECES_DEFAULT.map(p => ({ ...p })) });
    setFormError(null);
    setDialogOpen(true);
  }

  function updatePiece(idx: number, field: keyof PieceEtat, value: string) {
    setForm(f => {
      const pieces = [...f.pieces];
      pieces[idx] = { ...pieces[idx], [field]: value };
      return { ...f, pieces };
    });
  }

  function addPiece() {
    setForm(f => ({ ...f, pieces: [...f.pieces, { nom: 'Nouvelle pièce', etat: 'bon', observations: '' }] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.unite_id) { setFormError('Sélectionnez une unité.'); return; }
    if (!supabase || !user) return;
    setSubmitting(true); setFormError(null);
    try {
      const unite = unites.find(u => u.id === form.unite_id);
      await supabase.from('etats_des_lieux').insert({
        proprietaire_id: user.id,
        unite_id: form.unite_id,
        maison_id: unite?.maison_id || '',
        locataire_id: form.locataire_id || null,
        type: form.type,
        date_etat: form.date_etat,
        statut: 'brouillon',
        observations: form.observations || null,
        pieces: form.pieces,
      });
      setDialogOpen(false);
      refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur.');
    } finally { setSubmitting(false); }
  }

  async function changerStatut(id: string, statut: EtatDesLieux['statut']) {
    if (!supabase) return;
    await supabase.from('etats_des_lieux').update({ statut }).eq('id', id);
    refresh();
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer cet état des lieux ?') || !supabase) return;
    await supabase.from('etats_des_lieux').delete().eq('id', id);
    refresh();
  }

  const viewEtat = etats.find(e => e.id === viewId);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#B8860B]" size={40} /></div>;

  return (
    <div className="p-6 md:p-8 pb-32 lg:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">États des Lieux</h1>
          <p className="text-sm text-slate-500">Entrée et sortie de logements avec constat de l'état</p>
        </div>
        <Button onClick={openCreate} className="bg-[#B8860B] hover:bg-[#9A700A] text-white font-bold rounded-xl flex items-center gap-2">
          <Plus size={16} /> Nouvel état des lieux
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { l: 'Total', v: stats.total, c: 'text-[#1A1A2E]' },
          { l: 'Finalisés', v: stats.finalises, c: 'text-blue-600' },
          { l: 'Entrées', v: stats.entrees, c: 'text-green-600' },
          { l: 'Sorties', v: stats.sorties, c: 'text-amber-600' },
        ].map((k, i) => (
          <Card key={i} className="rounded-3xl border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.l}</p>
              <h3 className={`text-2xl font-black ${k.c}`}>{k.v}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liste */}
      {etats.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ClipboardList size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="italic text-sm">Aucun état des lieux enregistré.</p>
          <p className="text-xs text-slate-300 mt-2">Créez un état des lieux à l'entrée ou sortie d'un locataire.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {etats.map(e => {
            const unite = unites.find(u => u.id === e.unite_id);
            const maison = maisons.find(m => m.id === e.maison_id);
            const loc = locataires.find(l => l.id === e.locataire_id);
            const statut = STATUT_CONFIG[e.statut];
            const pieces: PieceEtat[] = Array.isArray(e.pieces) ? e.pieces : [];
            const mauvaises = pieces.filter(p => p.etat === 'mauvais').length;
            return (
              <div key={e.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${e.type === 'entree' ? 'bg-green-100' : 'bg-amber-100'}`}>
                    <ClipboardList size={20} className={e.type === 'entree' ? 'text-green-600' : 'text-amber-600'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-[#1A1A2E]">{e.type === 'entree' ? 'Entrée' : 'Sortie'} — {unite?.nom}</p>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${statut.color}`}>{statut.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Home size={11} /> {maison?.nom}</span>
                      {loc && <span className="flex items-center gap-1"><User size={11} /> {loc.prenom} {loc.nom}</span>}
                      <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(e.date_etat).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {mauvaises > 0 && <p className="text-[10px] text-red-500 font-bold mt-1">{mauvaises} pièce(s) en mauvais état</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setViewId(e.id)} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 transition-all">
                    <FileText size={13} /> Voir
                  </button>
                  {e.statut === 'brouillon' && (
                    <button onClick={() => changerStatut(e.id, 'finalise')} className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 transition-all">Finaliser</button>
                  )}
                  {e.statut === 'finalise' && (
                    <button onClick={() => changerStatut(e.id, 'signe')} className="px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-xs font-bold text-green-700 transition-all">Marquer signé</button>
                  )}
                  <button onClick={() => supprimer(e.id)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog Créer */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]">
          <DialogHeader><DialogTitle className="font-black text-xl">Nouvel état des lieux</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto">
              {formError && <div className="p-3 bg-red-50 rounded-xl text-red-600 text-xs">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type *</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entree">État d'entrée</SelectItem>
                      <SelectItem value="sortie">État de sortie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Date *</Label>
                  <Input className="rounded-xl" type="date" value={form.date_etat} onChange={e => setForm(f => ({ ...f, date_etat: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Unité *</Label>
                <Select value={form.unite_id} onValueChange={v => setForm(f => ({ ...f, unite_id: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner une unité" /></SelectTrigger>
                  <SelectContent>
                    {unites.map(u => {
                      const m = maisons.find(m => m.id === u.maison_id);
                      return <SelectItem key={u.id} value={u.id}>{u.nom} — {m?.nom}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Locataire (optionnel)</Label>
                <Select value={form.locataire_id} onValueChange={v => setForm(f => ({ ...f, locataire_id: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {locataires.map(l => <SelectItem key={l.id} value={l.id}>{l.prenom} {l.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* État des pièces */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-black text-sm">État des pièces</Label>
                  <button type="button" onClick={addPiece} className="text-xs text-[#B8860B] font-bold flex items-center gap-1 hover:opacity-80">
                    <Plus size={12} /> Ajouter
                  </button>
                </div>
                <div className="space-y-3">
                  {form.pieces.map((p, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <Input className="rounded-xl flex-1 bg-white text-sm font-bold" value={p.nom}
                          onChange={e => updatePiece(i, 'nom', e.target.value)} />
                        <Select value={p.etat} onValueChange={v => updatePiece(i, 'etat', v)}>
                          <SelectTrigger className={`w-36 rounded-xl text-xs font-black ${ETAT_CONFIG[p.etat as keyof typeof ETAT_CONFIG].color}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ETAT_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input className="rounded-xl bg-white text-xs" placeholder="Observations..." value={p.observations}
                        onChange={e => updatePiece(i, 'observations', e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Observations générales</Label>
                <Input className="rounded-xl" placeholder="Remarques générales sur le logement..." value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-6">
                {submitting ? <><Loader2 className="animate-spin" size={18} /> Enregistrement...</> : <><ClipboardList size={18} /> Créer l'état des lieux</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Voir détail */}
      <Dialog open={!!viewId} onOpenChange={() => setViewId(null)}>
        <DialogContent className="sm:max-w-[580px] rounded-[2.5rem]">
          {viewEtat && (() => {
            const unite = unites.find(u => u.id === viewEtat.unite_id);
            const maison = maisons.find(m => m.id === viewEtat.maison_id);
            const loc = locataires.find(l => l.id === viewEtat.locataire_id);
            const pieces: PieceEtat[] = Array.isArray(viewEtat.pieces) ? viewEtat.pieces : [];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-black text-xl">
                    État des lieux — {viewEtat.type === 'entree' ? 'Entrée' : 'Sortie'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: 'Logement', v: `${unite?.nom} — ${maison?.nom}` },
                      { l: 'Date', v: new Date(viewEtat.date_etat).toLocaleDateString('fr-FR') },
                      { l: 'Locataire', v: loc ? `${loc.prenom} ${loc.nom}` : '—' },
                      { l: 'Statut', v: STATUT_CONFIG[viewEtat.statut].label },
                    ].map((r, i) => (
                      <div key={i} className="bg-slate-50 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{r.l}</p>
                        <p className="text-sm font-black text-[#1A1A2E]">{r.v}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-black text-sm text-[#1A1A2E] mb-3">État des pièces</p>
                    <div className="space-y-2">
                      {pieces.map((p, i) => (
                        <div key={i} className="flex items-start justify-between bg-slate-50 rounded-2xl p-4">
                          <div>
                            <p className="font-black text-sm text-[#1A1A2E]">{p.nom}</p>
                            {p.observations && <p className="text-xs text-slate-500 mt-0.5">{p.observations}</p>}
                          </div>
                          <span className={`text-[9px] font-black px-2 py-1 rounded-lg shrink-0 ml-3 ${ETAT_CONFIG[p.etat as keyof typeof ETAT_CONFIG]?.color}`}>
                            {ETAT_CONFIG[p.etat as keyof typeof ETAT_CONFIG]?.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {viewEtat.observations && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                      <p className="text-xs font-black text-amber-700 mb-1">Observations générales</p>
                      <p className="text-sm text-amber-800">{viewEtat.observations}</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

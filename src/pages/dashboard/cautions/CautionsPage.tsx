import React, { useState, useMemo } from 'react';
import {
  Shield,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Home,
  Search,
  Banknote,
  RotateCcw,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCautions, createCaution, updateCaution, deleteCaution, useLocataires, useMaisons, useAllUnites } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { Caution } from '@/lib/supabase';

const STATUT_CONFIG = {
  encaissé: { label: 'Encaissée', color: 'bg-blue-100 text-blue-700', icon: <Clock size={12} /> },
  retenu_partiel: { label: 'Retenue partielle', color: 'bg-amber-100 text-amber-700', icon: <Shield size={12} /> },
  restitué: { label: 'Restituée', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
};

export default function CautionsPage() {
  const { user } = useAuth();
  const { cautions, isLoading, refresh } = useCautions();
  const { locataires } = useLocataires();
  const { maisons } = useMaisons();
  const { unites } = useAllUnites();

  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [restituirOpen, setRestituirOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Caution | null>(null);
  const [restituirTarget, setRestituirTarget] = useState<Caution | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    locataire_id: '',
    unite_id: '',
    maison_id: '',
    montant: '',
    date_encaissement: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [restituirForm, setRestituirForm] = useState({
    montant_retenu: '0',
    motif_retenue: '',
    date_restitution: new Date().toISOString().split('T')[0],
  });

  const filtered = useMemo(() => {
    return cautions.filter(c => {
      const loc = locataires.find(l => l.id === c.locataire_id);
      const matchSearch = !search ||
        `${loc?.prenom} ${loc?.nom}`.toLowerCase().includes(search.toLowerCase());
      const matchStatut = statutFilter === 'all' || c.statut === statutFilter;
      return matchSearch && matchStatut;
    });
  }, [cautions, locataires, search, statutFilter]);

  const stats = useMemo(() => {
    const total = cautions.reduce((s, c) => s + c.montant, 0);
    const encaisse = cautions.filter(c => c.statut !== 'restitué').reduce((s, c) => s + c.montant, 0);
    const retenu = cautions.reduce((s, c) => s + c.montant_retenu, 0);
    const restitue = cautions.filter(c => c.statut === 'restitué').reduce((s, c) => s + (c.montant - c.montant_retenu), 0);
    return { total, encaisse, retenu, restitue };
  }, [cautions]);

  function handleLocataireChange(locataireId: string) {
    const loc = locataires.find(l => l.id === locataireId);
    const unite = unites.find(u => u.id === loc?.unite_id);
    setForm(f => ({
      ...f,
      locataire_id: locataireId,
      unite_id: unite?.id || '',
      maison_id: unite?.maison_id || '',
    }));
  }

  function openCreate() {
    setEditTarget(null);
    setForm({ locataire_id: '', unite_id: '', maison_id: '', montant: '', date_encaissement: new Date().toISOString().split('T')[0], notes: '' });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(caution: Caution) {
    setEditTarget(caution);
    setForm({
      locataire_id: caution.locataire_id,
      unite_id: caution.unite_id,
      maison_id: caution.maison_id,
      montant: String(caution.montant),
      date_encaissement: caution.date_encaissement,
      notes: caution.notes || '',
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function openRestituir(caution: Caution) {
    setRestituirTarget(caution);
    setRestituirForm({
      montant_retenu: '0',
      motif_retenue: '',
      date_restitution: new Date().toISOString().split('T')[0],
    });
    setRestituirOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.locataire_id || !form.montant) {
      setFormError('Locataire et montant sont obligatoires.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (!user) throw new Error('Non connecté');
      const payload = {
        locataire_id: form.locataire_id,
        unite_id: form.unite_id,
        maison_id: form.maison_id,
        proprietaire_id: user.id,
        montant: parseInt(form.montant),
        statut: 'encaissé' as const,
        date_encaissement: form.date_encaissement,
        date_restitution: null,
        montant_retenu: 0,
        motif_retenue: null,
        notes: form.notes || null,
      };
      if (editTarget) {
        await updateCaution(editTarget.id, { montant: payload.montant, date_encaissement: payload.date_encaissement, notes: payload.notes });
      } else {
        await createCaution(payload);
      }
      setDialogOpen(false);
      refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRestitution(e: React.FormEvent) {
    e.preventDefault();
    if (!restituirTarget) return;
    setSubmitting(true);
    try {
      const retenu = parseInt(restituirForm.montant_retenu) || 0;
      await updateCaution(restituirTarget.id, {
        statut: retenu > 0 ? 'retenu_partiel' : 'restitué',
        montant_retenu: retenu,
        motif_retenue: restituirForm.motif_retenue || null,
        date_restitution: restituirForm.date_restitution,
      });
      setRestituirOpen(false);
      refresh();
    } catch {
      alert('Erreur lors de la restitution.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette caution ?')) return;
    await deleteCaution(id);
    refresh();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#B8860B]" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 lg:pb-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Cautions (Dépôts de garantie)</h1>
          <p className="text-sm text-slate-500">Suivi des cautions encaissées, retenues et restituées</p>
        </div>
        <Button onClick={openCreate} className="bg-[#B8860B] hover:bg-[#9A700A] text-white font-bold rounded-xl flex items-center gap-2">
          <Plus size={16} /> Nouvelle caution
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total encaissé</p>
            <h3 className="text-xl font-black text-[#1A1A2E]">{stats.total.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-1">FCFA</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-blue-50/40">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest mb-1">En garde</p>
            <h3 className="text-xl font-black text-blue-600">{stats.encaisse.toLocaleString()}</h3>
            <p className="text-[10px] text-blue-400 mt-1">FCFA</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-amber-50/40">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1">Montant retenu</p>
            <h3 className="text-xl font-black text-amber-600">{stats.retenu.toLocaleString()}</h3>
            <p className="text-[10px] text-amber-400 mt-1">FCFA</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-green-50/40">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-green-500/70 uppercase tracking-widest mb-1">Restitué</p>
            <h3 className="text-xl font-black text-green-600">{stats.restitue.toLocaleString()}</h3>
            <p className="text-[10px] text-green-400 mt-1">FCFA</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTRES */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Rechercher un locataire..." className="pl-9 rounded-xl h-9 text-xs bg-white border-slate-100 shadow-sm"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-[180px] h-9 rounded-xl text-xs font-bold bg-white shadow-sm border-slate-100">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="encaissé">Encaissées</SelectItem>
            <SelectItem value="retenu_partiel">Retenue partielle</SelectItem>
            <SelectItem value="restitué">Restituées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LISTE */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Shield size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="italic text-sm">Aucune caution enregistrée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(caution => {
            const loc = locataires.find(l => l.id === caution.locataire_id);
            const unite = unites.find(u => u.id === caution.unite_id);
            const maison = maisons.find(m => m.id === caution.maison_id);
            const cfg = STATUT_CONFIG[caution.statut];
            const montantRestitue = caution.montant - caution.montant_retenu;

            return (
              <div key={caution.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#1A1A2E] rounded-2xl flex items-center justify-center font-black text-[#B8860B] text-base">
                      {loc?.prenom?.[0]}{loc?.nom?.[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 tracking-tight">{loc?.prenom} {loc?.nom}</h4>
                      <Badge className={`${cfg.color} border-none text-[9px] font-black flex items-center gap-1 w-fit mt-1`}>
                        {cfg.icon} {cfg.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {caution.statut !== 'restitué' && (
                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-[#B8860B]" onClick={() => openEdit(caution)}>
                        <Edit2 size={14} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-red-500" onClick={() => handleDelete(caution.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-3">
                    <div className="flex items-center gap-2">
                      <Banknote size={14} className="text-[#B8860B]" />
                      <span className="text-xs text-slate-500 font-medium">Montant caution</span>
                    </div>
                    <span className="text-sm font-black text-[#1A1A2E]">{caution.montant.toLocaleString()} FCFA</span>
                  </div>

                  {caution.montant_retenu > 0 && (
                    <div className="flex items-center justify-between bg-amber-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2">
                        <XCircle size={14} className="text-amber-500" />
                        <span className="text-xs text-amber-600 font-medium">Retenu</span>
                      </div>
                      <span className="text-sm font-black text-amber-700">{caution.montant_retenu.toLocaleString()} FCFA</span>
                    </div>
                  )}

                  {caution.statut === 'restitué' && (
                    <div className="flex items-center justify-between bg-green-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span className="text-xs text-green-600 font-medium">Restitué le {new Date(caution.date_restitution!).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <span className="text-sm font-black text-green-700">{montantRestitue.toLocaleString()} FCFA</span>
                    </div>
                  )}

                  {unite && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                      <Home size={12} className="text-[#B8860B]" />
                      <span className="font-medium">{unite.nom} — {maison?.nom}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Encaissée le {new Date(caution.date_encaissement).toLocaleDateString('fr-FR')}
                  </p>
                  {caution.motif_retenue && (
                    <p className="text-[10px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                      Motif retenue : {caution.motif_retenue}
                    </p>
                  )}
                </div>

                {caution.statut !== 'restitué' && (
                  <button
                    onClick={() => openRestituir(caution)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition-all text-xs font-bold"
                  >
                    <RotateCcw size={14} /> Restituer la caution
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DIALOG AJOUTER / MODIFIER */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">
              {editTarget ? 'Modifier la caution' : 'Nouvelle caution'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">{formError}</div>}
              {!editTarget && (
                <div className="grid gap-2">
                  <Label>Locataire *</Label>
                  <Select value={form.locataire_id} onValueChange={handleLocataireChange}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sélectionner un locataire" />
                    </SelectTrigger>
                    <SelectContent>
                      {locataires.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.prenom} {l.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!editTarget && form.locataire_id && !form.unite_id && (
                <div className="grid gap-2">
                  <Label>Unité</Label>
                  <Select value={form.unite_id} onValueChange={v => {
                    const u = unites.find(u => u.id === v);
                    setForm(f => ({ ...f, unite_id: v, maison_id: u?.maison_id || '' }));
                  }}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sélectionner une unité (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {unites.map(u => {
                        const m = maisons.find(m => m.id === u.maison_id);
                        return <SelectItem key={u.id} value={u.id}>{u.nom} — {m?.nom}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Montant de la caution (FCFA) *</Label>
                <Input className="rounded-xl" type="number" placeholder="50000"
                  value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Date d'encaissement</Label>
                <Input className="rounded-xl" type="date" value={form.date_encaissement}
                  onChange={e => setForm(f => ({ ...f, date_encaissement: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input className="rounded-xl" placeholder="Remarques..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}
                className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-6">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : editTarget ? 'Mettre à jour' : 'Enregistrer la caution'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG RESTITUTION */}
      <Dialog open={restituirOpen} onOpenChange={setRestituirOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">Restituer la caution</DialogTitle>
          </DialogHeader>
          {restituirTarget && (
            <form onSubmit={handleRestitution}>
              <div className="grid gap-4 py-4">
                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium mb-1">Montant total de la caution</p>
                  <p className="text-2xl font-black text-[#1A1A2E]">{restituirTarget.montant.toLocaleString()} FCFA</p>
                </div>
                <div className="grid gap-2">
                  <Label>Montant à retenir (FCFA)</Label>
                  <Input className="rounded-xl" type="number" placeholder="0" min="0" max={String(restituirTarget.montant)}
                    value={restituirForm.montant_retenu} onChange={e => setRestituirForm(f => ({ ...f, montant_retenu: e.target.value }))} />
                  <p className="text-xs text-green-600 font-medium">
                    Montant restitué : {(restituirTarget.montant - (parseInt(restituirForm.montant_retenu) || 0)).toLocaleString()} FCFA
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Motif de la retenue (si applicable)</Label>
                  <Input className="rounded-xl" placeholder="Dégradations, loyer impayé..."
                    value={restituirForm.motif_retenue} onChange={e => setRestituirForm(f => ({ ...f, motif_retenue: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Date de restitution</Label>
                  <Input className="rounded-xl" type="date" value={restituirForm.date_restitution}
                    onChange={e => setRestituirForm(f => ({ ...f, date_restitution: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-6">
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : <><RotateCcw size={16} /> Confirmer la restitution</>}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

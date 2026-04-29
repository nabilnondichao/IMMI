import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Trash2,
  Loader2,
  TrendingDown,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDepenses, useMaisons, createDepense, deleteDepense } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = [
  { value: 'plomberie', label: 'Plomberie', color: 'bg-blue-100 text-blue-700' },
  { value: 'electricite', label: 'Électricité', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'peinture', label: 'Peinture', color: 'bg-purple-100 text-purple-700' },
  { value: 'menuiserie', label: 'Menuiserie', color: 'bg-orange-100 text-orange-700' },
  { value: 'autre', label: 'Autre', color: 'bg-slate-100 text-slate-700' },
];

function getCatStyle(categorie: string) {
  return CATEGORIES.find(c => c.value === categorie) || CATEGORIES[4];
}

export default function DepensesPage() {
  const { user } = useAuth();
  const [maisonFilter, setMaisonFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    maison_id: '',
    libelle: '',
    montant: '',
    date_depense: new Date().toISOString().split('T')[0],
    categorie: 'autre',
  });

  const { maisons } = useMaisons();
  const { depenses, isLoading, refresh } = useDepenses(maisonFilter !== 'all' ? maisonFilter : undefined);

  const filtered = useMemo(() => {
    return depenses.filter(d => {
      const matchCat = catFilter === 'all' || d.categorie === catFilter;
      return matchCat;
    });
  }, [depenses, catFilter]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, d) => s + d.montant, 0);
    const thisMonth = filtered
      .filter(d => {
        const date = new Date(d.date_depense);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((s, d) => s + d.montant, 0);
    const byCategory: Record<string, number> = {};
    filtered.forEach(d => {
      byCategory[d.categorie] = (byCategory[d.categorie] || 0) + d.montant;
    });
    return { total, thisMonth, byCategory };
  }, [filtered]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.maison_id || !form.libelle || !form.montant) {
      setFormError('Remplissez tous les champs obligatoires.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (!user) throw new Error('Non connecté');
      await createDepense({
        maison_id: form.maison_id,
        proprietaire_id: user.id,
        libelle: form.libelle,
        montant: parseInt(form.montant),
        date_depense: form.date_depense,
        categorie: form.categorie as 'plomberie' | 'electricite' | 'peinture' | 'menuiserie' | 'autre',
        facture_url: null,
      });
      setDialogOpen(false);
      setForm({ maison_id: '', libelle: '', montant: '', date_depense: new Date().toISOString().split('T')[0], categorie: 'autre' });
      refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      await deleteDepense(id);
      refresh();
    } catch {
      alert('Impossible de supprimer.');
    }
  }

  return (
    <div className="p-8 pb-32 lg:pb-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Dépenses & Réparations</h1>
          <p className="text-sm text-slate-500">Suivi de toutes vos charges par maison et catégorie</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#B8860B] hover:bg-[#9A700A] text-white font-bold rounded-xl flex items-center gap-2">
              <Plus size={16} />
              Nouvelle dépense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
            <DialogHeader>
              <DialogTitle className="font-black text-xl">Enregistrer une dépense</DialogTitle>
              <DialogDescription>Réparation, entretien ou autre charge à imputer sur une maison.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">{formError}</div>}
                <div className="grid gap-2">
                  <Label>Maison concernée *</Label>
                  <Select value={form.maison_id} onValueChange={v => setForm(f => ({ ...f, maison_id: v }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sélectionner une maison" />
                    </SelectTrigger>
                    <SelectContent>
                      {maisons.map(m => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Libellé *</Label>
                  <Input
                    placeholder="Ex: Réparation fuite robinet chambre R1"
                    className="rounded-xl"
                    value={form.libelle}
                    onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Montant (FCFA) *</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="5000"
                      className="rounded-xl"
                      value={form.montant}
                      onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      className="rounded-xl"
                      value={form.date_depense}
                      onChange={e => setForm(f => ({ ...f, date_depense: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Catégorie</Label>
                  <Select value={form.categorie} onValueChange={v => setForm(f => ({ ...f, categorie: v }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-6 flex items-center gap-2"
                >
                  {submitting ? <><Loader2 className="animate-spin" size={18} /> Enregistrement...</> : <><Wrench size={18} /> Enregistrer la dépense</>}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* MÉTRIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-red-50/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-red-500/70 uppercase tracking-widest mb-1">Total dépenses (filtre actuel)</p>
            <h3 className="text-2xl font-black text-red-600">{stats.total.toLocaleString()} <span className="text-[10px]">FCFA</span></h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ce mois-ci</p>
            <h3 className="text-2xl font-black text-[#1A1A2E]">{stats.thisMonth.toLocaleString()} <span className="text-[10px]">FCFA</span></h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Par catégorie</p>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.filter(c => stats.byCategory[c.value]).map(c => (
                <span key={c.value} className={`text-[9px] font-black px-2 py-0.5 rounded-full ${c.color}`}>
                  {c.label}: {(stats.byCategory[c.value] || 0).toLocaleString()}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTRES */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Select value={maisonFilter} onValueChange={setMaisonFilter}>
          <SelectTrigger className="w-[160px] h-9 rounded-xl text-xs font-bold bg-white shadow-sm border-slate-100">
            <Filter size={14} className="mr-1 text-slate-400" />
            <SelectValue placeholder="Toutes les maisons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les maisons</SelectItem>
            {maisons.map(m => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px] h-9 rounded-xl text-xs font-bold bg-white shadow-sm border-slate-100">
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-[#B8860B]" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-transparent">
                  <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Libellé</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Maison</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Montant</TableHead>
                  <TableHead className="px-8 py-5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-slate-400 italic">
                      <TrendingDown size={40} className="mx-auto mb-3 text-slate-200" />
                      Aucune dépense enregistrée.
                    </TableCell>
                  </TableRow>
                ) : filtered.map(dep => {
                  const maison = maisons.find(m => m.id === dep.maison_id);
                  const cat = getCatStyle(dep.categorie);
                  return (
                    <TableRow key={dep.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-8 py-4 text-xs font-bold text-slate-500">
                        {new Date(dep.date_depense).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-bold text-slate-800">{dep.libelle}</TableCell>
                      <TableCell className="py-4 text-xs font-medium text-slate-500">{maison?.nom || '—'}</TableCell>
                      <TableCell className="py-4">
                        <Badge className={`text-[9px] font-black border-none ${cat.color}`}>{cat.label}</Badge>
                      </TableCell>
                      <TableCell className="py-4 text-right text-sm font-black text-red-600">
                        -{dep.montant.toLocaleString()} FCFA
                      </TableCell>
                      <TableCell className="px-8 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-red-300 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(dep.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  Building2, Plus, Edit2, Trash2, Loader2, TrendingUp, TrendingDown,
  MapPin, Calendar, FileText, Home, ShoppingBag, TreePine, Layers, Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useActifs, createActif, updateActif, deleteActif, useMaisons } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import type { Actif } from '@/lib/supabase';

const TYPES = [
  { value: 'maison', label: 'Maison', icon: <Home size={16} /> },
  { value: 'appartement', label: 'Appartement', icon: <Building2 size={16} /> },
  { value: 'villa', label: 'Villa', icon: <Star size={16} /> },
  { value: 'immeuble', label: 'Immeuble', icon: <Layers size={16} /> },
  { value: 'boutique', label: 'Boutique / Local', icon: <ShoppingBag size={16} /> },
  { value: 'terrain', label: 'Terrain', icon: <TreePine size={16} /> },
  { value: 'autre', label: 'Autre', icon: <Building2 size={16} /> },
];

const STATUTS = [
  { value: 'titre_foncier', label: 'Titre Foncier', color: 'bg-green-100 text-green-700' },
  { value: 'permis_habiter', label: 'Permis d\'Habiter', color: 'bg-blue-100 text-blue-700' },
  { value: 'acte_vente', label: 'Acte de Vente', color: 'bg-purple-100 text-purple-700' },
  { value: 'en_cours', label: 'En cours', color: 'bg-amber-100 text-amber-700' },
  { value: 'autre', label: 'Autre', color: 'bg-slate-100 text-slate-600' },
];

const EMPTY_FORM = {
  nom: '', type: 'maison' as Actif['type'], adresse: '', ville: '',
  valeur_achat: '', valeur_actuelle: '', date_acquisition: '',
  superficie_m2: '', statut_juridique: 'en_cours' as Actif['statut_juridique'],
  revenus_mensuel: '', charges_mensuel: '',
  hypotheque: false, montant_hypotheque: '', notes: '',
};

export default function ActifsPage() {
  const { user } = useAuth();
  const { actifs, isLoading, refresh } = useActifs();
  const { maisons } = useMaisons();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const stats = useMemo(() => {
    const valeurTotale = actifs.reduce((s, a) => s + (a.valeur_actuelle || 0), 0);
    const valeurAchat = actifs.reduce((s, a) => s + (a.valeur_achat || 0), 0);
    const revenusMensuel = actifs.reduce((s, a) => s + (a.revenus_mensuel || 0), 0);
    const chargesMensuel = actifs.reduce((s, a) => s + (a.charges_mensuel || 0), 0);
    const plusValue = valeurTotale - valeurAchat;
    const rendement = valeurTotale > 0 ? ((revenusMensuel * 12) / valeurTotale * 100).toFixed(1) : '0';
    return { valeurTotale, valeurAchat, revenusMensuel, chargesMensuel, plusValue, rendement };
  }, [actifs]);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(actif: Actif) {
    setEditId(actif.id);
    setForm({
      nom: actif.nom, type: actif.type, adresse: actif.adresse, ville: actif.ville,
      valeur_achat: String(actif.valeur_achat || ''),
      valeur_actuelle: String(actif.valeur_actuelle || ''),
      date_acquisition: actif.date_acquisition || '',
      superficie_m2: String(actif.superficie_m2 || ''),
      statut_juridique: actif.statut_juridique,
      revenus_mensuel: String(actif.revenus_mensuel || ''),
      charges_mensuel: String(actif.charges_mensuel || ''),
      hypotheque: actif.hypotheque,
      montant_hypotheque: String(actif.montant_hypotheque || ''),
      notes: actif.notes || '',
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom || !form.adresse || !form.ville) {
      setFormError('Nom, adresse et ville sont obligatoires.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (!user) throw new Error('Non connecté');
      const payload: Omit<Actif, 'id' | 'created_at' | 'updated_at'> = {
        proprietaire_id: user.id,
        nom: form.nom, type: form.type, adresse: form.adresse, ville: form.ville,
        valeur_achat: parseInt(form.valeur_achat) || 0,
        valeur_actuelle: parseInt(form.valeur_actuelle) || 0,
        date_acquisition: form.date_acquisition || null,
        superficie_m2: parseInt(form.superficie_m2) || null,
        statut_juridique: form.statut_juridique,
        revenus_mensuel: parseInt(form.revenus_mensuel) || 0,
        charges_mensuel: parseInt(form.charges_mensuel) || 0,
        hypotheque: form.hypotheque,
        montant_hypotheque: parseInt(form.montant_hypotheque) || 0,
        notes: form.notes || null,
        documents_urls: null,
        lien_maison_id: null,
      };
      if (editId) await updateActif(editId, payload);
      else await createActif(payload);
      setDialogOpen(false);
      refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet actif ? Cette action est irréversible.')) return;
    await deleteActif(id);
    refresh();
  }

  function getStatut(v: string) {
    return STATUTS.find(s => s.value === v) || STATUTS[4];
  }

  function getTypeLabel(v: string) {
    return TYPES.find(t => t.value === v)?.label || v;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#B8860B]" size={40} /></div>;
  }

  return (
    <div className="p-4 md:p-8 pb-32 lg:pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Mes Actifs Immobiliers</h1>
          <p className="text-sm text-slate-500">Patrimoine, rendement et valeur de vos biens</p>
        </div>
        <Button onClick={openCreate} className="bg-[#B8860B] hover:bg-[#9A700A] text-white font-bold rounded-xl flex items-center gap-2">
          <Plus size={16} /> Ajouter un actif
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-gradient-to-br from-[#1A1A2E] to-[#252542] text-white col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valeur totale</p>
            <h3 className="text-xl font-black text-[#B8860B]">{stats.valeurTotale.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400">FCFA</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plus-value</p>
            <h3 className={`text-xl font-black ${stats.plusValue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {stats.plusValue >= 0 ? '+' : ''}{stats.plusValue.toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400">FCFA vs achat</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-green-50/40">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-green-600/70 uppercase tracking-widest mb-1">Revenus / mois</p>
            <h3 className="text-xl font-black text-green-700">{stats.revenusMensuel.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400">FCFA nets : {(stats.revenusMensuel - stats.chargesMensuel).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm border-[#B8860B]/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-[#B8860B]/70 uppercase tracking-widest mb-1">Rendement annuel</p>
            <h3 className="text-xl font-black text-[#B8860B]">{stats.rendement}%</h3>
            <p className="text-[10px] text-slate-400">{actifs.length} bien(s) enregistré(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* LISTE DES ACTIFS */}
      {actifs.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="font-bold text-slate-400">Aucun actif enregistré.</p>
          <p className="text-sm text-slate-400 mt-1">Ajoutez vos propriétés pour suivre votre patrimoine.</p>
          <Button onClick={openCreate} className="mt-6 bg-[#B8860B] text-white font-bold rounded-xl">
            <Plus size={16} className="mr-2" /> Ajouter mon premier actif
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {actifs.map(actif => {
            const statut = getStatut(actif.statut_juridique);
            const rendementActif = actif.valeur_actuelle > 0
              ? ((actif.revenus_mensuel * 12) / actif.valeur_actuelle * 100).toFixed(1)
              : '0';
            const plusValue = actif.valeur_actuelle - actif.valeur_achat;
            return (
              <div key={actif.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#1A1A2E] rounded-2xl flex items-center justify-center text-[#B8860B]">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-[#1A1A2E] tracking-tight">{actif.nom}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{getTypeLabel(actif.type)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-[#B8860B] w-8 h-8" onClick={() => openEdit(actif)}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-red-500 w-8 h-8" onClick={() => handleDelete(actif.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="shrink-0 text-slate-400" />
                    <span className="truncate">{actif.adresse}, {actif.ville}</span>
                  </div>
                  {actif.date_acquisition && (
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="shrink-0 text-slate-400" />
                      <span>Acquis le {new Date(actif.date_acquisition).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {actif.superficie_m2 && (
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="shrink-0 text-slate-400" />
                      <span>{actif.superficie_m2} m²</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-2xl p-3 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valeur actuelle</p>
                    <p className="text-sm font-black text-[#1A1A2E]">{actif.valeur_actuelle.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400">FCFA</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rendement</p>
                    <p className={`text-sm font-black ${parseFloat(rendementActif) > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                      {rendementActif}%
                    </p>
                    <p className="text-[9px] text-slate-400">annuel</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Badge className={`text-[9px] font-black border-none ${statut.color}`}>
                    {statut.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs font-bold">
                    {plusValue >= 0 ? (
                      <TrendingUp size={14} className="text-green-500" />
                    ) : (
                      <TrendingDown size={14} className="text-red-500" />
                    )}
                    <span className={plusValue >= 0 ? 'text-green-600' : 'text-red-500'}>
                      {plusValue >= 0 ? '+' : ''}{plusValue.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIALOG AJOUTER / MODIFIER */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">{editId ? 'Modifier l\'actif' : 'Ajouter un actif immobilier'}</DialogTitle>
            <DialogDescription>Enregistrez les détails de votre bien immobilier.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">{formError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 col-span-2">
                  <Label>Nom du bien *</Label>
                  <Input className="rounded-xl" placeholder="Ex: Maison GDM, Villa Cocotiers..." value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Type de bien *</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as Actif['type'] }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Superficie (m²)</Label>
                  <Input className="rounded-xl" type="number" placeholder="250" value={form.superficie_m2} onChange={e => setForm(f => ({ ...f, superficie_m2: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Adresse *</Label>
                  <Input className="rounded-xl" placeholder="Quartier / Rue" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Ville *</Label>
                  <Input className="rounded-xl" placeholder="Cotonou, Abidjan..." value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Prix d'achat (FCFA)</Label>
                  <Input className="rounded-xl" type="number" placeholder="0" value={form.valeur_achat} onChange={e => setForm(f => ({ ...f, valeur_achat: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Valeur actuelle estimée (FCFA)</Label>
                  <Input className="rounded-xl" type="number" placeholder="0" value={form.valeur_actuelle} onChange={e => setForm(f => ({ ...f, valeur_actuelle: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date d'acquisition</Label>
                  <Input className="rounded-xl" type="date" value={form.date_acquisition} onChange={e => setForm(f => ({ ...f, date_acquisition: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Statut juridique</Label>
                  <Select value={form.statut_juridique} onValueChange={v => setForm(f => ({ ...f, statut_juridique: v as Actif['statut_juridique'] }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Revenus mensuels (FCFA)</Label>
                  <Input className="rounded-xl" type="number" placeholder="0" value={form.revenus_mensuel} onChange={e => setForm(f => ({ ...f, revenus_mensuel: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Charges mensuelles (FCFA)</Label>
                  <Input className="rounded-xl" type="number" placeholder="0" value={form.charges_mensuel} onChange={e => setForm(f => ({ ...f, charges_mensuel: e.target.value }))} />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <input type="checkbox" id="hypotheque" checked={form.hypotheque} onChange={e => setForm(f => ({ ...f, hypotheque: e.target.checked }))} className="w-4 h-4 accent-[#B8860B]" />
                <Label htmlFor="hypotheque" className="cursor-pointer">Ce bien est sous hypothèque / crédit immobilier</Label>
              </div>

              {form.hypotheque && (
                <div className="grid gap-2">
                  <Label>Montant restant du crédit (FCFA)</Label>
                  <Input className="rounded-xl" type="number" placeholder="0" value={form.montant_hypotheque} onChange={e => setForm(f => ({ ...f, montant_hypotheque: e.target.value }))} />
                </div>
              )}

              <div className="grid gap-2">
                <Label>Notes / Observations</Label>
                <Input className="rounded-xl" placeholder="Informations complémentaires..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-6 flex items-center gap-2">
                {submitting ? <><Loader2 className="animate-spin" size={18} /> Enregistrement...</> : <><Building2 size={18} /> {editId ? 'Mettre à jour' : 'Enregistrer l\'actif'}</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

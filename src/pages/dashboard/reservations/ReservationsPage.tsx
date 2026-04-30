import React, { useState, useMemo } from 'react';
import {
  Calendar, Plus, Loader2, Search, Check, X,
  Clock, Phone, Mail, Home, Banknote, MessageCircle,
  Edit2, Trash2, CheckCircle2, XCircle, AlertCircle, Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useReservations, createReservation, updateReservation, useMaisons, useAllUnites } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { Reservation } from '@/lib/supabase';
import { getPaysConfig } from '@/lib/countries';

const STATUTS = {
  en_attente:  { label: 'En attente',  color: 'bg-amber-100 text-amber-700',  icon: <Clock size={12} /> },
  confirmee:   { label: 'Confirmée',   color: 'bg-green-100 text-green-700',  icon: <CheckCircle2 size={12} /> },
  annulee:     { label: 'Annulée',     color: 'bg-red-100 text-red-700',      icon: <XCircle size={12} /> },
  terminee:    { label: 'Terminée',    color: 'bg-slate-100 text-slate-600',  icon: <Check size={12} /> },
};

const SOURCES = [
  { value: 'direct', label: 'Direct' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'airbnb', label: 'Airbnb' },
];

export default function ReservationsPage() {
  const { user, profile } = useAuth();
  const { reservations, isLoading, refresh } = useReservations();
  const { maisons } = useMaisons();
  const { unites } = useAllUnites();

  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    unite_id: '', maison_id: '',
    nom_client: '', telephone_client: '', email_client: '',
    date_debut: '', date_fin: '',
    montant_total: '', source: 'direct', notes: '',
  });

  const unitesCourtTerme = unites.filter(u => u.type_location === 'court_terme' || u.type_location === 'mixte' || !u.type_location);

  const pays = profile?.pays || 'Bénin';
  const conf = getPaysConfig(pays);

  const filtered = useMemo(() => {
    return reservations.filter(r => {
      const matchSearch = !search || r.nom_client.toLowerCase().includes(search.toLowerCase()) || r.telephone_client.includes(search);
      const matchStatut = statutFilter === 'all' || r.statut === statutFilter;
      return matchSearch && matchStatut;
    });
  }, [reservations, search, statutFilter]);

  const stats = useMemo(() => {
    const actives = reservations.filter(r => r.statut === 'confirmee').length;
    const attente = reservations.filter(r => r.statut === 'en_attente').length;
    const revenusMois = reservations
      .filter(r => r.statut !== 'annulee' && new Date(r.date_debut).getMonth() === new Date().getMonth())
      .reduce((s, r) => s + r.montant_total, 0);
    return { actives, attente, revenusMois };
  }, [reservations]);

  function calcNuits(debut: string, fin: string): number {
    if (!debut || !fin) return 0;
    return Math.max(0, Math.round((new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 3600 * 24)));
  }

  function openCreate() {
    setEditTarget(null);
    setForm({ unite_id: '', maison_id: '', nom_client: '', telephone_client: '', email_client: '', date_debut: '', date_fin: '', montant_total: '', source: 'direct', notes: '' });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(r: Reservation) {
    setEditTarget(r);
    setForm({
      unite_id: r.unite_id, maison_id: r.maison_id,
      nom_client: r.nom_client, telephone_client: r.telephone_client,
      email_client: r.email_client || '', date_debut: r.date_debut,
      date_fin: r.date_fin, montant_total: String(r.montant_total),
      source: r.source || 'direct', notes: r.notes || '',
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function handleUniteChange(uniteId: string) {
    const u = unites.find(u => u.id === uniteId);
    setForm(f => ({ ...f, unite_id: uniteId, maison_id: u?.maison_id || '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.unite_id || !form.nom_client || !form.date_debut || !form.date_fin) {
      setFormError('Unité, client, dates obligatoires.'); return;
    }
    const nuits = calcNuits(form.date_debut, form.date_fin);
    if (nuits <= 0) { setFormError('La date de fin doit être après la date de début.'); return; }
    setSubmitting(true); setFormError(null);
    try {
      const payload = {
        unite_id: form.unite_id, maison_id: form.maison_id,
        proprietaire_id: user!.id,
        nom_client: form.nom_client.trim(),
        telephone_client: form.telephone_client.trim(),
        email_client: form.email_client || null,
        date_debut: form.date_debut, date_fin: form.date_fin,
        nombre_nuits: nuits,
        montant_total: parseInt(form.montant_total) || 0,
        statut: 'en_attente' as const,
        source: form.source as any,
        notes: form.notes || null,
      };
      if (editTarget) {
        await updateReservation(editTarget.id, { ...payload });
      } else {
        await createReservation(payload);
      }
      setDialogOpen(false);
      refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur.');
    } finally { setSubmitting(false); }
  }

  async function changerStatut(id: string, statut: Reservation['statut']) {
    await updateReservation(id, { statut });
    refresh();
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#B8860B]" size={40} /></div>;

  return (
    <div className="p-6 md:p-8 pb-32 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Réservations</h1>
          <p className="text-sm text-slate-500">Courte durée — Airbnb, Booking, WhatsApp, Direct</p>
        </div>
        <Button onClick={openCreate} className="bg-[#B8860B] hover:bg-[#9A700A] text-white font-bold rounded-xl flex items-center gap-2">
          <Plus size={16} /> Nouvelle réservation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-green-50/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-green-600/70 uppercase tracking-widest mb-1">Séjours actifs</p>
            <h3 className="text-2xl font-black text-green-600 flex items-center gap-2"><Star size={18} /> {stats.actives}</h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-amber-50/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest mb-1">En attente</p>
            <h3 className="text-2xl font-black text-amber-600 flex items-center gap-2"><Clock size={18} /> {stats.attente}</h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-[#B8860B]/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-[#B8860B]/70 uppercase tracking-widest mb-1">Revenus ce mois</p>
            <h3 className="text-xl font-black text-[#B8860B] flex items-center gap-2"><Banknote size={18} /> {stats.revenusMois.toLocaleString('fr-FR')}</h3>
            <p className="text-[10px] text-slate-400">{conf.symbole}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Rechercher un client..." className="pl-9 rounded-xl h-9 text-xs bg-white border-slate-100 shadow-sm"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-[160px] h-9 rounded-xl text-xs font-bold bg-white shadow-sm border-slate-100">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUTS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Calendar size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="italic text-sm">Aucune réservation.</p>
          <p className="text-xs text-slate-300 mt-2">Ajoutez une réservation pour les logements en courte durée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(r => {
            const unite = unites.find(u => u.id === r.unite_id);
            const maison = maisons.find(m => m.id === r.maison_id);
            const statut = STATUTS[r.statut];
            const src = SOURCES.find(s => s.value === r.source);
            return (
              <div key={r.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-black text-slate-800 tracking-tight">{r.nom_client}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 ${statut.color}`}>{statut.icon} {statut.label}</span>
                      {src && <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">{src.label}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-[#B8860B]" onClick={() => openEdit(r)}>
                    <Edit2 size={14} />
                  </Button>
                </div>

                <div className="space-y-2 mb-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2"><Home size={12} className="text-[#B8860B]" /><span className="font-medium">{unite?.nom} — {maison?.nom}</span></div>
                  <div className="flex items-center gap-2"><Calendar size={12} className="text-slate-400" />
                    <span>{new Date(r.date_debut).toLocaleDateString('fr-FR')} → {new Date(r.date_fin).toLocaleDateString('fr-FR')}</span>
                    <span className="bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded-lg text-[10px]">{r.nombre_nuits} nuits</span>
                  </div>
                  <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /><span>{r.telephone_client}</span></div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mb-4">
                  <div>
                    <p className="text-lg font-black text-[#1A1A2E]">{r.montant_total.toLocaleString('fr-FR')}</p>
                    <p className="text-[10px] text-slate-400">{conf.symbole} total</p>
                  </div>
                  {r.nombre_nuits > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-600">{Math.round(r.montant_total / r.nombre_nuits).toLocaleString('fr-FR')}</p>
                      <p className="text-[10px] text-slate-400">{conf.symbole}/nuit</p>
                    </div>
                  )}
                </div>

                {/* Actions statut */}
                <div className="flex gap-2">
                  {r.statut === 'en_attente' && (
                    <>
                      <button onClick={() => changerStatut(r.id, 'confirmee')}
                        className="flex-1 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center gap-1 transition-all">
                        <Check size={13} /> Confirmer
                      </button>
                      <button onClick={() => changerStatut(r.id, 'annulee')}
                        className="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1 transition-all">
                        <X size={13} /> Annuler
                      </button>
                    </>
                  )}
                  {r.statut === 'confirmee' && (
                    <>
                      <button onClick={() => changerStatut(r.id, 'terminee')}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                        Marquer terminée
                      </button>
                      {r.telephone_client && (
                        <button onClick={() => window.open(`https://wa.me/${r.telephone_client.replace(/\s/g,'')}?text=Bonjour ${r.nom_client}, votre réservation du ${new Date(r.date_debut).toLocaleDateString('fr-FR')} est confirmée !`, '_blank')}
                          className="px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold">
                          <MessageCircle size={14} />
                        </button>
                      )}
                    </>
                  )}
                  {(r.statut === 'terminee' || r.statut === 'annulee') && (
                    <p className="w-full text-center text-xs text-slate-400 italic py-2">{statut.label}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">{editTarget ? 'Modifier' : 'Nouvelle réservation'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">{formError}</div>}
              <div className="grid gap-2">
                <Label>Unité (courte durée) *</Label>
                <Select value={form.unite_id} onValueChange={handleUniteChange}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner une unité" /></SelectTrigger>
                  <SelectContent>
                    {unitesCourtTerme.map(u => {
                      const m = maisons.find(m => m.id === u.maison_id);
                      return <SelectItem key={u.id} value={u.id}>{u.nom} — {m?.nom} ({(u.loyer_journalier || u.loyer_mensuel).toLocaleString()} {conf.symbole}/nuit)</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nom du client *</Label>
                  <Input className="rounded-xl" placeholder="Kofi Mensah" value={form.nom_client} onChange={e => setForm(f => ({ ...f, nom_client: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Téléphone *</Label>
                  <Input className="rounded-xl" placeholder="+229 97 00 00 00" value={form.telephone_client} onChange={e => setForm(f => ({ ...f, telephone_client: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input className="rounded-xl" type="email" placeholder="client@exemple.com" value={form.email_client} onChange={e => setForm(f => ({ ...f, email_client: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date d'arrivée *</Label>
                  <Input className="rounded-xl" type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Date de départ *</Label>
                  <Input className="rounded-xl" type="date" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} />
                </div>
              </div>
              {form.date_debut && form.date_fin && (
                <div className="bg-[#B8860B]/10 rounded-xl p-3 text-center">
                  <p className="text-sm font-black text-[#B8860B]">{calcNuits(form.date_debut, form.date_fin)} nuits</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Montant total ({conf.symbole}) *</Label>
                  <Input className="rounded-xl" type="number" placeholder="50000" value={form.montant_total} onChange={e => setForm(f => ({ ...f, montant_total: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input className="rounded-xl" placeholder="Remarques, demandes spéciales..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-6">
                {submitting ? <><Loader2 className="animate-spin" size={18} /> Enregistrement...</> : editTarget ? 'Mettre à jour' : 'Créer la réservation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

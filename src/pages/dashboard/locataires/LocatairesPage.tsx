import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Home,
  Loader2,
  UserCheck,
  QrCode,
  Copy,
  Check,
  MessageCircle,
  UserX,
  Calendar,
  Edit2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLocataires, useMaisons, useAllUnites, createLocataire, updateLocataire, createInvitation, useInvitations } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function LocatairesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [maisonFilter, setMaisonFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    nationalite: '',
    numero_piece_identite: '',
    unite_id: '',
    date_entree: new Date().toISOString().split('T')[0],
  });

  const { locataires, isLoading, refresh } = useLocataires();
  const { maisons } = useMaisons();
  const { unites } = useAllUnites();
  const { invitations, refresh: refreshInvitations } = useInvitations();
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);
  const [codeGenere, setCodeGenere] = useState<{ code: string; locataire: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const unitesByMaison = useMemo(() => {
    if (maisonFilter === 'all') return unites;
    return unites.filter(u => u.maison_id === maisonFilter);
  }, [unites, maisonFilter]);

  const filtered = useMemo(() => {
    return locataires.filter(l => {
      const unt = unites.find(u => u.id === l.unite_id);
      const msn = maisons.find(m => m.id === unt?.maison_id);
      const matchMaison = maisonFilter === 'all' || msn?.id === maisonFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        l.nom.toLowerCase().includes(q) ||
        l.prenom.toLowerCase().includes(q) ||
        l.telephone.includes(q) ||
        (l.email || '').toLowerCase().includes(q);
      return matchMaison && matchSearch;
    });
  }, [locataires, unites, maisons, maisonFilter, search]);

  const stats = useMemo(() => {
    const actifs = locataires.filter(l => l.unite_id).length;
    return { total: locataires.length, actifs, sansChambre: locataires.length - actifs };
  }, [locataires]);

  function openCreate() {
    setEditTarget(null);
    setForm({ nom: '', prenom: '', telephone: '', email: '', nationalite: '', numero_piece_identite: '', unite_id: '', date_entree: new Date().toISOString().split('T')[0] });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(locataireId: string) {
    const loc = locataires.find(l => l.id === locataireId);
    if (!loc) return;
    setEditTarget(locataireId);
    setForm({
      nom: loc.nom,
      prenom: loc.prenom,
      telephone: loc.telephone,
      email: loc.email || '',
      nationalite: loc.nationalite || '',
      numero_piece_identite: loc.numero_piece_identite || '',
      unite_id: loc.unite_id || '',
      date_entree: loc.date_entree,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleGenererCode(locataireId: string) {
    const loc = locataires.find(l => l.id === locataireId);
    if (!loc || !user) return;
    setGeneratingCode(locataireId);
    try {
      const inv = await createInvitation({
        proprietaire_id: user.id,
        unite_id: loc.unite_id || null,
        locataire_nom: loc.nom,
        locataire_prenom: loc.prenom,
        locataire_telephone: loc.telephone,
      });
      setCodeGenere({ code: inv.code, locataire: `${loc.prenom} ${loc.nom}` });
      refreshInvitations();
    } catch (err) {
      alert('Erreur lors de la génération du code.');
    } finally {
      setGeneratingCode(null);
    }
  }

  function copierCode(code: string) {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.telephone) {
      setFormError('Nom, prénom et téléphone sont obligatoires.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (!user) throw new Error('Non connecté');
      const payload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: form.telephone.trim(),
        email: form.email.trim() || null,
        nationalite: form.nationalite.trim() || null,
        numero_piece_identite: form.numero_piece_identite.trim() || null,
        unite_id: form.unite_id || null,
        date_entree: form.date_entree,
        photo_piece_url: null,
        user_id: null,
        proprietaire_id: user.id,
      };

      if (editTarget) {
        await updateLocataire(editTarget, payload);
        if (form.unite_id) {
            await supabase?.from('unites').update({ statut: 'occupé' }).eq('id', form.unite_id);
        }
      } else {
        await createLocataire(payload);
        if (form.unite_id) {
            await supabase?.from('unites').update({ statut: 'occupé' }).eq('id', form.unite_id);
        }
      }

      setDialogOpen(false);
      refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Gestion des Locataires</h1>
          <p className="text-sm text-slate-500">Fiches locataires, assignation et suivi</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#B8860B] hover:bg-[#9A700A] text-white font-bold rounded-xl flex items-center gap-2"
        >
          <Plus size={16} />
          Nouveau locataire
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <h3 className="text-2xl font-black text-[#1A1A2E] flex items-center gap-2">
              <Users size={20} className="text-slate-400" /> {stats.total}
            </h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-green-50/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-green-600/70 uppercase tracking-widest mb-1">Avec chambre</p>
            <h3 className="text-2xl font-black text-green-600 flex items-center gap-2">
              <UserCheck size={20} /> {stats.actifs}
            </h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-amber-50/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest mb-1">Sans chambre</p>
            <h3 className="text-2xl font-black text-amber-600 flex items-center gap-2">
              <UserX size={20} /> {stats.sansChambre}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* FILTRES */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher un locataire..."
            className="pl-9 rounded-xl h-9 text-xs bg-white border-slate-100 shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={maisonFilter} onValueChange={setMaisonFilter}>
          <SelectTrigger className="w-[160px] h-9 rounded-xl text-xs font-bold bg-white shadow-sm border-slate-100">
            <SelectValue placeholder="Toutes les maisons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les maisons</SelectItem>
            {maisons.map(m => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* CARTES LOCATAIRES */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Users size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="italic text-sm">Aucun locataire trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(loc => {
            const unt = unites.find(u => u.id === loc.unite_id);
            const msn = maisons.find(m => m.id === unt?.maison_id);
            return (
              <div key={loc.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#1A1A2E] rounded-2xl flex items-center justify-center font-black text-[#B8860B] text-base">
                      {loc.prenom[0]}{loc.nom[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 tracking-tight">{loc.prenom} {loc.nom}</h4>
                      {loc.nationalite && (
                        <p className="text-[10px] text-slate-400 font-medium">{loc.nationalite}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-slate-300 hover:text-[#B8860B]"
                    onClick={() => openEdit(loc.id)}
                  >
                    <Edit2 size={16} />
                  </Button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={12} className="text-slate-400 shrink-0" />
                    <span className="font-medium">{loc.telephone}</span>
                  </div>
                  {loc.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{loc.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <span className="font-medium">Entrée le {new Date(loc.date_entree).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  {unt ? (
                    <div className="flex items-center gap-2">
                      <Home size={14} className="text-[#B8860B]" />
                      <div>
                        <p className="text-xs font-black text-[#1A1A2E]">{unt.nom}</p>
                        <p className="text-[10px] text-slate-400">{msn?.nom}</p>
                      </div>
                    </div>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-black">Sans chambre</Badge>
                  )}
                  {unt && (
                    <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] font-black">
                      {unt.loyer_mensuel.toLocaleString()} FCFA/mois
                    </Badge>
                  )}
                </div>

                {/* Bouton code invitation */}
                <button
                  onClick={() => handleGenererCode(loc.id)}
                  disabled={generatingCode === loc.id}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#1A1A2E]/5 hover:bg-[#B8860B]/10 text-[#1A1A2E] hover:text-[#B8860B] transition-all text-xs font-bold"
                >
                  {generatingCode === loc.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <QrCode size={14} />
                  )}
                  Générer code d'invitation
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CODE GÉNÉRÉ */}
      {codeGenere && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#B8860B]/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <QrCode size={32} className="text-[#B8860B]" />
              </div>
              <h3 className="text-lg font-black text-[#1A1A2E]">Code d'invitation généré</h3>
              <p className="text-xs text-slate-500 mt-1">Pour <span className="font-bold">{codeGenere.locataire}</span></p>
            </div>

            <div className="bg-[#1A1A2E] rounded-2xl p-6 text-center mb-6">
              <p className="text-3xl font-black text-[#B8860B] tracking-widest font-mono">{codeGenere.code}</p>
              <p className="text-[10px] text-slate-400 mt-2">Valable 7 jours</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => copierCode(codeGenere.code)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-sm transition-all"
              >
                {codeCopied ? <><Check size={16} className="text-green-500" /> Copié !</> : <><Copy size={16} /> Copier le code</>}
              </button>
              <button
                onClick={() => window.open(`https://wa.me/?text=Bonjour ! Voici votre code d'invitation ImmoAfrik : *${codeGenere.code}* %0AUtilisez ce code pour créer votre compte locataire sur l'application. Valable 7 jours.`, '_blank')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-sm transition-all"
              >
                <MessageCircle size={16} />
                Envoyer via WhatsApp
              </button>
              <button
                onClick={() => setCodeGenere(null)}
                className="w-full py-3 rounded-xl text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG AJOUTER / MODIFIER */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">
              {editTarget ? 'Modifier le locataire' : 'Nouveau locataire'}
            </DialogTitle>
            <DialogDescription>
              {editTarget ? 'Mettez à jour les informations du locataire.' : 'Renseignez les informations du nouveau locataire.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Prénom *</Label>
                  <Input className="rounded-xl" placeholder="Moussa" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Nom *</Label>
                  <Input className="rounded-xl" placeholder="Koné" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Téléphone *</Label>
                <Input className="rounded-xl" placeholder="+229 97 00 00 00" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input className="rounded-xl" type="email" placeholder="moussa@exemple.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nationalité</Label>
                  <Input className="rounded-xl" placeholder="Béninoise" value={form.nationalite} onChange={e => setForm(f => ({ ...f, nationalite: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>N° Pièce d'identité</Label>
                  <Input className="rounded-xl" placeholder="CNI / Passeport..." value={form.numero_piece_identite} onChange={e => setForm(f => ({ ...f, numero_piece_identite: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Date d'entrée</Label>
                <Input className="rounded-xl" type="date" value={form.date_entree} onChange={e => setForm(f => ({ ...f, date_entree: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Assigner à une chambre</Label>
                <Select value={form.unite_id} onValueChange={v => setForm(f => ({ ...f, unite_id: v }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Sélectionner une unité (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune pour l'instant</SelectItem>
                    {maisons.map(m => {
                      const maisUnites = unites.filter(u => u.maison_id === m.id);
                      return (
                        <React.Fragment key={m.id}>
                          <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">{m.nom}</div>
                          {maisUnites.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.nom} — {u.loyer_mensuel.toLocaleString()} FCFA
                              {u.statut === 'occupé' ? ' (occupée)' : ''}
                            </SelectItem>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-6 flex items-center gap-2"
              >
                {submitting ? <><Loader2 className="animate-spin" size={18} /> Enregistrement...</> : <><Users size={18} /> {editTarget ? 'Mettre à jour' : 'Créer le locataire'}</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

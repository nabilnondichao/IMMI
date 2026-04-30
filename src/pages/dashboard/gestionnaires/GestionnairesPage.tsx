import React, { useState } from 'react';
import {
  UserCog,
  Plus,
  Loader2,
  Copy,
  Check,
  Trash2,
  Shield,
  ShieldOff,
  MessageCircle,
  UserCheck,
  UserX,
  Phone,
  Mail,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useGestionnaires, inviterGestionnaire, updateGestionnaire, supprimerGestionnaire } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { Gestionnaire } from '@/lib/supabase';

const STATUT_CONFIG = {
  invité: { label: 'Invitation envoyée', color: 'bg-amber-100 text-amber-700' },
  actif: { label: 'Actif', color: 'bg-green-100 text-green-700' },
  suspendu: { label: 'Suspendu', color: 'bg-red-100 text-red-700' },
};

const PERM_LABELS: Record<string, string> = {
  maisons: 'Maisons',
  locataires: 'Locataires',
  paiements: 'Paiements',
  contrats: 'Contrats',
  depenses: 'Dépenses',
  analytics: 'Analytiques',
};

export default function GestionnairesPage() {
  const { user } = useAuth();
  const { gestionnaires, isLoading, refresh } = useGestionnaires();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email_invite: '',
    telephone: '',
    permissions: {
      maisons: true,
      locataires: true,
      paiements: true,
      contrats: false,
      depenses: false,
      analytics: false,
    },
  });

  function openCreate() {
    setForm({ nom: '', prenom: '', email_invite: '', telephone: '', permissions: { maisons: true, locataires: true, paiements: true, contrats: false, depenses: false, analytics: false } });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.email_invite) {
      setFormError('Nom, prénom et email sont obligatoires.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (!user) throw new Error('Non connecté');
      await inviterGestionnaire({
        proprietaire_id: user.id,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email_invite: form.email_invite.trim().toLowerCase(),
        telephone: form.telephone || null,
        statut: 'invité',
        permissions: form.permissions,
      });
      setDialogOpen(false);
      refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleSuspension(g: Gestionnaire) {
    const newStatut = g.statut === 'suspendu' ? 'actif' : 'suspendu';
    await updateGestionnaire(g.id, { statut: newStatut });
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce gestionnaire ?')) return;
    await supprimerGestionnaire(id);
    refresh();
  }

  function copierCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Gestionnaires</h1>
          <p className="text-sm text-slate-500">Invitez des gérants avec des accès et permissions restreints</p>
        </div>
        <Button onClick={openCreate} className="bg-[#B8860B] hover:bg-[#9A700A] text-white font-bold rounded-xl flex items-center gap-2">
          <Plus size={16} /> Inviter un gestionnaire
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <h3 className="text-2xl font-black text-[#1A1A2E] flex items-center gap-2">
              <UserCog size={20} className="text-slate-400" /> {gestionnaires.length}
            </h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-green-50/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-green-600/70 uppercase tracking-widest mb-1">Actifs</p>
            <h3 className="text-2xl font-black text-green-600 flex items-center gap-2">
              <UserCheck size={20} /> {gestionnaires.filter(g => g.statut === 'actif').length}
            </h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-amber-50/30">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest mb-1">En attente</p>
            <h3 className="text-2xl font-black text-amber-600 flex items-center gap-2">
              <UserX size={20} /> {gestionnaires.filter(g => g.statut === 'invité').length}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* LISTE */}
      {gestionnaires.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <UserCog size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="italic text-sm">Aucun gestionnaire invité pour l'instant.</p>
          <p className="text-xs text-slate-300 mt-2">Invitez votre employé ou gérant pour lui donner accès à la plateforme.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gestionnaires.map(g => {
            const cfg = STATUT_CONFIG[g.statut];
            return (
              <div key={g.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#1A1A2E] rounded-2xl flex items-center justify-center font-black text-[#B8860B] text-base">
                      {g.prenom[0]}{g.nom[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 tracking-tight">{g.prenom} {g.nom}</h4>
                      <Badge className={`${cfg.color} border-none text-[9px] font-black mt-1`}>{cfg.label}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className={`rounded-xl ${g.statut === 'suspendu' ? 'text-green-400 hover:text-green-600' : 'text-amber-400 hover:text-amber-600'}`}
                      onClick={() => toggleSuspension(g)} title={g.statut === 'suspendu' ? 'Réactiver' : 'Suspendre'}>
                      {g.statut === 'suspendu' ? <Shield size={16} /> : <ShieldOff size={16} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-red-500" onClick={() => handleDelete(g.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail size={12} className="text-slate-400" />
                    <span className="font-medium">{g.email_invite}</span>
                  </div>
                  {g.telephone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone size={12} className="text-slate-400" />
                      <span className="font-medium">{g.telephone}</span>
                    </div>
                  )}
                </div>

                {/* Permissions */}
                <div className="mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(g.permissions).map(([key, val]) => (
                      <span key={key} className={`text-[9px] font-black px-2 py-1 rounded-lg ${val ? 'bg-[#B8860B]/10 text-[#B8860B]' : 'bg-slate-100 text-slate-400 line-through'}`}>
                        {PERM_LABELS[key]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Code invitation */}
                {g.statut === 'invité' && g.code_invitation && (
                  <div className="bg-[#1A1A2E]/5 rounded-2xl p-3 mb-3">
                    <p className="text-[10px] text-slate-400 mb-1">Code d'invitation</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-[#1A1A2E] text-sm tracking-widest">{g.code_invitation}</span>
                      <button onClick={() => copierCode(g.code_invitation!, g.id)}
                        className="flex items-center gap-1 text-xs font-bold text-[#B8860B] hover:text-[#9A700A]">
                        {copiedId === g.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === g.id ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                  </div>
                )}

                {g.statut === 'invité' && g.code_invitation && (
                  <button
                    onClick={() => window.open(`https://wa.me/?text=Bonjour ${g.prenom} ! Vous êtes invité(e) à gérer des biens sur ImmoAfrik. Votre code d'accès : *${g.code_invitation}*. Inscrivez-vous sur l'application avec ce code.`, '_blank')}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white transition-all text-xs font-bold"
                  >
                    <MessageCircle size={14} /> Envoyer via WhatsApp
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DIALOG INVITER */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">Inviter un gestionnaire</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Prénom *</Label>
                  <Input className="rounded-xl" placeholder="Kofi" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Nom *</Label>
                  <Input className="rounded-xl" placeholder="Agbessi" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input className="rounded-xl" type="email" placeholder="kofi@exemple.com" value={form.email_invite} onChange={e => setForm(f => ({ ...f, email_invite: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Téléphone</Label>
                <Input className="rounded-xl" placeholder="+229 97 00 00 00" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
              </div>

              <div>
                <p className="text-sm font-black text-[#1A1A2E] mb-3">Permissions d'accès</p>
                <div className="space-y-3 bg-slate-50 rounded-2xl p-4">
                  {Object.keys(form.permissions).map(key => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{PERM_LABELS[key]}</span>
                      <Switch
                        checked={form.permissions[key as keyof typeof form.permissions]}
                        onCheckedChange={v => setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: v } }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}
                className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-6">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <><UserCog size={16} /> Envoyer l'invitation</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

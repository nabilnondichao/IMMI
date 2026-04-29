import React, { useState, useMemo } from 'react';
import {
  MessageCircle, Send, Users, Home, User, ChevronRight,
  CheckCircle2, Edit2, Trash2, Loader2, Plus, Copy, Check,
  Bell, Info, AlertTriangle, Wrench, Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMaisons, useAllUnites, useLocataires } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const TYPES_MSG = [
  { value: 'info', label: 'Information', icon: <Info size={14} />, color: 'bg-blue-100 text-blue-700' },
  { value: 'rappel_loyer', label: 'Rappel loyer', icon: <Bell size={14} />, color: 'bg-amber-100 text-amber-700' },
  { value: 'maintenance', label: 'Travaux / Maintenance', icon: <Wrench size={14} />, color: 'bg-orange-100 text-orange-700' },
  { value: 'avis_expulsion', label: 'Avis / Préavis', icon: <AlertTriangle size={14} />, color: 'bg-red-100 text-red-700' },
  { value: 'bienvenue', label: 'Bienvenue', icon: <Star size={14} />, color: 'bg-green-100 text-green-700' },
  { value: 'autre', label: 'Autre', icon: <MessageCircle size={14} />, color: 'bg-slate-100 text-slate-700' },
];

const VARIABLES = [
  { var: '{{nom}}', desc: 'Nom du locataire' },
  { var: '{{prenom}}', desc: 'Prénom' },
  { var: '{{unite}}', desc: 'Chambre / unité' },
  { var: '{{maison}}', desc: 'Nom de la maison' },
  { var: '{{loyer}}', desc: 'Montant du loyer' },
];

function renderMessage(template: string, vars: Record<string, string>): string {
  let msg = template;
  Object.entries(vars).forEach(([k, v]) => { msg = msg.replaceAll(k, v); });
  return msg;
}

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const { maisons } = useMaisons();
  const { unites } = useAllUnites();
  const { locataires } = useLocataires();

  // Composer state
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [typeMsg, setTypeMsg] = useState('info');
  const [cible, setCible] = useState<'tous' | 'maison' | 'individuel'>('tous');
  const [maisonSelectId, setMaisonSelectId] = useState('');
  const [locataireSelectId, setLocataireSelectId] = useState('');
  const [etape, setEtape] = useState<'compose' | 'preview' | 'sending'>('compose');
  const [indexEnvoi, setIndexEnvoi] = useState(0);
  const [envoyes, setEnvoyes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Destinataires calculés
  const destinataires = useMemo(() => {
    let locs = locataires.filter(l => l.telephone);
    if (cible === 'maison' && maisonSelectId) {
      const unitIds = unites.filter(u => u.maison_id === maisonSelectId).map(u => u.id);
      locs = locs.filter(l => l.unite_id && unitIds.includes(l.unite_id));
    } else if (cible === 'individuel' && locataireSelectId) {
      locs = locs.filter(l => l.id === locataireSelectId);
    }
    return locs;
  }, [locataires, unites, cible, maisonSelectId, locataireSelectId]);

  function getVarsForLocataire(loc: typeof locataires[0]) {
    const unt = unites.find(u => u.id === loc.unite_id);
    const msn = maisons.find(m => m.id === unt?.maison_id);
    return {
      '{{nom}}': loc.nom,
      '{{prenom}}': loc.prenom,
      '{{unite}}': unt?.nom || '',
      '{{maison}}': msn?.nom || '',
      '{{loyer}}': unt?.loyer_mensuel?.toLocaleString() || '',
    };
  }

  function buildWaLink(loc: typeof locataires[0]) {
    const msg = renderMessage(contenu, getVarsForLocataire(loc));
    const tel = loc.telephone.replace(/[\s+\-().]/g, '');
    return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
  }

  function envoyerTous() {
    // Ouvre les WhatsApp un par un
    destinataires.forEach((loc, i) => {
      setTimeout(() => {
        window.open(buildWaLink(loc), '_blank');
        setEnvoyes(prev => new Set([...prev, loc.id]));
      }, i * 800);
    });
  }

  function envoyerUnique(loc: typeof locataires[0]) {
    window.open(buildWaLink(loc), '_blank');
    setEnvoyes(prev => new Set([...prev, loc.id]));
  }

  async function sauvegarderModele() {
    if (!user || !contenu) return;
    setSaving(true);
    try {
      await supabase?.from('messages_wa').insert({
        proprietaire_id: user.id,
        titre: titre || 'Message sans titre',
        contenu,
        type: typeMsg,
      });
      alert('Modèle sauvegardé !');
    } catch { alert('Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  }

  function copierMessage() {
    navigator.clipboard.writeText(contenu);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const typeInfo = TYPES_MSG.find(t => t.value === typeMsg) || TYPES_MSG[0];
  const pret = contenu.trim().length > 0 && destinataires.length > 0;

  return (
    <div className="p-4 md:p-8 pb-32 lg:pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Messagerie WhatsApp</h1>
          <p className="text-sm text-slate-500">Envoyez des messages groupés ou individuels en un clic</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700 border-none font-bold flex items-center gap-1">
            <MessageCircle size={12} /> {locataires.filter(l => l.telephone).length} locataires joignables
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE — COMPOSITION */}
        <div className="lg:col-span-2 space-y-4">
          {/* Type de message */}
          <Card className="rounded-[2rem] border-slate-100 shadow-sm">
            <CardContent className="p-6">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Type de message</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TYPES_MSG.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTypeMsg(t.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                      typeMsg === t.value ? `${t.color} border-current` : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Destinataires */}
          <Card className="rounded-[2rem] border-slate-100 shadow-sm">
            <CardContent className="p-6">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Destinataires</Label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { val: 'tous', label: 'Tous', icon: <Users size={16} /> },
                  { val: 'maison', label: 'Par maison', icon: <Home size={16} /> },
                  { val: 'individuel', label: 'Individuel', icon: <User size={16} /> },
                ].map(o => (
                  <button
                    key={o.val}
                    onClick={() => setCible(o.val as any)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-bold transition-all border-2 ${
                      cible === o.val ? 'border-[#B8860B] bg-[#B8860B]/5 text-[#B8860B]' : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {o.icon} {o.label}
                  </button>
                ))}
              </div>

              {cible === 'maison' && (
                <Select value={maisonSelectId} onValueChange={setMaisonSelectId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir une maison..." /></SelectTrigger>
                  <SelectContent>
                    {maisons.map(m => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {cible === 'individuel' && (
                <Select value={locataireSelectId} onValueChange={setLocataireSelectId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir un locataire..." /></SelectTrigger>
                  <SelectContent>
                    {locataires.filter(l => l.telephone).map(l => {
                      const unt = unites.find(u => u.id === l.unite_id);
                      return <SelectItem key={l.id} value={l.id}>{l.prenom} {l.nom} {unt ? `(${unt.nom})` : ''}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              )}

              {destinataires.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 font-medium">
                  ✓ <span className="font-black text-[#1A1A2E]">{destinataires.length}</span> destinataire(s) sélectionné(s)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rédaction */}
          <Card className="rounded-[2rem] border-slate-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Votre message</Label>
                <button onClick={copierMessage} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600">
                  {copied ? <><Check size={12} className="text-green-500" /> Copié</> : <><Copy size={12} /> Copier</>}
                </button>
              </div>
              <div className="mb-3">
                <Input
                  className="rounded-xl mb-3"
                  placeholder="Titre du message (optionnel)"
                  value={titre}
                  onChange={e => setTitre(e.target.value)}
                />
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-[#B8860B] transition-colors font-medium"
                  rows={6}
                  placeholder={`Bonjour {{prenom}} {{nom}},\n\nVotre loyer pour la chambre {{unite}} ({{maison}}) du mois en cours est de {{loyer}} FCFA.\n\nMerci de régler dans les meilleurs délais.\n\n${profile?.prenom || 'Le Propriétaire'}`}
                  value={contenu}
                  onChange={e => setContenu(e.target.value)}
                />
              </div>

              {/* Variables */}
              <div className="flex flex-wrap gap-1">
                {VARIABLES.map(v => (
                  <button
                    key={v.var}
                    onClick={() => setContenu(c => c + v.var)}
                    title={v.desc}
                    className="text-[10px] font-mono font-bold bg-[#1A1A2E]/5 hover:bg-[#B8860B]/10 text-[#1A1A2E] px-2 py-1 rounded-lg transition-all"
                  >
                    {v.var}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Cliquez sur une variable pour l'insérer dans le message.</p>
            </CardContent>
          </Card>

          {/* ACTIONS */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={envoyerTous}
              disabled={!pret}
              className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-xl py-4 flex items-center gap-2 disabled:opacity-40"
            >
              <Send size={18} />
              Envoyer à tous ({destinataires.length})
            </Button>
            <Button
              onClick={sauvegarderModele}
              disabled={saving || !contenu}
              variant="outline"
              className="rounded-xl font-bold border-slate-200 px-6"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Sauvegarder
            </Button>
          </div>

          {!pret && (
            <p className="text-xs text-amber-600 font-medium bg-amber-50 px-4 py-2 rounded-xl">
              ⚠️ Rédigez un message et sélectionnez au moins un destinataire pour envoyer.
            </p>
          )}
        </div>

        {/* COLONNE DROITE — LISTE DESTINATAIRES */}
        <div className="space-y-4">
          <Card className="rounded-[2rem] border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Aperçu des destinataires
              </p>
              {destinataires.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Users size={32} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-xs italic">Aucun destinataire sélectionné</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {destinataires.map(loc => {
                    const unt = unites.find(u => u.id === loc.unite_id);
                    const msn = maisons.find(m => m.id === unt?.maison_id);
                    const estEnvoye = envoyes.has(loc.id);
                    const msgRendu = contenu ? renderMessage(contenu, getVarsForLocataire(loc)) : '';

                    return (
                      <div key={loc.id} className={`p-3 rounded-2xl border transition-all ${estEnvoye ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{loc.prenom} {loc.nom}</p>
                            <p className="text-[10px] text-slate-400 truncate">{unt?.nom || '—'} · {msn?.nom || '—'}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {estEnvoye ? (
                              <CheckCircle2 size={16} className="text-green-500" />
                            ) : (
                              <button
                                onClick={() => envoyerUnique(loc)}
                                disabled={!pret}
                                className="w-8 h-8 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                                title="Envoyer à ce locataire"
                              >
                                <Send size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        {msgRendu && (
                          <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 italic bg-white rounded-lg px-2 py-1">
                            {msgRendu.substring(0, 80)}{msgRendu.length > 80 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {envoyes.size > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-2xl text-center">
                  <p className="text-xs font-black text-green-700">
                    ✓ {envoyes.size}/{destinataires.length} message(s) envoyé(s)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Astuce groupe WhatsApp */}
          <Card className="rounded-[2rem] border-amber-100 bg-amber-50/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">💡 Astuce</p>
              <p className="text-xs text-amber-800 font-medium">
                Pour envoyer à tous d'un coup sans ouvrir plusieurs fenêtres, créez un groupe WhatsApp par maison et utilisez <span className="font-black">"Copier"</span> pour coller le message directement dans le groupe.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

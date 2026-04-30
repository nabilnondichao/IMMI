import React, { useState } from 'react';
import {
  Home, Receipt, FileText, User, LogOut, ChevronRight,
  Wallet, Zap, Droplets, Calendar, CheckCircle2, AlertCircle,
  Clock, Loader2, Phone, Mail, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMyLocataireProfile, useMaisons, useAllUnites, usePaiements, useContrats, useCautions } from '@/hooks/useData';

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
type View = 'accueil' | 'historique' | 'contrat' | 'profil';

export default function LocataireDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('accueil');
  const { profile, signOut } = useAuth();

  const { locataire, isLoading: locLoading } = useMyLocataireProfile();
  const { unites } = useAllUnites();
  const { maisons } = useMaisons();
  const { paiements, isLoading: paiementsLoading } = usePaiements({});
  const { contrats } = useContrats();
  const { cautions } = useCautions();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const unite = unites.find(u => u.id === locataire?.unite_id);
  const maison = maisons.find(m => m.id === unite?.maison_id);
  const myPaiements = paiements.filter(p => p.locataire_id === locataire?.id);
  const myContrat = contrats.find(c => c.locataire_id === locataire?.id);
  const myCaution = cautions.find(c => c.locataire_id === locataire?.id);

  const paiementDuMois = myPaiements.find(p => p.mois === currentMonth && p.annee === currentYear);
  const isPaid = paiementDuMois?.statut === 'payé';
  const isPending = paiementDuMois?.statut === 'en_attente';
  const montant = unite?.loyer_mensuel || 0;

  const isLoading = locLoading || paiementsLoading;

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-[#B8860B]" size={40} />
        <p className="text-slate-500 text-sm">Chargement...</p>
      </div>
    );
  }

  if (!locataire) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <User size={36} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-black text-[#1A1A2E] mb-2">Compte en attente</h2>
        <p className="text-sm text-slate-500 mb-6">
          Votre compte locataire est créé mais votre propriétaire doit encore vous assigner à votre logement.
          Contactez-le pour qu'il finalise votre inscription.
        </p>
        <div className="bg-[#1A1A2E] rounded-2xl p-4 text-left mb-6">
          <p className="text-xs text-slate-400 mb-1 font-bold">Votre email de connexion</p>
          <p className="text-[#B8860B] font-mono text-sm">{profile?.email}</p>
        </div>
        <Button onClick={handleSignOut} variant="outline" className="rounded-xl">Se déconnecter</Button>
      </div>
    );
  }

  const navItems: { view: View; icon: React.ReactNode; label: string }[] = [
    { view: 'accueil', icon: <Home size={20} />, label: 'Accueil' },
    { view: 'historique', icon: <Receipt size={20} />, label: 'Historique' },
    { view: 'contrat', icon: <FileText size={20} />, label: 'Contrat' },
    { view: 'profil', icon: <User size={20} />, label: 'Profil' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header fixe */}
      <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ImmoAfrik</p>
          <h1 className="text-lg font-black text-white">Bonjour {locataire.prenom} 👋</h1>
        </div>
        <button onClick={handleSignOut} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-slate-400 hover:text-white">
          <LogOut size={16} />
        </button>
      </div>

      {/* Navigation onglets */}
      <div className="bg-white border-b border-slate-100 px-4 flex gap-1 sticky top-0 z-10">
        {navItems.map(item => (
          <button key={item.view} onClick={() => setView(item.view)}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
              view === item.view ? 'border-[#B8860B] text-[#B8860B]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      <div className="p-5 pb-32 max-w-lg mx-auto">

        {/* === ACCUEIL === */}
        {view === 'accueil' && (
          <div className="space-y-5">
            {/* Ma chambre */}
            <Card className="rounded-[2rem] bg-[#1A1A2E] border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-[#B8860B]/20 rounded-xl flex items-center justify-center">
                    <Home size={18} className="text-[#B8860B]" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Mon logement</p>
                    <p className="font-black text-white">{unite.nom}</p>
                    <p className="text-xs text-slate-400">{maison?.nom} · {maison?.ville}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Loyer mensuel</p>
                    <p className="text-3xl font-black text-[#B8860B]">{montant.toLocaleString()} <span className="text-sm">FCFA</span></p>
                  </div>
                  <p className="text-xs text-slate-400">
                    Depuis le {new Date(locataire.date_entree).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Statut paiement du mois */}
            <Card className={`rounded-[2rem] border-2 shadow-sm ${isPaid ? 'border-green-200 bg-green-50' : isPending ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{MOIS_NOMS[currentMonth - 1]} {currentYear}</p>
                  <div className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${isPaid ? 'bg-green-200 text-green-800' : isPending ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'}`}>
                    {isPaid ? <><CheckCircle2 size={12} /> Payé</> : isPending ? <><Clock size={12} /> En attente</> : <><AlertCircle size={12} /> Non payé</>}
                  </div>
                </div>
                {!isPaid && !isPending && (
                  <Button onClick={() => navigate('/locataire/payer')}
                    className="w-full bg-[#B8860B] hover:bg-[#9A700A] text-white font-black rounded-xl py-4 mt-2 flex items-center justify-center gap-2">
                    <Wallet size={18} /> Payer {montant.toLocaleString()} FCFA maintenant
                  </Button>
                )}
                {isPending && (
                  <p className="text-xs text-amber-700 font-medium mt-2">Votre paiement est en cours de vérification par votre propriétaire.</p>
                )}
                {isPaid && (
                  <p className="text-xs text-green-700 font-medium mt-2">Paiement confirmé. Merci !</p>
                )}
              </CardContent>
            </Card>

            {/* Caution */}
            {myCaution && (
              <Card className="rounded-[2rem] border-slate-100 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#B8860B]/10 rounded-xl flex items-center justify-center">
                        <Shield size={18} className="text-[#B8860B]" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Caution</p>
                        <p className="font-black text-[#1A1A2E]">{myCaution.montant.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                    <div className={`text-[9px] font-black px-2 py-1 rounded-full ${myCaution.statut === 'encaissé' ? 'bg-blue-100 text-blue-700' : myCaution.statut === 'restitué' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {myCaution.statut === 'encaissé' ? 'En garde' : myCaution.statut === 'restitué' ? 'Restituée' : 'Retenue partielle'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* === HISTORIQUE === */}
        {view === 'historique' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-[#1A1A2E]">Historique des paiements</h2>
            {myPaiements.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Receipt size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm italic">Aucun paiement enregistré.</p>
              </div>
            ) : (
              myPaiements.sort((a, b) => b.annee - a.annee || b.mois - a.mois).map(p => (
                <div key={p.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.statut === 'payé' ? 'bg-green-100' : p.statut === 'en_attente' ? 'bg-amber-100' : 'bg-red-100'}`}>
                      {p.statut === 'payé' ? <CheckCircle2 size={18} className="text-green-600" /> : p.statut === 'en_attente' ? <Clock size={18} className="text-amber-600" /> : <AlertCircle size={18} className="text-red-500" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{MOIS_NOMS[p.mois - 1]} {p.annee}</p>
                      <p className="text-[10px] text-slate-400">{p.type === 'momo' ? `MoMo ${p.operateur_momo || ''}` : 'Cash'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#1A1A2E] text-sm">{p.montant.toLocaleString()} FCFA</p>
                    <p className={`text-[9px] font-black ${p.statut === 'payé' ? 'text-green-600' : p.statut === 'en_attente' ? 'text-amber-600' : 'text-red-500'}`}>
                      {p.statut === 'payé' ? 'Confirmé' : p.statut === 'en_attente' ? 'En attente' : 'Rejeté'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* === CONTRAT === */}
        {view === 'contrat' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-[#1A1A2E]">Mon contrat</h2>
            {!myContrat ? (
              <div className="text-center py-16 text-slate-400">
                <FileText size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm italic">Aucun contrat enregistré pour l'instant.</p>
              </div>
            ) : (
              <Card className="rounded-[2rem] border-slate-100 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Date d\'effet', value: new Date(myContrat.date_effet).toLocaleDateString('fr-FR') },
                      { label: 'Date de fin', value: new Date(myContrat.date_fin).toLocaleDateString('fr-FR') },
                      { label: 'Préavis', value: `${myContrat.preavis_jours} jours` },
                      { label: 'Caution', value: `${myContrat.caution_mois} mois` },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 rounded-2xl p-4">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="font-black text-[#1A1A2E] text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className={`text-center py-2 rounded-2xl text-xs font-black ${myContrat.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Statut : {myContrat.statut}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* === PROFIL === */}
        {view === 'profil' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-[#1A1A2E]">Mon profil</h2>
            <Card className="rounded-[2rem] border-slate-100 shadow-sm">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-[#1A1A2E] rounded-2xl flex items-center justify-center font-black text-[#B8860B] text-2xl mx-auto mb-5">
                  {locataire.prenom[0]}{locataire.nom[0]}
                </div>
                <h3 className="text-center font-black text-xl text-[#1A1A2E] mb-6">{locataire.prenom} {locataire.nom}</h3>
                <div className="space-y-3">
                  {[
                    { icon: <Phone size={14} />, label: locataire.telephone },
                    { icon: <Mail size={14} />, label: locataire.email || profile?.email || '—' },
                    { icon: <Home size={14} />, label: unite ? `${unite.nom} · ${maison?.nom}` : 'Pas de logement assigné' },
                    { icon: <Calendar size={14} />, label: `Entrée : ${new Date(locataire.date_entree).toLocaleDateString('fr-FR')}` },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
                      <span className="text-[#B8860B]">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button onClick={handleSignOut} variant="outline" className="w-full rounded-xl border-red-200 text-red-500 hover:bg-red-50 flex items-center gap-2">
              <LogOut size={16} /> Se déconnecter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

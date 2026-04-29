/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Home, 
  History, 
  FileText, 
  User, 
  CreditCard, 
  LogOut, 
  ChevronRight, 
  Download, 
  Bell, 
  Wallet, 
  Zap, 
  Droplets,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useLocataires, 
  useAllUnites, 
  useMaisons, 
  usePaiements, 
  useContrats 
} from '@/hooks/useData';
import { StatutPaiement, StatutUnite } from '@/types/immoafrik';

type View = 'accueil' | 'historique' | 'documents' | 'profil';

export default function LocataireDashboard() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>('accueil');
  const { profile, isLoading: authLoading } = useAuth();

  // Fetch data
  const { locataires, isLoading: locatairesLoading } = useLocataires();
  const { unites, isLoading: unitesLoading } = useAllUnites();
  const { maisons, isLoading: maisonsLoading } = useMaisons();
  const { paiements, isLoading: paiementsLoading } = usePaiements();
  const { contrats, isLoading: contratsLoading } = useContrats();

  const isLoading = authLoading || locatairesLoading || unitesLoading || maisonsLoading || paiementsLoading || contratsLoading;

  // Get current tenant data
  const tenant = locataires.find(l => l.id === profile?.id);
  const unit = unites.find(u => u.id === tenant?.unite_id);
  const house = maisons.find(m => m.id === unit?.maison_id);
  const contract = contrats.find(c => c.locataire_id === tenant?.id);

  // --- STATS & LOGIC ---
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthlyPayment = paiements.find(p => p.locataire_id === tenant?.id && p.mois === currentMonth && p.annee === currentYear);
  
  const isPaid = monthlyPayment?.statut === StatutPaiement.PAYE;
  const isPending = monthlyPayment?.statut === StatutPaiement.EN_ATTENTE;
  const amountDah = unit?.loyer_mensuel || 0;
  const amountPaid = monthlyPayment?.montant || 0;
  const remaining = Math.max(0, amountDah - amountPaid);

  const getMonthName = (m: number) => {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(2024, m - 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A2E] mx-auto mb-4"></div>
        <p className="text-slate-500">Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-500 font-bold">Profil locataire non trouvé.</p>
      </div>
    );
  }

  const renderAccueil = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Bonjour {tenant?.prenom} 👋</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Heureux de vous revoir</p>
        </div>
        <div className="w-12 h-12 bg-[#1A1A2E] rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-xl">
          {tenant?.prenom[0]}{tenant?.nom[0]}
        </div>
      </div>

      {/* MAIN PAYMENT CARD */}
      <div className={`rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden ${isPaid ? 'bg-green-600' : remaining > 0 ? 'bg-red-600' : 'bg-[#1A1A2E]'}`}>
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <History size={120} />
        </div>
        <div className="relative">
          <Badge className="bg-white/20 border-none text-white font-black text-[10px] mb-4 uppercase tracking-widest">
            LOYER {getMonthName(currentMonth)} {currentYear}
          </Badge>
          
          {isPaid ? (
            <div className="space-y-4">
              <h3 className="text-3xl font-black tracking-tight">Payé ✓</h3>
              <p className="text-green-100 font-medium">Votre loyer est à jour. Merci !</p>
              <div className="pt-4">
                <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-2xl font-bold flex items-center gap-2">
                  <Download size={18} /> Télécharger le reçu
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black tracking-tight">{remaining.toLocaleString()}</h3>
                <span className="text-sm font-bold">FCFA à payer</span>
              </div>
              <p className={remaining < amountDah ? 'text-amber-100' : 'text-red-100'}>
                {remaining < amountDah ? 'Paiement partiel déjà reçu' : 'Loyer en attente de règlement'}
              </p>
              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/locataire/payer')}
                  className="bg-white text-[#1A1A2E] hover:bg-slate-100 rounded-2xl font-black px-8 py-6 text-sm"
                >
                  Payer maintenant
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MON LOGEMENT */}
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mon logement</h4>
      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#B8860B]">
              <Home size={24} />
            </div>
            <div>
              <h5 className="font-black text-[#1A1A2E] tracking-tight">{house?.nom}</h5>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unité {unit?.nom} • {unit?.type}</p>
            </div>
          </div>
          <ChevronRight className="text-slate-300" />
        </CardContent>
      </Card>

      {/* MES SOLDES */}
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pt-2">Mes soldes services</h4>
      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-[2.2rem] border-slate-100 shadow-sm bg-blue-50/50">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="p-2 bg-blue-600 text-white w-fit rounded-xl">
              <Zap size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Électricité</p>
              <p className="text-lg font-black text-blue-900">4,250 <span className="text-[10px]">CFA</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[2.2rem] border-slate-100 shadow-sm bg-cyan-50/50">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="p-2 bg-cyan-600 text-white w-fit rounded-xl">
              <Droplets size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-cyan-900 uppercase tracking-widest">Eau (Forfait)</p>
              <p className="text-lg font-black text-cyan-900">OK <span className="text-[10px] uppercase font-bold">Avril</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ALERTES SECTION */}
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pt-2">Alertes & Infos</h4>
      <div className="space-y-3">
        {isPending && (
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-amber-50 border border-amber-100">
            <div className="bg-amber-200 text-amber-700 p-2 rounded-xl">
              <Bell size={20} />
            </div>
            <p className="text-xs font-bold text-amber-800">Votre paiement MoMo est en cours de vérification.</p>
          </div>
        )}
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-blue-50 border border-blue-100">
          <div className="bg-blue-200 text-blue-700 p-2 rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-800">Contrat à renouveler</p>
            <p className="text-[10px] text-blue-600">Votre contrat expire dans 45 jours. Pensez-y !</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistorique = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Historique</h2>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-50">
          {paiements.filter(p => p.locataire_id === tenant?.id).sort((a, b) => b.annee !== a.annee ? b.annee - a.annee : b.mois - a.mois).map(p => (
            <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${p.statut === StatutPaiement.PAYE ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  {p.mois}/{String(p.annee).slice(2)}
                </div>
                <div>
                  <h5 className="text-sm font-black text-slate-800 tracking-tight">{getMonthName(p.mois)} {p.annee}</h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.statut === StatutPaiement.PAYE ? 'Paiement Terminé' : 'En Attente'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-[#1A1A2E]">{p.montant.toLocaleString()} CFA</p>
                <button className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mt-1 flex items-center gap-1 justify-end">
                   <Download size={12} /> REÇU
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Mes Documents</h2>
      
      <div className="grid grid-cols-1 gap-4">
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm group hover:border-[#1A1A2E] transition-all cursor-pointer">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h5 className="font-black text-[#1A1A2E] tracking-tight">Contrat de Location</h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PDF • {contract?.date_effet} au {contract?.date_fin}</p>
              </div>
            </div>
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-[#1A1A2E] group-hover:text-white transition-all">
              <Download size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm group hover:border-[#1A1A2E] transition-all cursor-pointer">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h5 className="font-black text-[#1A1A2E] tracking-tight">Règlement Intérieur</h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Version 2024 • Signé</p>
              </div>
            </div>
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-[#1A1A2E] group-hover:text-white transition-all">
              <Download size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm group hover:border-[#1A1A2E] transition-all cursor-pointer">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h5 className="font-black text-[#1A1A2E] tracking-tight">Archives Quittances</h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fichier ZIP</p>
              </div>
            </div>
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-[#1A1A2E] group-hover:text-white transition-all">
              <Download size={20} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProfil = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <div className="w-24 h-24 bg-[#1A1A2E] rounded-[2rem] mx-auto flex items-center justify-center font-black text-white text-3xl shadow-2xl mb-4">
          {tenant?.prenom[0]}{tenant?.nom[0]}
        </div>
        <h2 className="text-2xl font-black text-[#1A1A2E] tracking-tight">{tenant?.prenom} {tenant?.nom}</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Locataire • {unit?.nom}</p>
      </div>

      <div className="space-y-4">
        <Card className="rounded-[2.2rem] border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-400">
                  <User size={18} />
                </div>
                <span className="text-sm font-bold text-slate-700">Mes informations</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                  <Smartphone size={18} />
                </div>
                <span className="text-sm font-bold text-slate-700">Numéro Mobile Money</span>
              </div>
              <span className="text-xs font-bold text-slate-400">{tenant?.telephone}</span>
            </div>
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                  <ShieldCheck size={18} />
                </div>
                <span className="text-sm font-bold text-slate-700">Changer mot de passe</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
          </div>
        </Card>

        <Button variant="ghost" className="w-full text-red-500 font-black py-8 rounded-[2rem] hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-2">
          <LogOut size={20} />
          DÉCONNEXION
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      {/* MOBILE HEADER */}
      <div className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 sticky top-0 z-50 flex items-center justify-between">
        <h1 className="font-black text-sm uppercase tracking-[0.2em] text-[#1A1A2E]">ImmoAfrik</h1>
        <button className="relative">
          <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500 border-2 border-white rounded-full"></Badge>
          <Bell size={20} className="text-[#1A1A2E]" />
        </button>
      </div>

      {/* CONTENT */}
      <main className="max-w-2xl mx-auto p-6">
        {currentView === 'accueil' && renderAccueil()}
        {currentView === 'historique' && renderHistorique()}
        {currentView === 'documents' && renderDocuments()}
        {currentView === 'profil' && renderProfil()}
      </main>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-50 lg:hidden">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <button 
            onClick={() => setCurrentView('accueil')}
            className={`flex flex-col items-center gap-1.5 py-2 transition-all ${currentView === 'accueil' ? 'text-[#B8860B]' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <Home size={22} className={currentView === 'accueil' ? 'scale-110' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">Accueil</span>
          </button>
          <button 
            onClick={() => setCurrentView('historique')}
            className={`flex flex-col items-center gap-1.5 py-2 transition-all ${currentView === 'historique' ? 'text-[#B8860B]' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <History size={22} className={currentView === 'historique' ? 'scale-110' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">Historique</span>
          </button>
          <button 
            onClick={() => setCurrentView('documents')}
            className={`flex flex-col items-center gap-1.5 py-2 transition-all ${currentView === 'documents' ? 'text-[#B8860B]' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <FileText size={22} className={currentView === 'documents' ? 'scale-110' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">Documents</span>
          </button>
          <button 
            onClick={() => setCurrentView('profil')}
            className={`flex flex-col items-center gap-1.5 py-2 transition-all ${currentView === 'profil' ? 'text-[#B8860B]' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <User size={22} className={currentView === 'profil' ? 'scale-110' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
}

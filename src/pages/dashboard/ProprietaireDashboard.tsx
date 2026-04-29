/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { 
  Building2, 
  AlertCircle, 
  Home, 
  Wallet, 
  Bell, 
  Check,
  X,
  TrendingUp,
  Calendar,
  ChevronRight,
  Loader2,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  useDashboardStats, 
  useMaisons, 
  usePendingPaiements, 
  useContrats, 
  useLocataires,
  useAllUnites,
  confirmPaiement,
  rejectPaiement
} from '../../hooks/useData';

export default function ProprietaireDashboard() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { maisons, isLoading: maisonsLoading } = useMaisons();
  const { unites } = useAllUnites();
  const { pendingPaiements, refresh: refreshPaiements, isLoading: paiementsLoading } = usePendingPaiements();
  const { contrats } = useContrats();
  const { locataires } = useLocataires();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/connexion');
    }
  }, [user, authLoading, navigate]);

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      await confirmPaiement(paymentId);
      refreshPaiements();
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      await rejectPaiement(paymentId);
      refreshPaiements();
    } catch (error) {
      console.error('Error rejecting payment:', error);
    }
  };

  // Calculate expiring contracts (within 30 days)
  const expiringContrats = contrats.filter(c => {
    if (c.statut !== 'actif') return false;
    const daysToExpiry = Math.floor((new Date(c.date_fin).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysToExpiry <= 30 && daysToExpiry >= 0;
  });

  // Chart data - placeholder for now, would need historical data
  const chartData = [
    { name: 'Nov', total: 0, color: '#1A1A2E' },
    { name: 'Déc', total: 0, color: '#1A1A2E' },
    { name: 'Jan', total: 0, color: '#1A1A2E' },
    { name: 'Fév', total: 0, color: '#1A1A2E' },
    { name: 'Mar', total: 0, color: '#1A1A2E' },
    { name: 'Avr', total: stats?.totalEncaisseMois || 0, color: '#B8860B' },
  ];

  const isLoading = authLoading || statsLoading || maisonsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-[#B8860B] mb-4" size={48} />
          <p className="text-slate-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const urgentAlertsCount = (pendingPaiements?.length || 0) + expiringContrats.length + (stats?.totalArrieres ? 1 : 0);

  return (
    <div className="p-4 md:p-8">
      {/* Welcome Banner for new users */}
      {maisons.length === 0 && (
        <div className="mb-8 bg-gradient-to-r from-[#1A1A2E] to-[#252542] rounded-[2rem] p-8 text-white">
          <h2 className="text-2xl font-black mb-2">Bienvenue sur ImmoAfrik, {profile?.prenom || 'Propriétaire'} !</h2>
          <p className="text-white/70 mb-6">Commencez par ajouter votre première propriété pour gérer vos locations.</p>
          <button 
            onClick={() => navigate('/dashboard/maisons')}
            className="bg-[#B8860B] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#9A7209] transition-colors"
          >
            <Plus size={20} />
            Ajouter une maison
          </button>
        </div>
      )}

      {/* LIGNE 1 : METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <Wallet size={20} />
            </div>
            {stats?.totalEncaisseMois ? (
              <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp size={12} /> Ce mois
              </span>
            ) : null}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Encaissé</p>
          <h3 className="text-2xl font-black text-[#1A1A2E]">
            {(stats?.totalEncaisseMois || 0).toLocaleString()} <span className="text-xs">FCFA</span>
          </h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <AlertCircle size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Arriérés totaux</p>
          <h3 className="text-2xl font-black text-red-600">
            {(stats?.totalArrieres || 0).toLocaleString()} <span className="text-xs">FCFA</span>
          </h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#1A1A2E] text-white rounded-2xl">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Occupation</p>
          <h3 className="text-2xl font-black text-[#1A1A2E]">{stats?.tauxOccupation || 0}%</h3>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#B8860B]" style={{ width: `${stats?.tauxOccupation || 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-amber-100 bg-amber-50/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
              <Bell size={20} />
            </div>
            {pendingPaiements && pendingPaiements.length > 0 && (
              <span className="animate-pulse bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Nouveau</span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Alertes Actives</p>
          <h3 className="text-2xl font-black text-amber-800">{urgentAlertsCount}</h3>
        </div>
      </div>

      {/* LIGNE 2 : GRAPHIQUE */}
      {maisons.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-black text-[#1A1A2E] tracking-tight">Analyse des Revenus</h3>
              <p className="text-xs text-slate-400 font-medium">Evolution des loyers collectés</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="w-3 h-3 bg-[#1A1A2E] rounded-sm"></div> Historique
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#B8860B] uppercase tracking-widest">
                <div className="w-3 h-3 bg-[#B8860B] rounded-sm"></div> Actuel
              </div>
            </div>
          </div>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#64748B' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }} 
                  width={80}
                  tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                  formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Collecté']}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* LIGNE 3 : COLONNES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        {/* MoMo Pending */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest flex items-center gap-2">
              <Wallet size={16} className="text-amber-500" />
              Paiements en attente
            </h3>
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
              {pendingPaiements?.length || 0} À VALIDER
            </span>
          </div>
          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            {paiementsLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="animate-spin text-slate-400" size={24} />
              </div>
            ) : pendingPaiements && pendingPaiements.length > 0 ? (
              pendingPaiements.map(p => {
                const loc = locataires.find(l => l.id === p.locataire_id);
                const unit = unites.find(u => u.id === p.unite_id);
                return (
                  <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-[10px] ${
                        p.operateur_momo === 'MTN' ? 'bg-amber-400' : 
                        p.operateur_momo === 'Wave' ? 'bg-blue-400' : 
                        p.operateur_momo === 'Orange' ? 'bg-orange-500' : 'bg-green-500'
                      }`}>
                        {p.operateur_momo || 'CASH'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 tracking-tight">
                          {loc ? `${loc.prenom} ${loc.nom}` : 'Locataire'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {unit?.nom || 'Unité'} - {p.montant.toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleConfirmPayment(p.id)}
                        className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors" 
                        title="Confirmer"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleRejectPayment(p.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors" 
                        title="Rejeter"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-slate-400 italic text-sm">Aucun paiement en attente.</div>
            )}
          </div>
        </div>

        {/* Alertes Urgentes */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest flex items-center gap-2">
              <Bell size={16} className="text-red-500" />
              Alertes de Gestion
            </h3>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Expiring Contracts */}
            {expiringContrats.map(c => {
              const loc = locataires.find(l => l.id === c.locataire_id);
              const daysToExpiry = Math.floor((new Date(c.date_fin).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              return (
                <div key={c.id} className="flex gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <div className="bg-amber-200 text-amber-700 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-800 uppercase tracking-tighter">
                      Contrat expire dans {daysToExpiry} jours
                    </p>
                    <p className="text-xs text-amber-700 font-medium">
                      {loc ? `${loc.prenom} ${loc.nom}` : 'Locataire'} - Fin le {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                    <button 
                      onClick={() => navigate('/dashboard/contrats')}
                      className="mt-2 text-[10px] font-black text-amber-900 underline underline-offset-2"
                    >
                      GÉRER LE CONTRAT
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Arrears Alert */}
            {stats?.totalArrieres && stats.totalArrieres > 0 && (
              <div className="flex gap-4 p-4 rounded-2xl bg-red-50 border border-red-100">
                <div className="bg-red-200 text-red-700 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-red-800 uppercase tracking-tighter">Arriérés non réglés</p>
                  <p className="text-xs text-red-700 font-medium">
                    Total: {stats.totalArrieres.toLocaleString()} FCFA impayés
                  </p>
                  <button 
                    onClick={() => navigate('/dashboard/paiements')}
                    className="mt-2 text-[10px] font-black text-red-900 underline underline-offset-2"
                  >
                    VOIR LES PAIEMENTS
                  </button>
                </div>
              </div>
            )}

            {urgentAlertsCount === 0 && (
              <div className="p-8 text-center text-slate-400 italic text-sm">
                Aucune alerte pour le moment.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIGNE 4 : TABLEAU RÉCAPITULATIF */}
      {maisons.length > 0 && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">Récapitulatif par Maison</h3>
            <button 
              onClick={() => navigate('/dashboard/maisons')}
              className="text-[10px] font-black bg-slate-100 px-4 py-2 rounded-xl text-slate-500 hover:bg-[#B8860B] hover:text-white transition-all"
            >
              VOIR TOUT
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  <th className="px-6 md:px-8 py-5">Maison</th>
                  <th className="px-4 md:px-6 py-5 hidden md:table-cell">Unités</th>
                  <th className="px-4 md:px-6 py-5">Taux Occ.</th>
                  <th className="px-4 md:px-6 py-5 hidden md:table-cell">Ville</th>
                  <th className="px-6 md:px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {maisons.map(maison => {
                  const houseUnits = unites.filter(u => u.maison_id === maison.id);
                  const occupied = houseUnits.filter(u => u.statut === 'occupé').length;
                  const occRate = houseUnits.length > 0 ? Math.round((occupied / houseUnits.length) * 100) : 0;

                  return (
                    <tr 
                      key={maison.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/dashboard/maisons/${maison.id}`)}
                    >
                      <td className="px-6 md:px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#B8860B]/10 group-hover:text-[#B8860B] transition-colors">
                            <Home size={16} />
                          </div>
                          <span className="text-sm font-bold text-slate-800 tracking-tight">{maison.nom}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 hidden md:table-cell">
                        {houseUnits.length} unités
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">{occRate}%</span>
                          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                            <div 
                              className={`h-full ${occRate > 80 ? 'bg-green-500' : occRate > 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                              style={{ width: `${occRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 hidden md:table-cell">
                        {maison.ville}
                      </td>
                      <td className="px-6 md:px-8 py-4 text-right">
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-[#B8860B] transition-transform translate-x-0 group-hover:translate-x-1" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

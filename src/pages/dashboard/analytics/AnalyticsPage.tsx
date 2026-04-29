import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Home, Users, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMaisons, useAllUnites, useLocataires, usePaiements, useDepenses } from '@/hooks/useData';

const COLORS = ['#B8860B', '#1A1A2E', '#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function AnalyticsPage() {
  const { maisons, isLoading: ml } = useMaisons();
  const { unites, isLoading: ul } = useAllUnites();
  const { locataires, isLoading: ll } = useLocataires();
  const { paiements, isLoading: pl } = usePaiements({});
  const { depenses, isLoading: dl } = useDepenses();

  const isLoading = ml || ul || ll || pl || dl;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Revenus par mois (année courante)
  const revenusParMois = useMemo(() => {
    return MOIS.map((nom, idx) => {
      const mois = idx + 1;
      const encaisse = paiements
        .filter(p => p.annee === currentYear && p.mois === mois && p.statut === 'payé')
        .reduce((s, p) => s + p.montant, 0);
      const depenseMois = depenses
        .filter(d => {
          const date = new Date(d.date_depense);
          return date.getFullYear() === currentYear && date.getMonth() + 1 === mois;
        })
        .reduce((s, d) => s + d.montant, 0);
      return { nom, encaisse, depenses: depenseMois, net: encaisse - depenseMois };
    });
  }, [paiements, depenses, currentYear]);

  // Taux occupation par maison
  const occupationParMaison = useMemo(() => {
    return maisons.map(m => {
      const unitesM = unites.filter(u => u.maison_id === m.id);
      const occupees = unitesM.filter(u => u.statut === 'occupé').length;
      const taux = unitesM.length > 0 ? Math.round((occupees / unitesM.length) * 100) : 0;
      return { nom: m.nom, taux, occupees, total: unitesM.length };
    });
  }, [maisons, unites]);

  // Répartition des dépenses par catégorie
  const depensesParCategorie = useMemo(() => {
    const cats: Record<string, number> = {};
    depenses.forEach(d => {
      const label = d.categorie === 'electricite' ? 'Électricité'
        : d.categorie === 'plomberie' ? 'Plomberie'
        : d.categorie === 'peinture' ? 'Peinture'
        : d.categorie === 'menuiserie' ? 'Menuiserie' : 'Autre';
      cats[label] = (cats[label] || 0) + d.montant;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [depenses]);

  // KPIs du mois courant
  const kpis = useMemo(() => {
    const paiementsMois = paiements.filter(p => p.mois === currentMonth && p.annee === currentYear);
    const encaisseMois = paiementsMois.filter(p => p.statut === 'payé').reduce((s, p) => s + p.montant, 0);
    const attenduMois = unites.filter(u => u.statut === 'occupé').reduce((s, u) => s + u.loyer_mensuel, 0);
    const arrieresMois = Math.max(0, attenduMois - encaisseMois);
    const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);
    const totalEncaisse = paiements.filter(p => p.statut === 'payé').reduce((s, p) => s + p.montant, 0);
    const tauxRecouvrement = attenduMois > 0 ? Math.round((encaisseMois / attenduMois) * 100) : 0;
    return { encaisseMois, attenduMois, arrieresMois, totalDepenses, totalEncaisse, tauxRecouvrement };
  }, [paiements, unites, depenses, currentMonth, currentYear]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#B8860B]" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Analytiques</h1>
        <p className="text-sm text-slate-500">Vue approfondie de vos performances immobilières</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-green-50/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-green-600" />
              <p className="text-[10px] font-black text-green-600/70 uppercase tracking-widest">Encaissé ce mois</p>
            </div>
            <h3 className="text-xl font-black text-green-700">{kpis.encaisseMois.toLocaleString()}<span className="text-[10px] ml-1">FCFA</span></h3>
            <p className="text-[10px] text-slate-400 mt-1">sur {kpis.attenduMois.toLocaleString()} attendus</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-red-50/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-[10px] font-black text-red-500/70 uppercase tracking-widest">Arriérés mois</p>
            </div>
            <h3 className="text-xl font-black text-red-600">{kpis.arrieresMois.toLocaleString()}<span className="text-[10px] ml-1">FCFA</span></h3>
            <p className="text-[10px] text-slate-400 mt-1">Taux de recouvrement : {kpis.tauxRecouvrement}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Home size={16} className="text-[#B8860B]" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parc immobilier</p>
            </div>
            <h3 className="text-xl font-black text-[#1A1A2E]">{unites.filter(u => u.statut === 'occupé').length}<span className="text-[10px] text-slate-400 ml-1">/ {unites.length} unités</span></h3>
            <p className="text-[10px] text-slate-400 mt-1">{maisons.length} maisons • {locataires.length} locataires</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-[#1A1A2E]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-[#B8860B]" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total encaissé</p>
            </div>
            <h3 className="text-xl font-black text-white">{kpis.totalEncaisse.toLocaleString()}<span className="text-[10px] ml-1 text-slate-400">FCFA</span></h3>
            <p className="text-[10px] text-slate-500 mt-1">Dépenses totales : {kpis.totalDepenses.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique revenus par mois */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">Revenus vs Dépenses — {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenusParMois} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="nom" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  formatter={(v: number, name: string) => [`${v.toLocaleString()} FCFA`, name === 'encaisse' ? 'Encaissé' : name === 'depenses' ? 'Dépenses' : 'Net']}
                />
                <Bar dataKey="encaisse" fill="#B8860B" radius={[6, 6, 0, 0]} barSize={20} name="encaisse" />
                <Bar dataKey="depenses" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} name="depenses" />
                <Bar dataKey="net" fill="#1A1A2E" radius={[6, 6, 0, 0]} barSize={20} name="net" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4 justify-center">
            {[{ color: '#B8860B', label: 'Encaissé' }, { color: '#ef4444', label: 'Dépenses' }, { color: '#1A1A2E', label: 'Net' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-[10px] font-bold text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Taux d'occupation par maison */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">Taux d'occupation par maison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {occupationParMaison.map(m => (
                <div key={m.nom}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">{m.nom}</span>
                    <span className="text-xs font-black text-[#1A1A2E]">{m.occupees}/{m.total} — {m.taux}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${m.taux >= 80 ? 'bg-green-500' : m.taux >= 50 ? 'bg-[#B8860B]' : 'bg-red-400'}`}
                      style={{ width: `${m.taux}%` }}
                    />
                  </div>
                </div>
              ))}
              {occupationParMaison.length === 0 && (
                <p className="text-center text-slate-400 italic text-sm py-8">Ajoutez des maisons pour voir les statistiques.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dépenses par catégorie */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">Dépenses par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {depensesParCategorie.length === 0 ? (
              <p className="text-center text-slate-400 italic text-sm py-8">Aucune dépense enregistrée.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={depensesParCategorie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {depensesParCategorie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString()} FCFA`]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend formatter={(v) => <span style={{ fontSize: 11, fontWeight: 700 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Évolution net sur 12 mois */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">Revenu net mensuel — {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenusParMois}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="nom" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  formatter={(v: number) => [`${v.toLocaleString()} FCFA`, 'Revenu net']}
                />
                <Line type="monotone" dataKey="net" stroke="#B8860B" strokeWidth={3} dot={{ fill: '#B8860B', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

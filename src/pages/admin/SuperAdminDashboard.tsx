import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Banknote, Loader2, ShieldCheck, Building2,
  Globe, Percent, RefreshCw, LogOut, LayoutDashboard,
  TrendingUp, UserCheck, AlertCircle, Home, ChevronRight,
  Calendar, BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getPaysConfig } from '@/lib/countries';

interface ProprioRow {
  id: string; nom: string; prenom: string; email: string;
  pays: string; code_unique: string; created_at: string;
  statut: string; nb_maisons: number; nb_locataires: number;
  revenus_mois: number; commission_mois: number; revenus_annee: number;
}

type Tab = 'dashboard' | 'proprios' | 'commissions';

export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [rows, setRows] = useState<ProprioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshed, setRefreshed] = useState(new Date());

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    try {
      const now = new Date();
      const cm = now.getMonth() + 1;
      const cy = now.getFullYear();

      const { data: profiles } = await supabase
        .from('profiles').select('*').eq('role', 'proprietaire').order('created_at', { ascending: false });
      if (!profiles) return;

      const data = await Promise.all(profiles.map(async p => {
        const [mRes, lRes, pMois, pAnnee] = await Promise.all([
          supabase!.from('maisons').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id),
          supabase!.from('locataires').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id),
          supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('mois', cm).eq('annee', cy).eq('statut', 'payé'),
          supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('annee', cy).eq('statut', 'payé'),
        ]);
        const rMois = (pMois.data || []).reduce((s: number, x: any) => s + x.montant, 0);
        const rAnnee = (pAnnee.data || []).reduce((s: number, x: any) => s + x.montant, 0);
        return {
          id: p.id, nom: p.nom, prenom: p.prenom, email: p.email,
          pays: p.pays || 'Bénin', code_unique: p.code_unique || '—',
          created_at: p.created_at, statut: p.statut || 'actif',
          nb_maisons: mRes.count || 0, nb_locataires: lRes.count || 0,
          revenus_mois: rMois, commission_mois: Math.round(rMois * 3.5 / 100),
          revenus_annee: rAnnee,
        };
      }));
      setRows(data);
      setRefreshed(new Date());
    } finally { setLoading(false); }
  }

  const kpis = useMemo(() => ({
    proprios: rows.length,
    maisons: rows.reduce((s, r) => s + r.nb_maisons, 0),
    locataires: rows.reduce((s, r) => s + r.nb_locataires, 0),
    revenus_mois: rows.reduce((s, r) => s + r.revenus_mois, 0),
    commission_mois: rows.reduce((s, r) => s + r.commission_mois, 0),
    revenus_annee: rows.reduce((s, r) => s + r.revenus_annee, 0),
    commission_annee: rows.reduce((s, r) => s + Math.round(r.revenus_annee * 3.5 / 100), 0),
    actifs: rows.filter(r => r.statut === 'actif').length,
  }), [rows]);

  const paysStats = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach(r => { map[r.pays] = (map[r.pays] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Vue générale', icon: <LayoutDashboard size={15} /> },
    { id: 'proprios', label: 'Propriétaires', icon: <Users size={15} /> },
    { id: 'commissions', label: 'Commissions', icon: <Percent size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── TOPBAR ── */}
      <header className="bg-[#1A1A2E] px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#B8860B] rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm tracking-wide">ImmoAfrik — Super Admin</p>
            <p className="text-[10px] text-slate-400">
              {profile?.prenom} {profile?.nom} · Actualisé à {refreshed.toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all">
            <Home size={13} />
            <span className="hidden sm:inline">Mon dashboard</span>
          </button>
          <button onClick={async () => { await signOut(); navigate('/'); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-300 transition-all">
            <LogOut size={13} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* ── NAV TABS ── */}
      <div className="bg-white border-b border-slate-100 px-6 flex gap-1 sticky top-[72px] z-30">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
              tab === t.id ? 'border-[#B8860B] text-[#B8860B]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-16">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { l: 'Proprios', v: kpis.proprios, c: '#1A1A2E', icon: <Users size={14} /> },
            { l: 'Actifs', v: kpis.actifs, c: '#10B981', icon: <UserCheck size={14} /> },
            { l: 'Maisons', v: kpis.maisons, c: '#3B82F6', icon: <Building2 size={14} /> },
            { l: 'Locataires', v: kpis.locataires, c: '#8B5CF6', icon: <Users size={14} /> },
            { l: 'Rev. mois', v: `${kpis.revenus_mois.toLocaleString('fr-FR')} F`, c: '#F59E0B', icon: <Banknote size={14} /> },
            { l: 'Com. mois', v: `${kpis.commission_mois.toLocaleString('fr-FR')} F`, c: '#B8860B', icon: <Percent size={14} /> },
            { l: 'Rev. année', v: `${kpis.revenus_annee.toLocaleString('fr-FR')} F`, c: '#059669', icon: <TrendingUp size={14} /> },
            { l: 'Com. année', v: `${kpis.commission_annee.toLocaleString('fr-FR')} F`, c: '#DC2626', icon: <BarChart3 size={14} /> },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-1.5 mb-2" style={{ color: k.c }}>
                {k.icon}
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{k.l}</p>
              </div>
              <p className="font-black text-base" style={{ color: k.c }}>{k.v}</p>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#B8860B]" size={36} />
          </div>
        )}

        {/* ── VUE GÉNÉRALE ── */}
        {!loading && tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Commission du mois */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#1A1A2E] rounded-[2rem] p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Percent size={18} className="text-[#B8860B]" />
                  <h3 className="font-black uppercase tracking-widest text-sm">Commission à percevoir ce mois</h3>
                </div>
                <p className="text-5xl font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')}</p>
                <p className="text-slate-400 text-sm mt-1">FCFA — 3,5% de {kpis.revenus_mois.toLocaleString('fr-FR')} FCFA collectés</p>
                <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Cette année</p>
                    <p className="text-2xl font-black text-green-400">{kpis.commission_annee.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Taux</p>
                    <p className="text-2xl font-black text-[#B8860B]">3,5%</p>
                  </div>
                </div>
              </div>

              {/* Pays couverts */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={18} className="text-[#B8860B]" />
                  <h3 className="font-black uppercase tracking-widest text-sm text-[#1A1A2E]">Présence géographique</h3>
                </div>
                <div className="space-y-2">
                  {paysStats.length === 0 ? (
                    <p className="text-slate-400 italic text-sm">Aucun propriétaire inscrit.</p>
                  ) : paysStats.map(([pays, count]) => {
                    const conf = getPaysConfig(pays);
                    return (
                      <div key={pays} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{conf.flag}</span>
                          <span className="text-sm font-bold text-slate-700">{pays}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-[#B8860B]/20 rounded-full overflow-hidden w-20">
                            <div className="h-full bg-[#B8860B] rounded-full" style={{ width: `${(count / kpis.proprios) * 100}%` }} />
                          </div>
                          <span className="text-xs font-black text-[#B8860B] w-4">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Derniers inscrits */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} className="text-[#B8860B]" /> Derniers inscrits
                </h3>
                <button onClick={() => setTab('proprios')} className="text-xs font-bold text-[#B8860B] flex items-center gap-1 hover:opacity-80">
                  Voir tous <ChevronRight size={13} />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {rows.slice(0, 5).map(p => {
                  const conf = getPaysConfig(p.pays);
                  return (
                    <div key={p.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#1A1A2E] rounded-xl flex items-center justify-center font-black text-[#B8860B] text-xs">
                          {p.prenom[0]}{p.nom[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{p.prenom} {p.nom}</p>
                          <p className="text-[10px] text-slate-400">{conf.flag} {p.pays} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#B8860B]">{p.commission_mois.toLocaleString('fr-FR')} FCFA</p>
                        <p className="text-[10px] text-slate-400">commission mois</p>
                      </div>
                    </div>
                  );
                })}
                {rows.length === 0 && <p className="p-8 text-center text-slate-400 italic text-sm">Aucun propriétaire inscrit.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── PROPRIÉTAIRES ── */}
        {!loading && tab === 'proprios' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-[#B8860B]" /> Tous les propriétaires
              </h2>
              <span className="bg-slate-100 text-slate-600 text-xs font-black px-3 py-1 rounded-full">{rows.length}</span>
            </div>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
                <Users size={36} className="text-slate-200" />
                <p className="italic text-sm">Aucun propriétaire inscrit.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {rows.map(p => {
                  const conf = getPaysConfig(p.pays);
                  return (
                    <div key={p.id} className="p-5 flex items-center justify-between flex-wrap gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#1A1A2E] rounded-2xl flex items-center justify-center font-black text-[#B8860B] shrink-0">
                          {p.prenom[0]}{p.nom[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{p.prenom} {p.nom}</p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400">{conf.flag} {p.pays}</span>
                            <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">{p.code_unique}</span>
                            <span className="text-[9px] text-slate-300">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        {[
                          { l: 'Maisons', v: p.nb_maisons },
                          { l: 'Locataires', v: p.nb_locataires },
                        ].map((s, i) => (
                          <div key={i} className="text-center min-w-[50px]">
                            <p className="text-lg font-black text-[#1A1A2E]">{s.v}</p>
                            <p className="text-[9px] text-slate-400 uppercase font-bold">{s.l}</p>
                          </div>
                        ))}
                        <div className="bg-green-50 rounded-xl px-3 py-2 text-center">
                          <p className="text-sm font-black text-green-600">{p.revenus_mois.toLocaleString('fr-FR')}</p>
                          <p className="text-[9px] text-green-700 uppercase">{conf.symbole}/mois</p>
                        </div>
                        <div className="bg-[#B8860B]/10 rounded-xl px-3 py-2 text-center">
                          <p className="text-sm font-black text-[#B8860B]">{p.commission_mois.toLocaleString('fr-FR')}</p>
                          <p className="text-[9px] text-[#B8860B] uppercase">Commission</p>
                        </div>
                        <div className={`text-[9px] font-black px-2 py-1 rounded-lg ${p.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {p.statut}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── COMMISSIONS ── */}
        {!loading && tab === 'commissions' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-[#1A1A2E] rounded-[2rem] p-6 text-white">
                <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-2">À percevoir ce mois</p>
                <p className="text-5xl font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')}</p>
                <p className="text-slate-400 text-sm mt-1">FCFA (3,5% de {kpis.revenus_mois.toLocaleString('fr-FR')} FCFA)</p>
              </div>
              <div className="bg-white rounded-[2rem] border border-green-100 shadow-sm p-6">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Cumulé cette année</p>
                <p className="text-5xl font-black text-green-600">{kpis.commission_annee.toLocaleString('fr-FR')}</p>
                <p className="text-slate-400 text-sm mt-1">FCFA (3,5% de {kpis.revenus_annee.toLocaleString('fr-FR')} FCFA)</p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
              <div className="p-5 border-b border-slate-50">
                <h2 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest flex items-center gap-2">
                  <Percent size={14} className="text-[#B8860B]" /> Détail par propriétaire
                </h2>
              </div>
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-50">
                    {['Propriétaire', 'Pays', 'Revenus mois', 'Commission mois', 'Revenus année', 'Commission année'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic text-sm">Aucune donnée.</td></tr>
                  ) : rows.map(p => {
                    const conf = getPaysConfig(p.pays);
                    const ca = Math.round(p.revenus_annee * 3.5 / 100);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-[#1A1A2E]">{p.prenom} {p.nom}</p>
                          <p className="text-[10px] text-slate-400">{p.email}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">{conf.flag} {p.pays}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-700">{p.revenus_mois.toLocaleString('fr-FR')} {conf.symbole}</td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-black ${p.commission_mois > 0 ? 'text-[#B8860B]' : 'text-slate-400'}`}>
                            {p.commission_mois.toLocaleString('fr-FR')} {conf.symbole}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-700">{p.revenus_annee.toLocaleString('fr-FR')} {conf.symbole}</td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-black ${ca > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                            {ca.toLocaleString('fr-FR')} {conf.symbole}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {rows.length > 0 && (
                  <tfoot className="border-t-2 border-[#B8860B]/20 bg-[#B8860B]/5">
                    <tr>
                      <td className="px-5 py-4 text-sm font-black text-[#B8860B]" colSpan={2}>TOTAL</td>
                      <td className="px-5 py-4 text-sm font-black text-slate-700">{kpis.revenus_mois.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-sm font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-sm font-black text-slate-700">{kpis.revenus_annee.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-sm font-black text-green-600">{kpis.commission_annee.toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

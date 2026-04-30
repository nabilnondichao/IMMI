import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Mail, Lock, Loader2, LogOut, RefreshCw,
  Users, Home, Building2, Banknote, Percent, TrendingUp,
  AlertCircle, CheckCircle2, Eye, EyeOff, Globe, UserX,
  BarChart3, Calendar, Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPaysConfig } from '@/lib/countries';

interface AdminUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
}

interface ProprioRow {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  pays: string;
  code_unique: string;
  created_at: string;
  nb_maisons: number;
  nb_unites: number;
  nb_locataires: number;
  revenus_mois: number;
  commission_mois: number;
  revenus_annee: number;
}

interface GlobalKpis {
  proprios: number;
  maisons: number;
  unites: number;
  locataires: number;
  revenus_mois: number;
  commission_mois: number;
  revenus_annee: number;
  commission_annee: number;
}

export default function AdminPortal() {
  const [phase, setPhase] = useState<'login' | 'dashboard'>('login');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [proprios, setProprios] = useState<ProprioRow[]>([]);
  const [kpis, setKpis] = useState<GlobalKpis>({ proprios: 0, maisons: 0, unites: 0, locataires: 0, revenus_mois: 0, commission_mois: 0, revenus_annee: 0, commission_annee: 0 });
  const [dataLoading, setDataLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'vue' | 'proprios' | 'commissions'>('vue');

  // Vérifier si session admin déjà active
  useEffect(() => {
    const savedAdmin = sessionStorage.getItem('immo_admin_session');
    if (savedAdmin) {
      try {
        const parsed = JSON.parse(savedAdmin);
        setAdminUser(parsed);
        setPhase('dashboard');
      } catch { sessionStorage.removeItem('immo_admin_session'); }
    }
  }, []);

  useEffect(() => {
    if (phase === 'dashboard') loadData();
  }, [phase]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      if (!supabase) throw new Error('Service indisponible');

      // Connexion Supabase
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw new Error('Email ou mot de passe incorrect.');

      // Vérifier is_super_admin
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, nom, prenom, email, is_super_admin')
        .eq('id', authData.user.id)
        .single();

      if (profileErr || !profile) throw new Error('Profil introuvable.');
      if (!profile.is_super_admin) {
        await supabase.auth.signOut();
        throw new Error('Accès refusé. Ce compte n\'a pas les droits administrateur.');
      }

      const admin = { id: profile.id, email: profile.email, nom: profile.nom, prenom: profile.prenom };
      setAdminUser(admin);
      sessionStorage.setItem('immo_admin_session', JSON.stringify(admin));
      setPhase('dashboard');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Erreur de connexion.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await supabase?.auth.signOut();
    sessionStorage.removeItem('immo_admin_session');
    setAdminUser(null);
    setPhase('login');
    setProprios([]);
    setEmail('');
    setPassword('');
  }

  async function loadData() {
    if (!supabase) return;
    setDataLoading(true);
    try {
      const now = new Date();
      const cm = now.getMonth() + 1;
      const cy = now.getFullYear();

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'proprietaire')
        .order('created_at', { ascending: false });

      if (!profiles) return;

      const rows = await Promise.all(profiles.map(async (p) => {
        const { data: maisons } = await supabase!.from('maisons').select('id').eq('proprietaire_id', p.id);
        const maisonIds = maisons?.map(m => m.id) || [];
        let nbUnites = 0;
        if (maisonIds.length > 0) {
          const { count } = await supabase!.from('unites').select('id', { count: 'exact', head: true }).in('maison_id', maisonIds);
          nbUnites = count || 0;
        }
        const { count: nbLoc } = await supabase!.from('locataires').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id);
        const { data: pMois } = await supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('mois', cm).eq('annee', cy).eq('statut', 'payé');
        const { data: pAnnee } = await supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('annee', cy).eq('statut', 'payé');
        const revMois = (pMois || []).reduce((s: number, x: any) => s + x.montant, 0);
        const revAnnee = (pAnnee || []).reduce((s: number, x: any) => s + x.montant, 0);
        return {
          id: p.id, nom: p.nom, prenom: p.prenom, email: p.email,
          pays: p.pays || 'Bénin', code_unique: p.code_unique || '—',
          created_at: p.created_at,
          nb_maisons: maisonIds.length, nb_unites: nbUnites, nb_locataires: nbLoc || 0,
          revenus_mois: revMois, commission_mois: Math.round(revMois * 3.5 / 100),
          revenus_annee: revAnnee,
        };
      }));

      setProprios(rows);
      setKpis({
        proprios: rows.length,
        maisons: rows.reduce((s, r) => s + r.nb_maisons, 0),
        unites: rows.reduce((s, r) => s + r.nb_unites, 0),
        locataires: rows.reduce((s, r) => s + r.nb_locataires, 0),
        revenus_mois: rows.reduce((s, r) => s + r.revenus_mois, 0),
        commission_mois: rows.reduce((s, r) => s + r.commission_mois, 0),
        revenus_annee: rows.reduce((s, r) => s + r.revenus_annee, 0),
        commission_annee: rows.reduce((s, r) => s + Math.round(r.revenus_annee * 3.5 / 100), 0),
      });
      setLastRefresh(new Date());
    } finally { setDataLoading(false); }
  }

  // ─────────────────────────────────────────
  // PAGE LOGIN
  // ─────────────────────────────────────────
  if (phase === 'login') {
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#B8860B]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-900/20 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2" />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-[#B8860B] to-[#9A700A] rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-[#B8860B]/30 mb-5">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">ImmoAfrik</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Portail Administrateur</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-[#B8860B]/10 border border-[#B8860B]/20 rounded-full px-4 py-1.5">
              <div className="w-1.5 h-1.5 bg-[#B8860B] rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest">Accès restreint</span>
            </div>
          </div>

          {/* Formulaire */}
          <div className="bg-[#1A1A2E] rounded-[2rem] p-8 border border-white/5 shadow-2xl">
            {loginError && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs font-medium">{loginError}</p>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email administrateur</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" required placeholder="admin@immoafrik.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B8860B]/50 focus:bg-white/8 transition-all"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mot de passe</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type={showPwd ? 'text' : 'password'} required placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B8860B]/50 transition-all"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loginLoading}
                className="w-full bg-gradient-to-r from-[#B8860B] to-[#9A700A] text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 mt-2 shadow-lg shadow-[#B8860B]/20">
                {loginLoading ? <><Loader2 className="animate-spin" size={18} /> Vérification...</> : <><ShieldCheck size={18} /> Accéder au panneau admin</>}
              </button>
            </form>
          </div>
          <p className="text-center text-slate-700 text-xs mt-6 font-medium">
            Accès réservé à l'équipe ImmoAfrik
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // DASHBOARD ADMIN
  // ─────────────────────────────────────────
  const TABS = [
    { id: 'vue', label: 'Vue générale', icon: <BarChart3 size={16} /> },
    { id: 'proprios', label: 'Propriétaires', icon: <Users size={16} /> },
    { id: 'commissions', label: 'Commissions', icon: <Percent size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D1A] text-white">
      {/* TOPBAR */}
      <header className="bg-[#1A1A2E] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gradient-to-br from-[#B8860B] to-[#9A700A] rounded-xl flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-white text-sm tracking-wide">ImmoAfrik Admin</h1>
            <p className="text-[10px] text-slate-500">
              {adminUser?.prenom} {adminUser?.nom} · {lastRefresh ? `Mis à jour ${lastRefresh.toLocaleTimeString('fr-FR')}` : 'Chargement...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={dataLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all">
            <RefreshCw size={14} className={dataLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 hover:text-red-300 transition-all">
            <LogOut size={14} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { label: 'Propriétaires', value: kpis.proprios, icon: <Users size={14} />, color: 'text-blue-400', glow: 'shadow-blue-500/10' },
            { label: 'Maisons', value: kpis.maisons, icon: <Building2 size={14} />, color: 'text-purple-400', glow: 'shadow-purple-500/10' },
            { label: 'Unités', value: kpis.unites, icon: <Home size={14} />, color: 'text-cyan-400', glow: 'shadow-cyan-500/10' },
            { label: 'Locataires', value: kpis.locataires, icon: <Users size={14} />, color: 'text-green-400', glow: 'shadow-green-500/10' },
            { label: 'Rev. ce mois', value: `${kpis.revenus_mois.toLocaleString('fr-FR')}`, icon: <Banknote size={14} />, color: 'text-amber-400', glow: 'shadow-amber-500/10', suffix: ' F' },
            { label: 'Com. ce mois', value: `${kpis.commission_mois.toLocaleString('fr-FR')}`, icon: <Percent size={14} />, color: 'text-[#B8860B]', glow: 'shadow-[#B8860B]/10', suffix: ' F' },
            { label: 'Rev. année', value: `${kpis.revenus_annee.toLocaleString('fr-FR')}`, icon: <TrendingUp size={14} />, color: 'text-emerald-400', glow: 'shadow-emerald-500/10', suffix: ' F' },
            { label: 'Com. année', value: `${kpis.commission_annee.toLocaleString('fr-FR')}`, icon: <BarChart3 size={14} />, color: 'text-rose-400', glow: 'shadow-rose-500/10', suffix: ' F' },
          ].map((k, i) => (
            <div key={i} className={`bg-[#1A1A2E] border border-white/5 rounded-2xl p-4 shadow-lg ${k.glow}`}>
              <div className={`flex items-center gap-1.5 ${k.color} mb-2 text-[10px] font-bold uppercase tracking-wider`}>
                {k.icon} {k.label}
              </div>
              <p className={`text-lg font-black ${k.color}`}>{k.value}{k.suffix || ''}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-6 bg-[#1A1A2E] p-1 rounded-2xl border border-white/5 w-fit">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === tab.id ? 'bg-[#B8860B] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {dataLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="animate-spin text-[#B8860B] mx-auto mb-3" size={36} />
              <p className="text-slate-500 text-sm">Chargement des données...</p>
            </div>
          </div>
        )}

        {/* VUE GÉNÉRALE */}
        {!dataLoading && activeTab === 'vue' && (
          <div className="space-y-6">
            {/* Résumé rapide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl p-6 col-span-1 md:col-span-2">
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Globe size={14} /> Couverture géographique
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(proprios.map(p => p.pays))).map(pays => {
                    const conf = getPaysConfig(pays);
                    const count = proprios.filter(p => p.pays === pays).length;
                    return (
                      <div key={pays} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                        <span className="text-lg">{conf.flag}</span>
                        <span className="text-xs font-bold text-slate-300">{pays}</span>
                        <span className="text-[10px] bg-[#B8860B]/20 text-[#B8860B] font-black px-2 py-0.5 rounded-full">{count}</span>
                      </div>
                    );
                  })}
                  {proprios.length === 0 && <p className="text-slate-600 text-sm italic">Aucun propriétaire inscrit</p>}
                </div>
              </div>

              <div className="bg-[#1A1A2E] border border-[#B8860B]/20 rounded-2xl p-6">
                <h3 className="font-black text-sm uppercase tracking-widest text-[#B8860B] mb-4 flex items-center gap-2">
                  <Percent size={14} /> Commission à collecter
                </h3>
                <p className="text-3xl font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-slate-500 mt-1">FCFA ce mois (3,5%)</p>
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-lg font-black text-emerald-400">{kpis.commission_annee.toLocaleString('fr-FR')}</p>
                  <p className="text-xs text-slate-500">FCFA cette année</p>
                </div>
              </div>
            </div>

            {/* Activité récente */}
            <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl p-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Calendar size={14} /> Propriétaires récents
              </h3>
              {proprios.slice(0, 5).length === 0 ? (
                <p className="text-slate-600 italic text-sm">Aucun propriétaire encore.</p>
              ) : (
                <div className="space-y-3">
                  {proprios.slice(0, 5).map(p => {
                    const conf = getPaysConfig(p.pays);
                    return (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#B8860B]/10 rounded-xl flex items-center justify-center font-black text-[#B8860B] text-xs">
                            {p.prenom[0]}{p.nom[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{p.prenom} {p.nom}</p>
                            <p className="text-[10px] text-slate-500">{conf.flag} {p.pays} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-[#B8860B]">{p.commission_mois.toLocaleString('fr-FR')} F</p>
                          <p className="text-[10px] text-slate-600">commission</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LISTE PROPRIÉTAIRES */}
        {!dataLoading && activeTab === 'proprios' && (
          <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-black text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Users size={14} /> Tous les propriétaires
              </h2>
              <span className="text-xs bg-white/5 text-slate-400 font-black px-3 py-1 rounded-full">{proprios.length}</span>
            </div>
            {proprios.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-600">
                <UserX size={36} />
                <p className="text-sm italic">Aucun propriétaire inscrit.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {proprios.map(p => {
                  const conf = getPaysConfig(p.pays);
                  return (
                    <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-[#B8860B]/30 to-[#B8860B]/10 rounded-xl flex items-center justify-center font-black text-[#B8860B] shrink-0">
                          {p.prenom[0]}{p.nom[0]}
                        </div>
                        <div>
                          <p className="font-black text-white">{p.prenom} {p.nom}</p>
                          <p className="text-xs text-slate-500">{p.email}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-slate-500">{conf.flag} {p.pays}</span>
                            <span className="font-mono text-[9px] bg-white/5 text-slate-500 px-2 py-0.5 rounded-lg">{p.code_unique}</span>
                            <span className="text-[9px] text-slate-600">Inscrit {new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        {[
                          { label: 'Maisons', value: p.nb_maisons },
                          { label: 'Unités', value: p.nb_unites },
                          { label: 'Locataires', value: p.nb_locataires },
                        ].map((s, i) => (
                          <div key={i} className="text-center min-w-[50px]">
                            <p className="text-base font-black text-white">{s.value}</p>
                            <p className="text-[9px] text-slate-600 uppercase font-bold">{s.label}</p>
                          </div>
                        ))}
                        <div className="text-center min-w-[80px] bg-green-500/10 rounded-xl px-3 py-2">
                          <p className="text-sm font-black text-green-400">{p.revenus_mois.toLocaleString('fr-FR')}</p>
                          <p className="text-[9px] text-green-700 uppercase font-bold">{conf.symbole}/mois</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COMMISSIONS */}
        {!dataLoading && activeTab === 'commissions' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#1A1A2E] border border-[#B8860B]/20 rounded-2xl p-6">
                <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-2">Total à percevoir ce mois</p>
                <p className="text-4xl font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')}</p>
                <p className="text-sm text-slate-500 mt-1">FCFA (3,5% de {kpis.revenus_mois.toLocaleString('fr-FR')} FCFA)</p>
              </div>
              <div className="bg-[#1A1A2E] border border-emerald-500/20 rounded-2xl p-6">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Total perçu cette année</p>
                <p className="text-4xl font-black text-emerald-400">{kpis.commission_annee.toLocaleString('fr-FR')}</p>
                <p className="text-sm text-slate-500 mt-1">FCFA (3,5% de {kpis.revenus_annee.toLocaleString('fr-FR')} FCFA)</p>
              </div>
            </div>

            <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h2 className="font-black text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Percent size={14} /> Détail par propriétaire
                </h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.03]">
                    {['Propriétaire', 'Pays', 'Revenus mois', 'Commission mois', 'Revenus année', 'Commission année'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {proprios.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-600 italic text-sm">Aucune donnée.</td></tr>
                  ) : proprios.map(p => {
                    const conf = getPaysConfig(p.pays);
                    const commAnnee = Math.round(p.revenus_annee * 3.5 / 100);
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-xs font-black text-white">{p.prenom} {p.nom}</p>
                          <p className="text-[10px] text-slate-600">{p.email}</p>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">{conf.flag} {p.pays}</td>
                        <td className="px-5 py-4 text-xs font-bold text-slate-300">{p.revenus_mois.toLocaleString('fr-FR')} {conf.symbole}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-black ${p.commission_mois > 0 ? 'text-[#B8860B]' : 'text-slate-600'}`}>
                            {p.commission_mois.toLocaleString('fr-FR')} {conf.symbole}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-slate-300">{p.revenus_annee.toLocaleString('fr-FR')} {conf.symbole}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-black ${commAnnee > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {commAnnee.toLocaleString('fr-FR')} {conf.symbole}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {proprios.length > 0 && (
                  <tfoot className="border-t border-[#B8860B]/20">
                    <tr className="bg-[#B8860B]/5">
                      <td className="px-5 py-4 text-xs font-black text-[#B8860B]" colSpan={2}>TOTAL</td>
                      <td className="px-5 py-4 text-xs font-black text-slate-300">{kpis.revenus_mois.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-xs font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-xs font-black text-slate-300">{kpis.revenus_annee.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-xs font-black text-emerald-400">{kpis.commission_annee.toLocaleString('fr-FR')} FCFA</td>
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

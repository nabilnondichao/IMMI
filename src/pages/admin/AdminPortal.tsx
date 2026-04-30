import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Mail, Lock, Loader2, LogOut, RefreshCw,
  Users, Home, Building2, Banknote, Percent, TrendingUp,
  AlertCircle, Eye, EyeOff, Globe, UserX, BarChart3,
  Calendar, Shield, UserCog, Ban, CheckCircle2, X,
  Save, Edit2, ChevronDown, ChevronUp, StickyNote,
  Crown, UserCheck, EyeOff as EyeOffIcon, Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPaysConfig } from '@/lib/countries';

/* ─── Types ─────────────────────────────── */
interface AdminUser { id: string; email: string; nom: string; prenom: string }

interface UserRow {
  id: string; nom: string; prenom: string; email: string;
  pays: string; code_unique: string; created_at: string;
  role: string; admin_role: string | null; is_super_admin: boolean;
  statut: string; permissions: Record<string, boolean> | null; admin_notes: string | null;
  nb_maisons: number; nb_locataires: number; revenus_mois: number; commission_mois: number; revenus_annee: number;
}

interface GlobalKpis {
  proprios: number; maisons: number; unites: number; locataires: number;
  revenus_mois: number; commission_mois: number; revenus_annee: number; commission_annee: number;
}

/* ─── Constantes ─────────────────────────── */
const ADMIN_ROLES = [
  { value: null, label: 'Aucun', desc: 'Propriétaire standard', icon: <Users size={14} />, color: 'text-slate-400' },
  { value: 'moderateur', label: 'Modérateur', desc: 'Peut voir les données, pas modifier', icon: <Eye size={14} />, color: 'text-blue-400' },
  { value: 'admin', label: 'Administrateur', desc: 'Gestion complète sauf rôles', icon: <UserCog size={14} />, color: 'text-purple-400' },
  { value: 'super_admin', label: 'Super Admin', desc: 'Accès total + gestion des rôles', icon: <Crown size={14} />, color: 'text-[#B8860B]' },
];

const PERMISSIONS_LIST = [
  { key: 'view_dashboard', label: 'Voir le dashboard', group: 'Vue' },
  { key: 'view_maisons', label: 'Voir les maisons', group: 'Vue' },
  { key: 'manage_maisons', label: 'Gérer les maisons', group: 'Gestion' },
  { key: 'view_locataires', label: 'Voir les locataires', group: 'Vue' },
  { key: 'manage_locataires', label: 'Gérer les locataires', group: 'Gestion' },
  { key: 'view_paiements', label: 'Voir les paiements', group: 'Vue' },
  { key: 'manage_paiements', label: 'Enregistrer paiements', group: 'Gestion' },
  { key: 'confirm_paiements', label: 'Confirmer/rejeter MoMo', group: 'Gestion' },
  { key: 'view_contrats', label: 'Voir les contrats', group: 'Vue' },
  { key: 'manage_contrats', label: 'Gérer les contrats', group: 'Gestion' },
  { key: 'view_depenses', label: 'Voir les dépenses', group: 'Vue' },
  { key: 'manage_depenses', label: 'Gérer les dépenses', group: 'Gestion' },
  { key: 'view_analytics', label: 'Voir les analytiques', group: 'Vue' },
  { key: 'manage_momo', label: 'Configurer MoMo', group: 'Paramètres' },
  { key: 'manage_cautions', label: 'Gérer les cautions', group: 'Gestion' },
  { key: 'invite_locataires', label: 'Inviter des locataires', group: 'Gestion' },
];

const PERM_PRESETS: Record<string, string[]> = {
  'Lecture seule': ['view_dashboard', 'view_maisons', 'view_locataires', 'view_paiements', 'view_contrats', 'view_depenses', 'view_analytics'],
  'Gestionnaire': ['view_dashboard', 'view_maisons', 'view_locataires', 'manage_locataires', 'view_paiements', 'manage_paiements', 'confirm_paiements', 'view_contrats', 'invite_locataires'],
  'Comptable': ['view_dashboard', 'view_paiements', 'manage_paiements', 'view_depenses', 'manage_depenses', 'view_analytics'],
  'Accès complet': PERMISSIONS_LIST.map(p => p.key),
};

/* ─── Composant ─────────────────────────── */
export default function AdminPortal() {
  const [phase, setPhase] = useState<'login' | 'dashboard'>('login');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [kpis, setKpis] = useState<GlobalKpis>({ proprios: 0, maisons: 0, unites: 0, locataires: 0, revenus_mois: 0, commission_mois: 0, revenus_annee: 0, commission_annee: 0 });
  const [dataLoading, setDataLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'vue' | 'proprios' | 'roles' | 'commissions'>('vue');

  // Edition rôle
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingPerms, setEditingPerms] = useState<string | null>(null);
  const [permState, setPermState] = useState<Record<string, boolean>>({});
  const [notesEditing, setNotesEditing] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('immo_admin_session');
    if (saved) { try { setAdminUser(JSON.parse(saved)); setPhase('dashboard'); } catch { sessionStorage.removeItem('immo_admin_session'); } }
  }, []);

  useEffect(() => { if (phase === 'dashboard') loadData(); }, [phase]);

  /* ─── Auth ─────────────────────── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true); setLoginError(null);
    try {
      if (!supabase) throw new Error('Service indisponible');
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw new Error('Email ou mot de passe incorrect.');
      const { data: profile } = await supabase.from('profiles').select('id,nom,prenom,email,is_super_admin,admin_role').eq('id', authData.user.id).single();
      if (!profile?.is_super_admin && !['super_admin','admin'].includes(profile?.admin_role)) {
        await supabase.auth.signOut();
        throw new Error('Accès refusé. Droits administrateur requis.');
      }
      const admin = { id: profile.id, email: profile.email, nom: profile.nom, prenom: profile.prenom };
      setAdminUser(admin);
      sessionStorage.setItem('immo_admin_session', JSON.stringify(admin));
      setPhase('dashboard');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Erreur.');
    } finally { setLoginLoading(false); }
  }

  async function handleLogout() {
    await supabase?.auth.signOut();
    sessionStorage.removeItem('immo_admin_session');
    setAdminUser(null); setPhase('login'); setUsers([]); setEmail(''); setPassword('');
  }

  /* ─── Data ─────────────────────── */
  async function loadData() {
    if (!supabase) return;
    setDataLoading(true);
    try {
      const now = new Date(); const cm = now.getMonth() + 1; const cy = now.getFullYear();
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!profiles) return;

      const rows = await Promise.all(profiles.map(async (p) => {
        const { data: maisons } = await supabase!.from('maisons').select('id').eq('proprietaire_id', p.id);
        const mIds = maisons?.map(m => m.id) || [];
        let nbUnites = 0;
        if (mIds.length > 0) { const { count } = await supabase!.from('unites').select('id', { count: 'exact', head: true }).in('maison_id', mIds); nbUnites = count || 0; }
        const { count: nbLoc } = await supabase!.from('locataires').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id);
        const { data: pMois } = await supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('mois', cm).eq('annee', cy).eq('statut', 'payé');
        const { data: pAnnee } = await supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('annee', cy).eq('statut', 'payé');
        const revMois = (pMois || []).reduce((s: number, x: any) => s + x.montant, 0);
        const revAnnee = (pAnnee || []).reduce((s: number, x: any) => s + x.montant, 0);
        return {
          id: p.id, nom: p.nom, prenom: p.prenom, email: p.email,
          pays: p.pays || 'Bénin', code_unique: p.code_unique || '—', created_at: p.created_at,
          role: p.role, admin_role: p.admin_role || null, is_super_admin: p.is_super_admin || false,
          statut: p.statut || 'actif', permissions: p.permissions || null, admin_notes: p.admin_notes || null,
          nb_maisons: mIds.length, nb_unites: nbUnites, nb_locataires: nbLoc || 0,
          revenus_mois: revMois, commission_mois: Math.round(revMois * 3.5 / 100), revenus_annee: revAnnee,
        };
      }));

      const proprios = rows.filter(r => r.role === 'proprietaire');
      setUsers(rows);
      setKpis({
        proprios: proprios.length, maisons: proprios.reduce((s, r) => s + r.nb_maisons, 0),
        unites: proprios.reduce((s, r) => s + r.nb_unites, 0), locataires: proprios.reduce((s, r) => s + r.nb_locataires, 0),
        revenus_mois: proprios.reduce((s, r) => s + r.revenus_mois, 0),
        commission_mois: proprios.reduce((s, r) => s + r.commission_mois, 0),
        revenus_annee: proprios.reduce((s, r) => s + r.revenus_annee, 0),
        commission_annee: proprios.reduce((s, r) => s + Math.round(r.revenus_annee * 3.5 / 100), 0),
      });
      setLastRefresh(new Date());
    } finally { setDataLoading(false); }
  }

  /* ─── Actions rôles ─────────────── */
  async function updateAdminRole(userId: string, newRole: string | null) {
    if (!supabase) return;
    setSaving(true);
    await supabase.from('profiles').update({
      admin_role: newRole,
      is_super_admin: newRole === 'super_admin',
    }).eq('id', userId);
    setSaving(false);
    setEditingRole(null);
    await loadData();
  }

  async function toggleStatut(userId: string, currentStatut: string) {
    if (!supabase) return;
    const newStatut = currentStatut === 'actif' ? 'suspendu' : 'actif';
    await supabase.from('profiles').update({
      statut: newStatut,
      suspended_at: newStatut === 'suspendu' ? new Date().toISOString() : null,
    }).eq('id', userId);
    await loadData();
  }

  async function savePermissions(userId: string) {
    if (!supabase) return;
    setSaving(true);
    await supabase.from('profiles').update({ permissions: permState }).eq('id', userId);
    setSaving(false);
    setEditingPerms(null);
    await loadData();
  }

  async function saveNotes(userId: string) {
    if (!supabase) return;
    setSaving(true);
    await supabase.from('profiles').update({ admin_notes: notesDraft }).eq('id', userId);
    setSaving(false);
    setNotesEditing(null);
    await loadData();
  }

  function openEditPerms(user: UserRow) {
    const base: Record<string, boolean> = {};
    PERMISSIONS_LIST.forEach(p => { base[p.key] = user.permissions?.[p.key] ?? false; });
    setPermState(base);
    setEditingPerms(user.id);
  }

  function applyPreset(preset: string) {
    const keys = PERM_PRESETS[preset] || [];
    const updated: Record<string, boolean> = {};
    PERMISSIONS_LIST.forEach(p => { updated[p.key] = keys.includes(p.key); });
    setPermState(updated);
  }

  /* ─── Helpers UI ─────────────────── */
  function getRoleBadge(user: UserRow) {
    if (user.admin_role === 'super_admin') return <span className="text-[9px] font-black bg-[#B8860B]/20 text-[#B8860B] px-2 py-1 rounded-lg flex items-center gap-1"><Crown size={10} /> Super Admin</span>;
    if (user.admin_role === 'admin') return <span className="text-[9px] font-black bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg flex items-center gap-1"><UserCog size={10} /> Admin</span>;
    if (user.admin_role === 'moderateur') return <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg flex items-center gap-1"><Eye size={10} /> Modérateur</span>;
    if (user.role === 'proprietaire') return <span className="text-[9px] font-black bg-white/5 text-slate-400 px-2 py-1 rounded-lg flex items-center gap-1"><Home size={10} /> Propriétaire</span>;
    return <span className="text-[9px] font-black bg-white/5 text-slate-500 px-2 py-1 rounded-lg flex items-center gap-1"><Users size={10} /> Locataire</span>;
  }

  function getStatutBadge(statut: string) {
    if (statut === 'actif') return <span className="text-[9px] font-black bg-green-500/20 text-green-400 px-2 py-1 rounded-lg flex items-center gap-1"><CheckCircle2 size={10} /> Actif</span>;
    if (statut === 'suspendu') return <span className="text-[9px] font-black bg-red-500/20 text-red-400 px-2 py-1 rounded-lg flex items-center gap-1"><Ban size={10} /> Suspendu</span>;
    return <span className="text-[9px] font-black bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg flex items-center gap-1"><AlertCircle size={10} /> En attente</span>;
  }

  /* ─────────────────────────────────────────────
     PAGE LOGIN
  ───────────────────────────────────────────── */
  if (phase === 'login') {
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#B8860B]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-900/20 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2" />
        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-[#B8860B] to-[#9A700A] rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-[#B8860B]/30 mb-5">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">ImmoAfrik</h1>
            <p className="text-slate-500 text-sm mt-1">Portail Administrateur</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-[#B8860B]/10 border border-[#B8860B]/20 rounded-full px-4 py-1.5">
              <div className="w-1.5 h-1.5 bg-[#B8860B] rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest">Accès restreint</span>
            </div>
          </div>
          <div className="bg-[#1A1A2E] rounded-[2rem] p-8 border border-white/5 shadow-2xl">
            {loginError && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs font-medium">{loginError}</p>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" required placeholder="admin@immoafrik.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B8860B]/50 transition-all"
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
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPwd ? <EyeOffIcon size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loginLoading}
                className="w-full bg-gradient-to-r from-[#B8860B] to-[#9A700A] text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 mt-2 shadow-lg shadow-[#B8860B]/20">
                {loginLoading ? <><Loader2 className="animate-spin" size={18} /> Vérification...</> : <><ShieldCheck size={18} /> Accéder au panneau admin</>}
              </button>
            </form>
          </div>
          <p className="text-center text-slate-700 text-xs mt-6">Accès réservé à l'équipe ImmoAfrik</p>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     DASHBOARD ADMIN
  ───────────────────────────────────────────── */
  const TABS = [
    { id: 'vue', label: 'Vue générale', icon: <BarChart3 size={15} /> },
    { id: 'proprios', label: 'Propriétaires', icon: <Users size={15} /> },
    { id: 'roles', label: 'Rôles & Droits', icon: <Shield size={15} /> },
    { id: 'commissions', label: 'Commissions', icon: <Percent size={15} /> },
  ];

  const groupedPerms = PERMISSIONS_LIST.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {} as Record<string, typeof PERMISSIONS_LIST>);

  return (
    <div className="min-h-screen bg-[#0D0D1A] text-white">
      {/* TOPBAR */}
      <header className="bg-[#1A1A2E] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gradient-to-br from-[#B8860B] to-[#9A700A] rounded-xl flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-white text-sm">ImmoAfrik Admin</h1>
            <p className="text-[10px] text-slate-500">{adminUser?.prenom} {adminUser?.nom} · {lastRefresh ? `Mis à jour ${lastRefresh.toLocaleTimeString('fr-FR')}` : '...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={dataLoading} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all">
            <RefreshCw size={14} className={dataLoading ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 hover:text-red-300 transition-all">
            <LogOut size={14} /> <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { l: 'Propriétaires', v: kpis.proprios, c: 'text-blue-400' },
            { l: 'Maisons', v: kpis.maisons, c: 'text-purple-400' },
            { l: 'Unités', v: kpis.unites, c: 'text-cyan-400' },
            { l: 'Locataires', v: kpis.locataires, c: 'text-green-400' },
            { l: 'Rev. mois', v: `${kpis.revenus_mois.toLocaleString('fr-FR')} F`, c: 'text-amber-400' },
            { l: 'Com. mois', v: `${kpis.commission_mois.toLocaleString('fr-FR')} F`, c: 'text-[#B8860B]' },
            { l: 'Rev. année', v: `${kpis.revenus_annee.toLocaleString('fr-FR')} F`, c: 'text-emerald-400' },
            { l: 'Com. année', v: `${kpis.commission_annee.toLocaleString('fr-FR')} F`, c: 'text-rose-400' },
          ].map((k, i) => (
            <div key={i} className="bg-[#1A1A2E] border border-white/5 rounded-2xl p-4">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider mb-2">{k.l}</p>
              <p className={`text-base font-black ${k.c}`}>{k.v}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-6 bg-[#1A1A2E] p-1 rounded-2xl border border-white/5 w-fit overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-[#B8860B] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {dataLoading && <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#B8860B]" size={36} /></div>}

        {/* ── VUE GÉNÉRALE ── */}
        {!dataLoading && activeTab === 'vue' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl p-6 col-span-2">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Globe size={13} /> Couverture</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(users.filter(u => u.role === 'proprietaire').map(u => u.pays))).map(pays => {
                    const c = getPaysConfig(pays); const cnt = users.filter(u => u.pays === pays && u.role === 'proprietaire').length;
                    return <div key={pays} className="flex items-center gap-1.5 bg-white/5 rounded-xl px-3 py-1.5"><span>{c.flag}</span><span className="text-xs font-bold text-slate-300">{pays}</span><span className="text-[9px] bg-[#B8860B]/20 text-[#B8860B] font-black px-1.5 py-0.5 rounded-full">{cnt}</span></div>;
                  })}
                  {users.length === 0 && <p className="text-slate-600 text-sm italic">Aucun utilisateur</p>}
                </div>
              </div>
              <div className="bg-[#1A1A2E] border border-[#B8860B]/20 rounded-2xl p-6">
                <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-2">Commission ce mois</p>
                <p className="text-4xl font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-slate-500 mt-1">FCFA (3,5%)</p>
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xl font-black text-emerald-400">{kpis.commission_annee.toLocaleString('fr-FR')}</p>
                  <p className="text-xs text-slate-500">FCFA cette année</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl p-6">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Calendar size={13} /> Inscrits récents</h3>
              <div className="space-y-3">
                {users.slice(0, 6).map(u => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#B8860B]/10 rounded-xl flex items-center justify-center font-black text-[#B8860B] text-xs">{u.prenom[0]}{u.nom[0]}</div>
                      <div>
                        <p className="text-xs font-bold text-white">{u.prenom} {u.nom}</p>
                        <p className="text-[10px] text-slate-600">{getPaysConfig(u.pays).flag} {u.pays} · {new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">{getRoleBadge(u)}{getStatutBadge(u.statut)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PROPRIÉTAIRES ── */}
        {!dataLoading && activeTab === 'proprios' && (
          <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2"><Users size={13} /> Tous les utilisateurs</h2>
              <span className="text-xs bg-white/5 text-slate-400 font-black px-3 py-1 rounded-full">{users.length}</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {users.map(u => {
                const conf = getPaysConfig(u.pays);
                return (
                  <div key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${u.statut === 'suspendu' ? 'bg-red-500/20 text-red-400' : 'bg-[#B8860B]/10 text-[#B8860B]'}`}>
                          {u.prenom[0]}{u.nom[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-white text-sm">{u.prenom} {u.nom}</p>
                            {getRoleBadge(u)} {getStatutBadge(u.statut)}
                          </div>
                          <p className="text-xs text-slate-500">{u.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-600">{conf.flag} {u.pays}</span>
                            <span className="font-mono text-[9px] bg-white/5 text-slate-600 px-2 py-0.5 rounded-lg">{u.code_unique}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {[{ l: 'Maisons', v: u.nb_maisons }, { l: 'Locataires', v: u.nb_locataires }].map((s, i) => (
                          <div key={i} className="text-center min-w-[50px]">
                            <p className="text-sm font-black text-white">{s.v}</p>
                            <p className="text-[9px] text-slate-600 uppercase">{s.l}</p>
                          </div>
                        ))}
                        <div className="text-center min-w-[80px] bg-green-500/10 rounded-xl px-3 py-2">
                          <p className="text-xs font-black text-green-400">{u.revenus_mois.toLocaleString('fr-FR')}</p>
                          <p className="text-[9px] text-green-700 uppercase">{conf.symbole}/mois</p>
                        </div>
                      </div>
                    </div>
                    {u.admin_notes && (
                      <div className="px-5 pb-3 flex items-start gap-2">
                        <StickyNote size={12} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-400/80 italic">{u.admin_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RÔLES & DROITS ── */}
        {!dataLoading && activeTab === 'roles' && (
          <div className="space-y-4">
            {users.map(u => {
              const isExpanded = expandedUser === u.id;
              const conf = getPaysConfig(u.pays);
              return (
                <div key={u.id} className={`bg-[#1A1A2E] border rounded-2xl overflow-hidden transition-all ${u.statut === 'suspendu' ? 'border-red-500/20' : 'border-white/5'}`}>
                  {/* Header card */}
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${u.statut === 'suspendu' ? 'bg-red-500/10 text-red-400' : 'bg-[#B8860B]/10 text-[#B8860B]'}`}>
                        {u.prenom[0]}{u.nom[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-white text-sm">{u.prenom} {u.nom}</p>
                          {getRoleBadge(u)} {getStatutBadge(u.statut)}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{u.email} · {conf.flag} {u.pays}</p>
                      </div>
                    </div>
                    <button onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                      className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all shrink-0">
                      <Settings size={13} /> Gérer {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>

                  {/* Panel étendu */}
                  {isExpanded && (
                    <div className="border-t border-white/5 p-5 space-y-6 bg-white/[0.01]">

                      {/* Section 1 : Rôle admin */}
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Crown size={11} /> Rôle administrateur</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {ADMIN_ROLES.map(r => (
                            <button key={String(r.value)} onClick={() => updateAdminRole(u.id, r.value)}
                              disabled={saving}
                              className={`p-3 rounded-xl border text-left transition-all ${u.admin_role === r.value || (r.value === null && !u.admin_role) ? 'border-[#B8860B]/50 bg-[#B8860B]/10' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}>
                              <div className={`flex items-center gap-2 mb-1 ${r.color}`}>{r.icon}<span className="text-xs font-black">{r.label}</span></div>
                              <p className="text-[10px] text-slate-600">{r.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Section 2 : Statut compte */}
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><UserCheck size={11} /> Statut du compte</p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleStatut(u.id, u.statut)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${u.statut === 'actif' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'}`}>
                            {u.statut === 'actif' ? <><Ban size={14} /> Suspendre le compte</> : <><CheckCircle2 size={14} /> Réactiver le compte</>}
                          </button>
                          {u.statut === 'suspendu' && u.suspended_at && (
                            <p className="text-[10px] text-slate-600">Suspendu le {new Date(u.suspended_at).toLocaleDateString('fr-FR')}</p>
                          )}
                        </div>
                      </div>

                      {/* Section 3 : Permissions granulaires */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Shield size={11} /> Permissions granulaires</p>
                          {editingPerms !== u.id ? (
                            <button onClick={() => openEditPerms(u)} className="text-xs font-bold text-[#B8860B] flex items-center gap-1 hover:opacity-80">
                              <Edit2 size={12} /> Modifier
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => setEditingPerms(null)} className="text-xs font-bold text-slate-500 flex items-center gap-1"><X size={12} /> Annuler</button>
                              <button onClick={() => savePermissions(u.id)} disabled={saving} className="text-xs font-bold text-green-400 flex items-center gap-1"><Save size={12} /> Sauvegarder</button>
                            </div>
                          )}
                        </div>

                        {editingPerms === u.id ? (
                          <div>
                            {/* Presets */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {Object.keys(PERM_PRESETS).map(preset => (
                                <button key={preset} onClick={() => applyPreset(preset)}
                                  className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#B8860B]/20 text-slate-400 hover:text-[#B8860B] border border-white/5 hover:border-[#B8860B]/30 transition-all">
                                  {preset}
                                </button>
                              ))}
                            </div>
                            {/* Permissions par groupe */}
                            <div className="space-y-4">
                              {Object.entries(groupedPerms).map(([group, perms]) => (
                                <div key={group}>
                                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{group}</p>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {perms.map(perm => (
                                      <label key={perm.key} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${permState[perm.key] ? 'border-[#B8860B]/40 bg-[#B8860B]/5' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}`}>
                                        <input type="checkbox" className="w-3.5 h-3.5 accent-[#B8860B]" checked={!!permState[perm.key]}
                                          onChange={e => setPermState(s => ({ ...s, [perm.key]: e.target.checked }))} />
                                        <span className="text-[10px] font-medium text-slate-300">{perm.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            {u.permissions ? (
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(u.permissions).filter(([, v]) => v).map(([k]) => {
                                  const perm = PERMISSIONS_LIST.find(p => p.key === k);
                                  return perm ? <span key={k} className="text-[9px] font-black bg-[#B8860B]/10 text-[#B8860B] px-2 py-1 rounded-lg">{perm.label}</span> : null;
                                })}
                                {Object.values(u.permissions).filter(Boolean).length === 0 && <p className="text-[10px] text-slate-600 italic">Aucune permission définie</p>}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-600 italic">Permissions par défaut (accès complet selon rôle)</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Section 4 : Notes admin */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><StickyNote size={11} /> Notes admin</p>
                          {notesEditing !== u.id ? (
                            <button onClick={() => { setNotesDraft(u.admin_notes || ''); setNotesEditing(u.id); }} className="text-xs font-bold text-[#B8860B] flex items-center gap-1 hover:opacity-80">
                              <Edit2 size={12} /> {u.admin_notes ? 'Modifier' : 'Ajouter'}
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => setNotesEditing(null)} className="text-xs font-bold text-slate-500 flex items-center gap-1"><X size={12} /> Annuler</button>
                              <button onClick={() => saveNotes(u.id)} disabled={saving} className="text-xs font-bold text-green-400 flex items-center gap-1"><Save size={12} /> Sauvegarder</button>
                            </div>
                          )}
                        </div>
                        {notesEditing === u.id ? (
                          <textarea rows={3} placeholder="Notes internes sur ce compte..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-[#B8860B]/40 resize-none"
                            value={notesDraft} onChange={e => setNotesDraft(e.target.value)} />
                        ) : (
                          u.admin_notes
                            ? <p className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 italic">{u.admin_notes}</p>
                            : <p className="text-[10px] text-slate-700 italic">Aucune note</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── COMMISSIONS ── */}
        {!dataLoading && activeTab === 'commissions' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#1A1A2E] border border-[#B8860B]/20 rounded-2xl p-6">
                <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-2">À percevoir ce mois</p>
                <p className="text-4xl font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')}</p>
                <p className="text-sm text-slate-500 mt-1">FCFA (3,5% de {kpis.revenus_mois.toLocaleString('fr-FR')} FCFA)</p>
              </div>
              <div className="bg-[#1A1A2E] border border-emerald-500/20 rounded-2xl p-6">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Perçu cette année</p>
                <p className="text-4xl font-black text-emerald-400">{kpis.commission_annee.toLocaleString('fr-FR')}</p>
                <p className="text-sm text-slate-500 mt-1">FCFA (3,5% de {kpis.revenus_annee.toLocaleString('fr-FR')} FCFA)</p>
              </div>
            </div>
            <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5"><h2 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2"><Percent size={13} /> Détail par propriétaire</h2></div>
              <table className="w-full">
                <thead><tr className="border-b border-white/[0.03]">
                  {['Propriétaire', 'Pays', 'Revenus mois', 'Commission mois', 'Revenus année', 'Com. année'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-600">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {users.filter(u => u.role === 'proprietaire').map(u => {
                    const c = getPaysConfig(u.pays); const ca = Math.round(u.revenus_annee * 3.5 / 100);
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4"><p className="text-xs font-black text-white">{u.prenom} {u.nom}</p><p className="text-[10px] text-slate-600">{u.email}</p></td>
                        <td className="px-5 py-4 text-xs text-slate-400">{c.flag} {u.pays}</td>
                        <td className="px-5 py-4 text-xs font-bold text-slate-300">{u.revenus_mois.toLocaleString('fr-FR')} {c.symbole}</td>
                        <td className="px-5 py-4"><span className={`text-xs font-black ${u.commission_mois > 0 ? 'text-[#B8860B]' : 'text-slate-600'}`}>{u.commission_mois.toLocaleString('fr-FR')} {c.symbole}</span></td>
                        <td className="px-5 py-4 text-xs font-bold text-slate-300">{u.revenus_annee.toLocaleString('fr-FR')} {c.symbole}</td>
                        <td className="px-5 py-4"><span className={`text-xs font-black ${ca > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{ca.toLocaleString('fr-FR')} {c.symbole}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
                {users.some(u => u.role === 'proprietaire') && (
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

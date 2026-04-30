import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Banknote, Loader2, ShieldCheck, Building2, Globe, Percent,
  RefreshCw, LogOut, LayoutDashboard, TrendingUp, Home, ChevronRight,
  Calendar, BarChart3, Trash2, UserCog, Ban, CheckCircle2, Crown,
  Eye, Edit2, Save, X, ChevronDown, ChevronUp, AlertTriangle,
  UserCheck, Mail, Phone, Settings, Shield, Activity, Send,
  DollarSign, Bell, MessageCircle, Zap, Filter, Download,
  ArrowUpRight, ArrowDownRight, Clock, Search, Plus, Check,
  FileText, PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getPaysConfig } from '@/lib/countries';

/* ─── Types ── */
interface UserRow {
  id: string; nom: string; prenom: string; email: string; telephone: string;
  pays: string; code_unique: string; created_at: string; role: string;
  admin_role: string | null; is_super_admin: boolean; statut: string;
  permissions: Record<string, boolean> | null; admin_notes: string | null;
  nb_maisons: number; nb_locataires: number;
  revenus_mois: number; commission_mois: number; revenus_annee: number;
}

type Tab = 'dashboard' | 'traffic' | 'users' | 'finances' | 'messaging' | 'roles' | 'settings';

const ADMIN_ROLES = [
  { value: '', label: 'Aucun', icon: <Users size={12} />, color: 'text-slate-400' },
  { value: 'moderateur', label: 'Modérateur', icon: <Eye size={12} />, color: 'text-blue-500' },
  { value: 'admin', label: 'Admin', icon: <UserCog size={12} />, color: 'text-purple-500' },
  { value: 'super_admin', label: 'Super Admin', icon: <Crown size={12} />, color: 'text-[#B8860B]' },
];

const PERMS = [
  { key: 'view_dashboard', label: 'Voir dashboard', group: 'Vue' },
  { key: 'view_maisons', label: 'Voir maisons', group: 'Vue' },
  { key: 'manage_maisons', label: 'Gérer maisons', group: 'Gestion' },
  { key: 'view_locataires', label: 'Voir locataires', group: 'Vue' },
  { key: 'manage_locataires', label: 'Gérer locataires', group: 'Gestion' },
  { key: 'view_paiements', label: 'Voir paiements', group: 'Vue' },
  { key: 'manage_paiements', label: 'Enregistrer paiements', group: 'Gestion' },
  { key: 'confirm_paiements', label: 'Confirmer MoMo', group: 'Gestion' },
  { key: 'view_contrats', label: 'Voir contrats', group: 'Vue' },
  { key: 'manage_contrats', label: 'Gérer contrats', group: 'Gestion' },
  { key: 'view_depenses', label: 'Voir dépenses', group: 'Vue' },
  { key: 'manage_depenses', label: 'Gérer dépenses', group: 'Gestion' },
  { key: 'view_analytics', label: 'Analytiques', group: 'Vue' },
  { key: 'manage_momo', label: 'Config MoMo', group: 'Paramètres' },
  { key: 'manage_cautions', label: 'Gérer cautions', group: 'Gestion' },
  { key: 'invite_locataires', label: 'Inviter locataires', group: 'Gestion' },
];

const PRESETS: Record<string, string[]> = {
  'Lecture seule': ['view_dashboard','view_maisons','view_locataires','view_paiements','view_contrats','view_depenses','view_analytics'],
  'Gestionnaire': ['view_dashboard','view_maisons','manage_locataires','view_paiements','manage_paiements','confirm_paiements','view_contrats','invite_locataires'],
  'Comptable': ['view_dashboard','view_paiements','manage_paiements','view_depenses','manage_depenses','view_analytics'],
  'Accès complet': PERMS.map(p => p.key),
};

const PERM_GROUPS = PERMS.reduce((acc, p) => {
  if (!acc[p.group]) acc[p.group] = [];
  acc[p.group].push(p);
  return acc;
}, {} as Record<string, typeof PERMS>);

const COLORS = ['#B8860B','#1A1A2E','#10B981','#3B82F6','#EF4444','#8B5CF6','#F59E0B','#06B6D4'];
const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

/* ──────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [allPaiements, setAllPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshed, setRefreshed] = useState(new Date());
  const [toast, setToast] = useState<{ type: 'ok'|'err'; text: string } | null>(null);

  // User management states
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingPerms, setEditingPerms] = useState<string | null>(null);
  const [permState, setPermState] = useState<Record<string, boolean>>({});
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [userFilter, setUserFilter] = useState('all');
  const [searchUser, setSearchUser] = useState('');

  // Messaging states
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgTarget, setMsgTarget] = useState('all');
  const [msgType, setMsgType] = useState<'info'|'warning'|'success'>('info');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Finance states
  const [comFilter, setComFilter] = useState('mois');

  useEffect(() => { load(); }, []);
  useEffect(() => { if (toast) setTimeout(() => setToast(null), 4000); }, [toast]);

  function showToast(type: 'ok'|'err', text: string) { setToast({ type, text }); }

  /* ── Chargement ── */
  async function load() {
    if (!supabase) return;
    setLoading(true);
    try {
      const now = new Date(); const cm = now.getMonth() + 1; const cy = now.getFullYear();

      const [{ data: profiles }, { data: pays }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('paiements').select('*').eq('statut', 'payé'),
      ]);

      setAllPaiements(pays || []);
      if (!profiles) return;

      const rows = await Promise.all(profiles.map(async p => {
        const [mRes, lRes, pM, pA] = await Promise.all([
          supabase!.from('maisons').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id),
          supabase!.from('locataires').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id),
          supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('mois', cm).eq('annee', cy).eq('statut', 'payé'),
          supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('annee', cy).eq('statut', 'payé'),
        ]);
        const rM = (pM.data||[]).reduce((s:number,x:any)=>s+x.montant,0);
        const rA = (pA.data||[]).reduce((s:number,x:any)=>s+x.montant,0);
        return {
          id: p.id, nom: p.nom||'', prenom: p.prenom||'', email: p.email||'',
          telephone: p.telephone||'', pays: p.pays||'Bénin', code_unique: p.code_unique||'—',
          created_at: p.created_at, role: p.role||'proprietaire',
          admin_role: p.admin_role||null, is_super_admin: p.is_super_admin||false,
          statut: p.statut||'actif', permissions: p.permissions||null, admin_notes: p.admin_notes||null,
          nb_maisons: mRes.count||0, nb_locataires: lRes.count||0,
          revenus_mois: rM, commission_mois: Math.round(rM*3.5/100), revenus_annee: rA,
        };
      }));
      setUsers(rows);
      setRefreshed(new Date());
    } finally { setLoading(false); }
  }

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const proprios = users.filter(u => u.role === 'proprietaire');
    return {
      total: users.length, proprios: proprios.length,
      locataires: users.filter(u => u.role === 'locataire').length,
      admins: users.filter(u => u.admin_role || u.is_super_admin).length,
      suspendus: users.filter(u => u.statut === 'suspendu').length,
      maisons: proprios.reduce((s,u)=>s+u.nb_maisons,0),
      revenus_mois: proprios.reduce((s,u)=>s+u.revenus_mois,0),
      commission_mois: proprios.reduce((s,u)=>s+u.commission_mois,0),
      commission_annee: proprios.reduce((s,u)=>s+Math.round(u.revenus_annee*3.5/100),0),
    };
  }, [users]);

  /* ── Données trafic ── */
  const trafficData = useMemo(() => {
    const now = new Date(); const cy = now.getFullYear();
    return MOIS.map((nom, i) => {
      const m = i + 1;
      const newUsers = users.filter(u => { const d = new Date(u.created_at); return d.getFullYear() === cy && d.getMonth() + 1 === m; }).length;
      const paiements = allPaiements.filter(p => p.annee === cy && p.mois === m).length;
      const revenus = allPaiements.filter(p => p.annee === cy && p.mois === m).reduce((s:number,p:any)=>s+p.montant,0);
      return { nom, newUsers, paiements, revenus, commission: Math.round(revenus * 3.5 / 100) };
    });
  }, [users, allPaiements]);

  const paysStats = useMemo(() => {
    const map: Record<string, number> = {};
    users.filter(u=>u.role==='proprietaire').forEach(u => { map[u.pays]=(map[u.pays]||0)+1; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  }, [users]);

  const recentActivity = useMemo(() => {
    return [...users].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,10);
  }, [users]);

  const paiementsMois = useMemo(() => {
    const now = new Date();
    return allPaiements.filter(p => p.mois === now.getMonth()+1 && p.annee === now.getFullYear());
  }, [allPaiements]);

  /* ── Finances ── */
  const commisionParProprio = useMemo(() => {
    return users.filter(u=>u.role==='proprietaire')
      .map(u => ({ ...u, ca: Math.round(u.revenus_annee*3.5/100) }))
      .sort((a,b) => b.commission_mois - a.commission_mois);
  }, [users]);

  /* ── User filters ── */
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchF = userFilter==='all'||u.role===userFilter||u.statut===userFilter;
      const q = searchUser.toLowerCase();
      return matchF && (!q || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q));
    });
  }, [users, userFilter, searchUser]);

  /* ── Actions ── */
  async function supprimerUser(u: UserRow) {
    if (!supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_delete_user_data', { target_user_id: u.id });
      if (error) throw error;
      setConfirmDelete(null);
      showToast('ok', `Compte ${u.prenom} ${u.nom} supprimé`);
      await load();
    } catch(e:any) { showToast('err', e.message); }
    finally { setSaving(false); }
  }

  async function updateRole(userId: string, role: string, adminRole: string, isAdmin: boolean) {
    if (!supabase) return; setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_update_user_role', { target_user_id: userId, new_role: role, new_admin_role: adminRole, new_is_admin: isAdmin });
      if (error) throw error;
      setEditingRole(null); showToast('ok', 'Rôle mis à jour'); await load();
    } catch(e:any) { showToast('err', e.message); }
    finally { setSaving(false); }
  }

  async function toggleStatut(u: UserRow) {
    if (!supabase) return; setSaving(true);
    const ns = u.statut==='actif' ? 'suspendu' : 'actif';
    try {
      const { error } = await supabase.rpc('admin_set_user_status', { target_user_id: u.id, new_status: ns });
      if (error) throw error;
      showToast('ok', `Compte ${ns==='suspendu'?'suspendu':'réactivé'}`); await load();
    } catch(e:any) { showToast('err', e.message); }
    finally { setSaving(false); }
  }

  async function savePermissions(userId: string) {
    if (!supabase) return; setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ permissions: permState }).eq('id', userId);
      if (error) throw error;
      setEditingPerms(null); showToast('ok', 'Permissions mises à jour'); await load();
    } catch(e:any) { showToast('err', e.message); }
    finally { setSaving(false); }
  }

  async function saveNotes(userId: string) {
    if (!supabase) return; setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ admin_notes: notesDraft }).eq('id', userId);
      if (error) throw error;
      setEditingNotes(null); showToast('ok', 'Notes enregistrées'); await load();
    } catch(e:any) { showToast('err', e.message); }
    finally { setSaving(false); }
  }

  async function resetPassword(email: string) {
    if (!supabase) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/connexion` });
    if (error) showToast('err', error.message);
    else showToast('ok', `Email de reset envoyé à ${email}`);
  }

  async function sendNotification() {
    if (!supabase || !msgTitle || !msgBody) { showToast('err', 'Titre et message requis'); return; }
    setSendingMsg(true);
    try {
      const targets = msgTarget === 'all' ? users : users.filter(u => u.role === msgTarget);
      const notifs = targets.map(u => ({ user_id: u.id, type: msgType, titre: msgTitle, message: msgBody, lu: false }));
      const { error } = await supabase.from('notifications').insert(notifs);
      if (error) throw error;
      showToast('ok', `Notification envoyée à ${targets.length} utilisateur(s)`);
      setMsgTitle(''); setMsgBody('');
    } catch(e:any) { showToast('err', e.message); }
    finally { setSendingMsg(false); }
  }

  function openEditPerms(u: UserRow) {
    const base: Record<string, boolean> = {};
    PERMS.forEach(p => { base[p.key] = u.permissions?.[p.key] ?? false; });
    setPermState(base);
    setEditingPerms(u.id);
  }

  /* ── Badges ── */
  function roleBadge(u: UserRow) {
    if (u.is_super_admin||u.admin_role==='super_admin') return <span className="text-[9px] font-black bg-[#B8860B]/20 text-[#B8860B] px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><Crown size={9}/> Super Admin</span>;
    if (u.admin_role==='admin') return <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><UserCog size={9}/> Admin</span>;
    if (u.admin_role==='moderateur') return <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><Eye size={9}/> Modérateur</span>;
    if (u.role==='proprietaire') return <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><Home size={9}/> Proprio</span>;
    return <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><Users size={9}/> Locataire</span>;
  }

  function statutBadge(s: string) {
    if (s==='actif') return <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><CheckCircle2 size={9}/> Actif</span>;
    if (s==='suspendu') return <span className="text-[9px] font-black bg-red-100 text-red-600 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><Ban size={9}/> Suspendu</span>;
    return <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><AlertTriangle size={9}/> En attente</span>;
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14}/> },
    { id: 'traffic', label: 'Trafic & Activité', icon: <Activity size={14}/> },
    { id: 'users', label: `Utilisateurs (${users.length})`, icon: <Users size={14}/> },
    { id: 'finances', label: 'Finances', icon: <DollarSign size={14}/> },
    { id: 'messaging', label: 'Messagerie', icon: <Send size={14}/> },
    { id: 'roles', label: 'Rôles', icon: <Shield size={14}/> },
    { id: 'settings', label: 'Paramètres', icon: <Settings size={14}/> },
  ];

  const proprios = users.filter(u => u.role === 'proprietaire');

  return (
    <div className="min-h-screen bg-[#F0F2F5]">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${toast.type==='ok'?'bg-green-600 text-white':'bg-red-500 text-white'}`}>
          {toast.type==='ok'?<Check size={16}/>:<AlertTriangle size={16}/>} {toast.text}
        </div>
      )}

      {/* TOPBAR */}
      <header className="bg-[#0D0F14] px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#B8860B] to-[#9A700A] rounded-xl flex items-center justify-center shadow-lg shadow-[#B8860B]/20">
            <ShieldCheck size={20} className="text-white"/>
          </div>
          <div>
            <p className="font-black text-white text-sm">ImmoAfrik Admin</p>
            <p className="text-[10px] text-slate-500">{profile?.prenom} {profile?.nom} · {refreshed.toLocaleTimeString('fr-FR')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all border border-white/5">
            <RefreshCw size={13} className={loading?'animate-spin':''}/> <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button onClick={()=>navigate('/dashboard')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all border border-white/5">
            <Home size={13}/> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button onClick={async()=>{await signOut();navigate('/');}} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-all border border-red-500/10">
            <LogOut size={13}/> <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </header>

      {/* TABS */}
      <div className="bg-[#1A1C23] border-b border-white/5 px-4 flex gap-0.5 sticky top-[72px] z-30 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${tab===t.id?'border-[#B8860B] text-[#B8860B]':'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-20">

        {/* KPIs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-8">
          {[
            { l:'Total', v:kpis.total, c:'text-white', bg:'bg-[#1A1C23]' },
            { l:'Proprios', v:kpis.proprios, c:'text-blue-400', bg:'bg-white' },
            { l:'Locataires', v:kpis.locataires, c:'text-purple-500', bg:'bg-white' },
            { l:'Admins', v:kpis.admins, c:'text-[#B8860B]', bg:'bg-white' },
            { l:'Suspendus', v:kpis.suspendus, c:'text-red-500', bg:'bg-white' },
            { l:'Maisons', v:kpis.maisons, c:'text-cyan-500', bg:'bg-white' },
            { l:'Rev. mois', v:`${(kpis.revenus_mois/1000).toFixed(0)}K FCFA`, c:'text-amber-500', bg:'bg-white' },
            { l:'Com. mois', v:`${(kpis.commission_mois/1000).toFixed(0)}K FCFA`, c:'text-[#B8860B]', bg:'bg-white' },
            { l:'Com. année', v:`${(kpis.commission_annee/1000).toFixed(0)}K FCFA`, c:'text-green-500', bg:'bg-white' },
          ].map((k,i)=>(
            <div key={i} className={`${k.bg} rounded-2xl border border-slate-100 shadow-sm p-3`}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.l}</p>
              <p className={`font-black text-sm ${k.c}`}>{k.v}</p>
            </div>
          ))}
        </div>

        {loading && <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#B8860B]" size={36}/></div>}

        {/* ── DASHBOARD ── */}
        {!loading && tab==='dashboard' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-5">
              <div className="bg-[#1A1C23] rounded-[2rem] p-6 text-white">
                <div className="flex items-center gap-2 mb-3"><Percent size={16} className="text-[#B8860B]"/><p className="font-black text-xs uppercase tracking-widest text-slate-400">Commission ce mois</p></div>
                <p className="text-5xl font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')}</p>
                <p className="text-slate-500 text-sm mt-1">FCFA · 3,5% de {kpis.revenus_mois.toLocaleString('fr-FR')} FCFA</p>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
                  <div><p className="text-[10px] text-slate-500">Année</p><p className="text-xl font-black text-green-400">{kpis.commission_annee.toLocaleString('fr-FR')} F</p></div>
                  <div className="text-right"><p className="text-[10px] text-slate-500">Taux</p><p className="text-xl font-black text-[#B8860B]">3,5%</p></div>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3"><Globe size={16} className="text-[#B8860B]"/><p className="font-black text-xs uppercase tracking-widest text-slate-400">Couverture géo</p></div>
                <div className="space-y-2.5">
                  {paysStats.slice(0,5).map(([pays,count])=>{
                    const c=getPaysConfig(pays);
                    return <div key={pays} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span>{c.flag}</span><span className="text-sm font-bold text-slate-700">{pays}</span></div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-slate-100 rounded-full w-16 overflow-hidden"><div className="h-full bg-[#B8860B] rounded-full" style={{width:`${(count/kpis.proprios)*100}%`}}/></div>
                        <span className="text-xs font-black text-[#B8860B] w-4">{count}</span>
                      </div>
                    </div>;
                  })}
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3"><Activity size={16} className="text-[#B8860B]"/><p className="font-black text-xs uppercase tracking-widest text-slate-400">Activité récente</p></div>
                <div className="space-y-3">
                  {recentActivity.slice(0,5).map(u=>(
                    <div key={u.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#1A1C23] rounded-lg flex items-center justify-center font-black text-[#B8860B] text-[9px] shrink-0">{u.prenom[0]}{u.nom[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{u.prenom} {u.nom}</p>
                        <p className="text-[9px] text-slate-400">{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      {roleBadge(u)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Mini graphique revenus */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5"><BarChart3 size={16} className="text-[#B8860B]"/><p className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest">Revenus & Commissions — {new Date().getFullYear()}</p></div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9"/>
                    <XAxis dataKey="nom" axisLine={false} tickLine={false} tick={{fontSize:11,fontWeight:700,fill:'#94A3B8'}}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#94A3B8'}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}K`:String(v)}/>
                    <Tooltip contentStyle={{borderRadius:'12px',border:'none'}} formatter={(v:number)=>[`${v.toLocaleString('fr-FR')} FCFA`]}/>
                    <Bar dataKey="revenus" name="Revenus" fill="#1A1A2E" radius={[4,4,0,0]}/>
                    <Bar dataKey="commission" name="Commission" fill="#B8860B" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TRAFIC ── */}
        {!loading && tab==='traffic' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { l:'Inscriptions ce mois', v: users.filter(u=>{const d=new Date(u.created_at);return d.getMonth()===new Date().getMonth()&&d.getFullYear()===new Date().getFullYear();}).length, icon:<Users size={18}/>, c:'text-blue-600', bg:'bg-blue-50' },
                { l:'Paiements ce mois', v: paiementsMois.length, icon:<Banknote size={18}/>, c:'text-green-600', bg:'bg-green-50' },
                { l:'Revenus ce mois', v: `${paiementsMois.reduce((s:number,p:any)=>s+p.montant,0).toLocaleString('fr-FR')} FCFA`, icon:<TrendingUp size={18}/>, c:'text-[#B8860B]', bg:'bg-[#B8860B]/10' },
              ].map((k,i)=>(
                <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex items-center gap-4">
                  <div className={`w-14 h-14 ${k.bg} rounded-2xl flex items-center justify-center ${k.c}`}>{k.icon}</div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.l}</p><p className={`text-2xl font-black ${k.c}`}>{k.v}</p></div>
                </div>
              ))}
            </div>

            {/* Inscriptions par mois */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5"><Users size={16} className="text-[#B8860B]"/><p className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest">Nouvelles inscriptions — {new Date().getFullYear()}</p></div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9"/>
                    <XAxis dataKey="nom" axisLine={false} tickLine={false} tick={{fontSize:11,fontWeight:700,fill:'#94A3B8'}}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#94A3B8'}}/>
                    <Tooltip contentStyle={{borderRadius:'12px',border:'none'}} formatter={(v:number)=>[`${v} inscription(s)`]}/>
                    <Area type="monotone" dataKey="newUsers" name="Inscriptions" stroke="#B8860B" fill="#B8860B20" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Paiements par mois */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5"><Banknote size={16} className="text-[#B8860B]"/><p className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest">Volume paiements</p></div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9"/>
                      <XAxis dataKey="nom" axisLine={false} tickLine={false} tick={{fontSize:10,fontWeight:700,fill:'#94A3B8'}}/>
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize:9,fill:'#94A3B8'}}/>
                      <Tooltip contentStyle={{borderRadius:'12px',border:'none'}}/>
                      <Bar dataKey="paiements" name="Paiements" fill="#10B981" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Répartition par pays */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5"><Globe size={16} className="text-[#B8860B]"/><p className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest">Proprios par pays</p></div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paysStats.map(([p,v])=>({name:p,value:v}))} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                        {paysStats.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v:number)=>[`${v} proprio(s)`]}/>
                      <Legend iconSize={8} formatter={(v)=><span className="text-[10px] font-bold text-slate-600">{v}</span>}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tableau activité */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50"><p className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest flex items-center gap-2"><Clock size={14} className="text-[#B8860B]"/>Journal d'inscriptions</p></div>
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {recentActivity.map(u=>{
                  const conf=getPaysConfig(u.pays);
                  return (
                    <div key={u.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1A1C23] rounded-lg flex items-center justify-center font-black text-[#B8860B] text-xs shrink-0">{u.prenom[0]}{u.nom[0]}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{u.prenom} {u.nom}</p>
                          <p className="text-[10px] text-slate-400">{u.email} · {conf.flag} {u.pays}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        {roleBadge(u)}
                        <p className="text-[10px] text-slate-400 ml-2">{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── UTILISATEURS ── */}
        {!loading && tab==='users' && (
          <div>
            <div className="flex gap-3 mb-5 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input placeholder="Rechercher..." className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#B8860B] transition-all"
                  value={searchUser} onChange={e=>setSearchUser(e.target.value)}/>
              </div>
              <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[#B8860B]"
                value={userFilter} onChange={e=>setUserFilter(e.target.value)}>
                <option value="all">Tous ({users.length})</option>
                <option value="proprietaire">Propriétaires ({kpis.proprios})</option>
                <option value="locataire">Locataires ({kpis.locataires})</option>
                <option value="suspendu">Suspendus ({kpis.suspendus})</option>
              </select>
            </div>
            <div className="space-y-3">
              {filteredUsers.map(u=>{
                const conf=getPaysConfig(u.pays); const isExp=expanded===u.id; const isSelf=u.id===profile?.id;
                return (
                  <div key={u.id} className={`bg-white rounded-[1.5rem] border shadow-sm overflow-hidden transition-all ${u.statut==='suspendu'?'border-red-100':'border-slate-100'}`}>
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${u.statut==='suspendu'?'bg-red-100 text-red-500':'bg-[#1A1C23] text-[#B8860B]'}`}>{u.prenom?.[0]||'?'}{u.nom?.[0]||'?'}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-slate-800">{u.prenom} {u.nom}</p>
                            {roleBadge(u)} {statutBadge(u.statut)}
                            {isSelf&&<span className="text-[9px] font-black bg-[#B8860B] text-white px-2 py-0.5 rounded-full">Vous</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1"><Mail size={9}/>{u.email}</span>
                            {u.telephone&&<span className="flex items-center gap-1"><Phone size={9}/>{u.telephone}</span>}
                            <span>{conf.flag} {u.pays}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {u.role==='proprietaire'&&<div className="hidden md:flex items-center gap-2 mr-2">
                          <div className="text-center"><p className="text-sm font-black text-[#1A1A2E]">{u.nb_maisons}</p><p className="text-[9px] text-slate-400">Maisons</p></div>
                          <div className="text-center bg-[#B8860B]/10 rounded-xl px-2 py-1"><p className="text-xs font-black text-[#B8860B]">{u.commission_mois.toLocaleString('fr-FR')}</p><p className="text-[9px] text-[#B8860B]">Com.</p></div>
                        </div>}
                        <button onClick={()=>setExpanded(isExp?null:u.id)} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-all">
                          <Settings size={13}/> {isExp?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
                        </button>
                      </div>
                    </div>
                    {isExp&&(
                      <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-5">
                        {/* Actions */}
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Actions</p>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={()=>toggleStatut(u)} disabled={saving||isSelf}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${u.statut==='actif'?'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100':'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100'}`}>
                              {u.statut==='actif'?<><Ban size={13}/>Suspendre</>:<><CheckCircle2 size={13}/>Réactiver</>}
                            </button>
                            <button onClick={()=>resetPassword(u.email)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-all">
                              <Mail size={13}/> Reset mot de passe
                            </button>
                            {!isSelf&&<button onClick={()=>setConfirmDelete(u)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all"><Trash2 size={13}/> Supprimer compte</button>}
                          </div>
                        </div>
                        {/* Rôle */}
                        {!isSelf&&<div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Crown size={11}/>Rôle admin</p>
                            {editingRole!==u.id?<button onClick={()=>setEditingRole(u.id)} className="text-xs font-bold text-[#B8860B] flex items-center gap-1"><Edit2 size={11}/>Modifier</button>:
                            <button onClick={()=>setEditingRole(null)} className="text-xs text-slate-400 font-bold flex items-center gap-1"><X size={11}/>Annuler</button>}
                          </div>
                          {editingRole===u.id?(
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {ADMIN_ROLES.map(r=>(
                                <button key={r.value} onClick={()=>updateRole(u.id,u.role,r.value,r.value==='super_admin')} disabled={saving}
                                  className={`p-3 rounded-xl border text-left transition-all ${(u.admin_role||'')===r.value?'border-[#B8860B]/50 bg-[#B8860B]/5':'border-slate-200 bg-white hover:border-slate-300'}`}>
                                  <div className={`flex items-center gap-2 mb-1 ${r.color}`}>{r.icon}<span className="text-xs font-black">{r.label}</span></div>
                                </button>
                              ))}
                            </div>
                          ):<div className="flex items-center gap-2">{roleBadge(u)}</div>}
                        </div>}
                        {/* Permissions */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Shield size={11}/>Permissions</p>
                            {editingPerms!==u.id?<button onClick={()=>openEditPerms(u)} className="text-xs font-bold text-[#B8860B] flex items-center gap-1"><Edit2 size={11}/>Modifier</button>:
                            <div className="flex gap-3"><button onClick={()=>setEditingPerms(null)} className="text-xs text-slate-400 font-bold flex items-center gap-1"><X size={11}/>Annuler</button><button onClick={()=>savePermissions(u.id)} disabled={saving} className="text-xs text-green-600 font-bold flex items-center gap-1"><Save size={11}/>Sauvegarder</button></div>}
                          </div>
                          {editingPerms===u.id?(
                            <div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {Object.keys(PRESETS).map(p=><button key={p} onClick={()=>{const keys=PRESETS[p];const s:Record<string,boolean>={};PERMS.forEach(x=>{s[x.key]=keys.includes(x.key);});setPermState(s);}} className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-white hover:bg-[#B8860B]/10 text-slate-500 hover:text-[#B8860B] border border-slate-200 hover:border-[#B8860B]/30 transition-all">{p}</button>)}
                              </div>
                              <div className="space-y-3">
                                {Object.entries(PERM_GROUPS).map(([group,perms])=>(
                                  <div key={group}>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{group}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {perms.map(perm=>(
                                        <label key={perm.key} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${permState[perm.key]?'border-[#B8860B]/40 bg-[#B8860B]/5':'border-slate-200 bg-white hover:border-slate-300'}`}>
                                          <input type="checkbox" className="w-3.5 h-3.5 accent-[#B8860B]" checked={!!permState[perm.key]} onChange={e=>setPermState(s=>({...s,[perm.key]:e.target.checked}))}/>
                                          <span className="text-[10px] font-medium text-slate-600">{perm.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ):(
                            <div className="flex flex-wrap gap-1.5">
                              {u.permissions&&Object.entries(u.permissions).filter(([,v])=>v).length>0
                                ?Object.entries(u.permissions).filter(([,v])=>v).map(([k])=>{const p=PERMS.find(x=>x.key===k);return p?<span key={k} className="text-[9px] font-black bg-[#B8860B]/10 text-[#B8860B] px-2 py-1 rounded-lg">{p.label}</span>:null;})
                                :<p className="text-[10px] text-slate-400 italic">Permissions par défaut</p>}
                            </div>
                          )}
                        </div>
                        {/* Notes */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes admin</p>
                            {editingNotes!==u.id?<button onClick={()=>{setNotesDraft(u.admin_notes||'');setEditingNotes(u.id);}} className="text-xs font-bold text-[#B8860B] flex items-center gap-1"><Edit2 size={11}/>{u.admin_notes?'Modifier':'Ajouter'}</button>:
                            <div className="flex gap-3"><button onClick={()=>setEditingNotes(null)} className="text-xs text-slate-400 font-bold flex items-center gap-1"><X size={11}/>Annuler</button><button onClick={()=>saveNotes(u.id)} disabled={saving} className="text-xs text-green-600 font-bold flex items-center gap-1"><Save size={11}/>Sauvegarder</button></div>}
                          </div>
                          {editingNotes===u.id?<textarea rows={2} placeholder="Notes internes..." className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#B8860B] resize-none" value={notesDraft} onChange={e=>setNotesDraft(e.target.value)}/>:
                          u.admin_notes?<p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3 italic">{u.admin_notes}</p>:
                          <p className="text-[10px] text-slate-400 italic">Aucune note</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredUsers.length===0&&<div className="text-center py-16 text-slate-400 italic text-sm">Aucun utilisateur trouvé.</div>}
            </div>
          </div>
        )}

        {/* ── FINANCES ── */}
        {!loading && tab==='finances' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-[#1A1C23] rounded-[2rem] p-6 text-white">
                <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-2">Commissions à percevoir</p>
                <p className="text-5xl font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')}</p>
                <p className="text-slate-500 text-sm mt-1">FCFA ce mois · {kpis.commission_annee.toLocaleString('fr-FR')} FCFA cette année</p>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Évolution commissions</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trafficData}>
                      <XAxis dataKey="nom" axisLine={false} tickLine={false} tick={{fontSize:9,fill:'#94A3B8'}}/>
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize:9,fill:'#94A3B8'}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}K`:String(v)}/>
                      <Tooltip contentStyle={{borderRadius:'12px',border:'none'}} formatter={(v:number)=>[`${v.toLocaleString('fr-FR')} FCFA`]}/>
                      <Line type="monotone" dataKey="commission" stroke="#B8860B" strokeWidth={2} dot={{fill:'#B8860B',r:3}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
              <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <h2 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest flex items-center gap-2"><Percent size={14} className="text-[#B8860B]"/>Commissions par propriétaire</h2>
              </div>
              <table className="w-full min-w-[700px]">
                <thead><tr className="border-b border-slate-50">{['Propriétaire','Pays','Rev. mois','Com. mois','Rev. année','Com. année','Statut'].map(h=><th key={h} className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {commisionParProprio.length===0?<tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 italic">Aucun propriétaire.</td></tr>:commisionParProprio.map(p=>{
                    const conf=getPaysConfig(p.pays);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4"><p className="text-sm font-black text-[#1A1A2E]">{p.prenom} {p.nom}</p><p className="text-[10px] text-slate-400">{p.email}</p></td>
                        <td className="px-5 py-4 text-sm text-slate-500">{conf.flag} {p.pays}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-700">{p.revenus_mois.toLocaleString('fr-FR')} {conf.symbole}</td>
                        <td className="px-5 py-4"><span className={`text-sm font-black ${p.commission_mois>0?'text-[#B8860B]':'text-slate-400'}`}>{p.commission_mois.toLocaleString('fr-FR')} {conf.symbole}</span></td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-700">{p.revenus_annee.toLocaleString('fr-FR')} {conf.symbole}</td>
                        <td className="px-5 py-4"><span className={`text-sm font-black ${p.ca>0?'text-green-600':'text-slate-400'}`}>{p.ca.toLocaleString('fr-FR')} {conf.symbole}</span></td>
                        <td className="px-5 py-4">{statutBadge(p.statut)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {commisionParProprio.length>0&&<tfoot className="border-t-2 border-[#B8860B]/20 bg-[#B8860B]/5">
                  <tr>
                    <td className="px-5 py-4 text-sm font-black text-[#B8860B]" colSpan={2}>TOTAL</td>
                    <td className="px-5 py-4 text-sm font-black text-slate-700">{kpis.revenus_mois.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-5 py-4 text-sm font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-5 py-4 text-sm font-black text-slate-700">{commisionParProprio.reduce((s,u)=>s+u.revenus_annee,0).toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-5 py-4 text-sm font-black text-green-600">{kpis.commission_annee.toLocaleString('fr-FR')} FCFA</td>
                    <td></td>
                  </tr>
                </tfoot>}
              </table>
            </div>
          </div>
        )}

        {/* ── MESSAGERIE ── */}
        {!loading && tab==='messaging' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5"><Send size={18} className="text-[#B8860B]"/><h3 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest">Envoyer une notification</h3></div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Destinataires</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#B8860B]"
                      value={msgTarget} onChange={e=>setMsgTarget(e.target.value)}>
                      <option value="all">Tous les utilisateurs ({users.length})</option>
                      <option value="proprietaire">Propriétaires seulement ({kpis.proprios})</option>
                      <option value="locataire">Locataires seulement ({kpis.locataires})</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Type</label>
                    <div className="flex gap-2">
                      {(['info','warning','success'] as const).map(t=>(
                        <button key={t} onClick={()=>setMsgType(t)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all border ${msgType===t?'border-[#B8860B] bg-[#B8860B]/10 text-[#B8860B]':'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                          {t==='info'?'Info':t==='warning'?'⚠ Avertissement':'✓ Succès'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Titre *</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B8860B] transition-all"
                      placeholder="Titre de la notification..." value={msgTitle} onChange={e=>setMsgTitle(e.target.value)}/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Message *</label>
                    <textarea rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B8860B] transition-all resize-none"
                      placeholder="Contenu de la notification..." value={msgBody} onChange={e=>setMsgBody(e.target.value)}/>
                  </div>
                  <button onClick={sendNotification} disabled={sendingMsg||!msgTitle||!msgBody}
                    className="w-full bg-[#1A1C23] text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-[#252835] transition-all disabled:opacity-50">
                    {sendingMsg?<><Loader2 className="animate-spin" size={18}/>Envoi...</>:<><Send size={18}/>Envoyer à {msgTarget==='all'?users.length:msgTarget==='proprietaire'?kpis.proprios:kpis.locataires} utilisateur(s)</>}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5"><Bell size={18} className="text-[#B8860B]"/><h3 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest">Conseils d'utilisation</h3></div>
                <div className="space-y-4">
                  {[
                    { icon: <Zap size={18} className="text-amber-500"/>, titre: 'Annonces importantes', desc: 'Utilisez le type "Avertissement" pour les maintenances ou changements importants.' },
                    { icon: <Users size={18} className="text-blue-500"/>, titre: 'Ciblage précis', desc: 'Envoyez aux propriétaires uniquement pour les infos de commission, aux locataires pour les rappels de paiement.' },
                    { icon: <MessageCircle size={18} className="text-green-500"/>, titre: 'Notifications WhatsApp', desc: 'Utilisez la page "Messages WA" dans le dashboard pour envoyer des messages WhatsApp groupés.' },
                    { icon: <Bell size={18} className="text-purple-500"/>, titre: 'Limite', desc: 'Les notifications apparaissent dans la cloche en haut du dashboard de chaque utilisateur.' },
                  ].map((tip,i)=>(
                    <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                      <div className="shrink-0 mt-0.5">{tip.icon}</div>
                      <div><p className="text-sm font-black text-[#1A1A2E]">{tip.titre}</p><p className="text-xs text-slate-500 mt-1">{tip.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RÔLES ── */}
        {!loading && tab==='roles' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50"><p className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest flex items-center gap-2"><Shield size={14} className="text-[#B8860B]"/>Comptes avec rôle admin</p></div>
              <div className="divide-y divide-slate-50">
                {users.filter(u=>u.admin_role||u.is_super_admin).map(u=>{
                  const c=getPaysConfig(u.pays);
                  return (
                    <div key={u.id} className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1A1C23] rounded-xl flex items-center justify-center font-black text-[#B8860B] text-xs">{u.prenom[0]}{u.nom[0]}</div>
                        <div><p className="font-black text-slate-800 text-sm">{u.prenom} {u.nom}</p><p className="text-[10px] text-slate-400">{c.flag} {u.pays} · {u.email}</p></div>
                      </div>
                      <div className="flex items-center gap-2">{roleBadge(u)}{statutBadge(u.statut)}</div>
                    </div>
                  );
                })}
                {users.filter(u=>u.admin_role||u.is_super_admin).length===0&&<p className="p-8 text-center text-slate-400 italic text-sm">Aucun admin configuré. Allez dans "Utilisateurs" pour en créer.</p>}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5"/>
              <p className="text-xs text-amber-700">Pour modifier les rôles, allez dans l'onglet <strong>Utilisateurs</strong> → cliquez ⚙ sur le compte voulu.</p>
            </div>
          </div>
        )}

        {/* ── PARAMÈTRES ── */}
        {!loading && tab==='settings' && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5"><Settings size={18} className="text-[#B8860B]"/><h3 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest">Infos plateforme</h3></div>
                <div className="space-y-3">
                  {[
                    { l:'Nom', v:'ImmoAfrik' }, { l:'Version', v:'2.0.0' },
                    { l:'Base de données', v:'Supabase (eu-west-1)' },
                    { l:'Hébergement', v:'GitHub Pages' },
                    { l:'Taux commission', v:'3,5% par paiement confirmé' },
                    { l:'Pays supportés', v:'16 pays Afrique de l\'Ouest' },
                    { l:'Admin', v:`${profile?.prenom} ${profile?.nom}` },
                  ].map((r,i)=>(
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-500 font-medium">{r.l}</span>
                      <span className="text-xs font-black text-[#1A1A2E]">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5"><Activity size={18} className="text-[#B8860B]"/><h3 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest">Statistiques DB</h3></div>
                <div className="space-y-3">
                  {[
                    { l:'Total utilisateurs', v: users.length },
                    { l:'Propriétaires', v: kpis.proprios },
                    { l:'Locataires', v: kpis.locataires },
                    { l:'Maisons gérées', v: kpis.maisons },
                    { l:'Paiements confirmés', v: allPaiements.length },
                    { l:'Comptes suspendus', v: kpis.suspendus },
                  ].map((r,i)=>(
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-500 font-medium">{r.l}</span>
                      <span className="text-sm font-black text-[#B8860B]">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-[#1A1C23] rounded-[2rem] p-6 text-white">
              <div className="flex items-center gap-2 mb-4"><AlertTriangle size={18} className="text-amber-400"/><h3 className="font-black text-sm uppercase tracking-widest">Zone de danger</h3></div>
              <p className="text-xs text-slate-400 mb-5">Les actions suivantes sont irréversibles. Procédez avec prudence.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={()=>{if(confirm('Envoyer un email de test à '+profile?.email+' ?'))resetPassword(profile?.email||'');}} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-black hover:bg-blue-500/30 transition-all border border-blue-500/20">
                  <Mail size={14}/> Test reset password (moi)
                </button>
                <button onClick={load} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/20 text-green-300 text-xs font-black hover:bg-green-500/30 transition-all border border-green-500/20">
                  <RefreshCw size={14}/> Forcer rechargement données
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal suppression */}
      {confirmDelete&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4"><AlertTriangle size={32} className="text-red-500"/></div>
            <h3 className="text-lg font-black text-[#1A1A2E] mb-2">Supprimer ce compte ?</h3>
            <p className="text-sm text-slate-500 mb-1"><strong>{confirmDelete.prenom} {confirmDelete.nom}</strong></p>
            <p className="text-xs text-red-500 mb-6">Action irréversible. Toutes les données seront supprimées.</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmDelete(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Annuler</button>
              <button onClick={()=>supprimerUser(confirmDelete)} disabled={saving} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 flex items-center justify-center gap-2">
                {saving?<Loader2 size={16} className="animate-spin"/>:<Trash2 size={16}/>} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Banknote, Loader2, ShieldCheck, Building2, Globe, Percent,
  RefreshCw, LogOut, LayoutDashboard, TrendingUp, Home, ChevronRight,
  Calendar, BarChart3, Trash2, UserCog, Ban, CheckCircle2, Crown,
  Eye, Edit2, Save, X, ChevronDown, ChevronUp, AlertTriangle,
  UserCheck, Mail, Phone, Settings, Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getPaysConfig } from '@/lib/countries';

/* ─── Types ──────────────────────────────────── */
interface UserRow {
  id: string; nom: string; prenom: string; email: string; telephone: string;
  pays: string; code_unique: string; created_at: string; role: string;
  admin_role: string | null; is_super_admin: boolean; statut: string;
  permissions: Record<string, boolean> | null; admin_notes: string | null;
  nb_maisons: number; nb_locataires: number;
  revenus_mois: number; commission_mois: number; revenus_annee: number;
}

type Tab = 'dashboard' | 'users' | 'roles' | 'commissions';

/* ─── Constantes ─────────────────────────────── */
const ADMIN_ROLES = [
  { value: '', label: 'Aucun rôle admin', icon: <Users size={13} />, color: 'text-slate-400' },
  { value: 'moderateur', label: 'Modérateur', icon: <Eye size={13} />, color: 'text-blue-500' },
  { value: 'admin', label: 'Administrateur', icon: <UserCog size={13} />, color: 'text-purple-500' },
  { value: 'super_admin', label: 'Super Admin', icon: <Crown size={13} />, color: 'text-[#B8860B]' },
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

/* ─────────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshed, setRefreshed] = useState(new Date());
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Edits
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

  useEffect(() => { load(); }, []);
  useEffect(() => { if (actionMsg) setTimeout(() => setActionMsg(null), 3500); }, [actionMsg]);

  /* ─── Chargement données ─── */
  async function load() {
    if (!supabase) return;
    setLoading(true);
    try {
      const now = new Date(); const cm = now.getMonth() + 1; const cy = now.getFullYear();
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!profiles) return;

      const rows = await Promise.all(profiles.map(async p => {
        const [mRes, lRes, pM, pA] = await Promise.all([
          supabase!.from('maisons').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id),
          supabase!.from('locataires').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id),
          supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('mois', cm).eq('annee', cy).eq('statut', 'payé'),
          supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('annee', cy).eq('statut', 'payé'),
        ]);
        const rM = (pM.data || []).reduce((s: number, x: any) => s + x.montant, 0);
        const rA = (pA.data || []).reduce((s: number, x: any) => s + x.montant, 0);
        return {
          id: p.id, nom: p.nom || '', prenom: p.prenom || '', email: p.email || '',
          telephone: p.telephone || '', pays: p.pays || 'Bénin',
          code_unique: p.code_unique || '—', created_at: p.created_at,
          role: p.role || 'proprietaire', admin_role: p.admin_role || null,
          is_super_admin: p.is_super_admin || false, statut: p.statut || 'actif',
          permissions: p.permissions || null, admin_notes: p.admin_notes || null,
          nb_maisons: mRes.count || 0, nb_locataires: lRes.count || 0,
          revenus_mois: rM, commission_mois: Math.round(rM * 3.5 / 100), revenus_annee: rA,
        };
      }));
      setUsers(rows);
      setRefreshed(new Date());
    } finally { setLoading(false); }
  }

  /* ─── KPIs ─── */
  const kpis = useMemo(() => {
    const proprios = users.filter(u => u.role === 'proprietaire');
    return {
      total: users.length, proprios: proprios.length,
      locataires: users.filter(u => u.role === 'locataire').length,
      admins: users.filter(u => u.admin_role || u.is_super_admin).length,
      suspendus: users.filter(u => u.statut === 'suspendu').length,
      maisons: proprios.reduce((s, u) => s + u.nb_maisons, 0),
      revenus_mois: proprios.reduce((s, u) => s + u.revenus_mois, 0),
      commission_mois: proprios.reduce((s, u) => s + u.commission_mois, 0),
      commission_annee: proprios.reduce((s, u) => s + Math.round(u.revenus_annee * 3.5 / 100), 0),
    };
  }, [users]);

  const paysStats = useMemo(() => {
    const map: Record<string, number> = {};
    users.filter(u => u.role === 'proprietaire').forEach(u => { map[u.pays] = (map[u.pays] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchFilter = userFilter === 'all' || u.role === userFilter || u.statut === userFilter;
      const q = searchUser.toLowerCase();
      const matchSearch = !q || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [users, userFilter, searchUser]);

  /* ─── Actions ─── */
  async function supprimerUser(u: UserRow) {
    if (!supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_delete_user_data', { target_user_id: u.id });
      if (error) throw error;
      setConfirmDelete(null);
      setActionMsg({ type: 'ok', text: `Compte de ${u.prenom} ${u.nom} supprimé.` });
      await load();
    } catch (e: any) {
      setActionMsg({ type: 'err', text: e.message });
    } finally { setSaving(false); }
  }

  async function updateRole(userId: string, role: string, adminRole: string, isAdmin: boolean) {
    if (!supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId, new_role: role,
        new_admin_role: adminRole, new_is_admin: isAdmin,
      });
      if (error) throw error;
      setEditingRole(null);
      setActionMsg({ type: 'ok', text: 'Rôle mis à jour.' });
      await load();
    } catch (e: any) { setActionMsg({ type: 'err', text: e.message }); }
    finally { setSaving(false); }
  }

  async function toggleStatut(u: UserRow) {
    if (!supabase) return;
    const newStatut = u.statut === 'actif' ? 'suspendu' : 'actif';
    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_set_user_status', { target_user_id: u.id, new_status: newStatut });
      if (error) throw error;
      setActionMsg({ type: 'ok', text: `Compte ${newStatut === 'suspendu' ? 'suspendu' : 'réactivé'}.` });
      await load();
    } catch (e: any) { setActionMsg({ type: 'err', text: e.message }); }
    finally { setSaving(false); }
  }

  async function savePermissions(userId: string) {
    if (!supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ permissions: permState }).eq('id', userId);
      if (error) throw error;
      setEditingPerms(null);
      setActionMsg({ type: 'ok', text: 'Permissions mises à jour.' });
      await load();
    } catch (e: any) { setActionMsg({ type: 'err', text: e.message }); }
    finally { setSaving(false); }
  }

  async function saveNotes(userId: string) {
    if (!supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ admin_notes: notesDraft }).eq('id', userId);
      if (error) throw error;
      setEditingNotes(null);
      setActionMsg({ type: 'ok', text: 'Notes enregistrées.' });
      await load();
    } catch (e: any) { setActionMsg({ type: 'err', text: e.message }); }
    finally { setSaving(false); }
  }

  async function envoyerResetPassword(email: string) {
    if (!supabase) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/connexion` });
    if (error) setActionMsg({ type: 'err', text: error.message });
    else setActionMsg({ type: 'ok', text: `Email de réinitialisation envoyé à ${email}` });
  }

  function openEditPerms(u: UserRow) {
    const base: Record<string, boolean> = {};
    PERMS.forEach(p => { base[p.key] = u.permissions?.[p.key] ?? false; });
    setPermState(base);
    setEditingPerms(u.id);
  }

  /* ─── Badges ─── */
  function roleBadge(u: UserRow) {
    if (u.is_super_admin || u.admin_role === 'super_admin') return <span className="text-[9px] font-black bg-[#B8860B]/20 text-[#B8860B] px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><Crown size={9} /> Super Admin</span>;
    if (u.admin_role === 'admin') return <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><UserCog size={9} /> Admin</span>;
    if (u.admin_role === 'moderateur') return <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><Eye size={9} /> Modérateur</span>;
    if (u.role === 'proprietaire') return <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><Home size={9} /> Proprio</span>;
    return <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><Users size={9} /> Locataire</span>;
  }

  function statutBadge(statut: string) {
    if (statut === 'actif') return <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><CheckCircle2 size={9} /> Actif</span>;
    if (statut === 'suspendu') return <span className="text-[9px] font-black bg-red-100 text-red-600 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><Ban size={9} /> Suspendu</span>;
    return <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit"><AlertTriangle size={9} /> En attente</span>;
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: 'Vue générale', icon: <LayoutDashboard size={14} /> },
    { id: 'users', label: 'Utilisateurs', icon: <Users size={14} />, count: users.length },
    { id: 'roles', label: 'Rôles & Droits', icon: <Shield size={14} /> },
    { id: 'commissions', label: 'Commissions', icon: <Percent size={14} /> },
  ];

  const proprios = users.filter(u => u.role === 'proprietaire');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Toast */}
      {actionMsg && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 ${actionMsg.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
          {actionMsg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {actionMsg.text}
        </div>
      )}

      {/* TOPBAR */}
      <header className="bg-[#1A1A2E] px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#B8860B] rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm">ImmoAfrik — Super Admin</p>
            <p className="text-[10px] text-slate-400">{profile?.prenom} {profile?.nom} · {refreshed.toLocaleTimeString('fr-FR')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all">
            <Home size={13} /> <span className="hidden sm:inline">Mon dashboard</span>
          </button>
          <button onClick={async () => { await signOut(); navigate('/'); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-300 transition-all">
            <LogOut size={13} /> <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </header>

      {/* TABS */}
      <div className="bg-white border-b border-slate-100 px-6 flex gap-1 sticky top-[72px] z-30 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-widest border-b-2 whitespace-nowrap transition-all ${tab === t.id ? 'border-[#B8860B] text-[#B8860B]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {t.icon} {t.label}
            {t.count !== undefined && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${tab === t.id ? 'bg-[#B8860B] text-white' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-16">

        {/* KPIs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mb-8">
          {[
            { l: 'Utilisateurs', v: kpis.total, c: '#1A1A2E' },
            { l: 'Proprios', v: kpis.proprios, c: '#3B82F6' },
            { l: 'Locataires', v: kpis.locataires, c: '#8B5CF6' },
            { l: 'Admins', v: kpis.admins, c: '#B8860B' },
            { l: 'Suspendus', v: kpis.suspendus, c: '#EF4444' },
            { l: 'Maisons', v: kpis.maisons, c: '#06B6D4' },
            { l: 'Rev. mois', v: `${kpis.revenus_mois.toLocaleString('fr-FR')}F`, c: '#F59E0B' },
            { l: 'Com. mois', v: `${kpis.commission_mois.toLocaleString('fr-FR')}F`, c: '#B8860B' },
            { l: 'Com. année', v: `${kpis.commission_annee.toLocaleString('fr-FR')}F`, c: '#10B981' },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.l}</p>
              <p className="font-black text-sm" style={{ color: k.c }}>{k.v}</p>
            </div>
          ))}
        </div>

        {loading && <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#B8860B]" size={36} /></div>}

        {/* ── VUE GÉNÉRALE ── */}
        {!loading && tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#1A1A2E] rounded-[2rem] p-6 text-white">
                <div className="flex items-center gap-2 mb-4"><Percent size={18} className="text-[#B8860B]" /><h3 className="font-black text-sm uppercase tracking-widest">Commission ce mois</h3></div>
                <p className="text-5xl font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')}</p>
                <p className="text-slate-400 text-sm mt-1">FCFA — 3,5% de {kpis.revenus_mois.toLocaleString('fr-FR')} FCFA</p>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                  <div><p className="text-xs text-slate-400">Cette année</p><p className="text-xl font-black text-green-400">{kpis.commission_annee.toLocaleString('fr-FR')} FCFA</p></div>
                  <div className="text-right"><p className="text-xs text-slate-400">Taux fixe</p><p className="text-xl font-black text-[#B8860B]">3,5%</p></div>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4"><Globe size={18} className="text-[#B8860B]" /><h3 className="font-black text-sm uppercase tracking-widest text-[#1A1A2E]">Présence géographique</h3></div>
                <div className="space-y-2.5">
                  {paysStats.length === 0 ? <p className="text-slate-400 italic text-sm">Aucun propriétaire.</p> : paysStats.map(([pays, count]) => {
                    const conf = getPaysConfig(pays);
                    return (
                      <div key={pays} className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="text-base">{conf.flag}</span><span className="text-sm font-bold text-slate-700">{pays}</span></div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-slate-100 rounded-full w-16 overflow-hidden"><div className="h-full bg-[#B8860B] rounded-full" style={{ width: `${(count / kpis.proprios) * 100}%` }} /></div>
                          <span className="text-xs font-black text-[#B8860B] w-4">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest flex items-center gap-2"><Calendar size={14} className="text-[#B8860B]" /> Derniers inscrits</h3>
                <button onClick={() => setTab('users')} className="text-xs font-bold text-[#B8860B] flex items-center gap-1 hover:opacity-80">Voir tous <ChevronRight size={13} /></button>
              </div>
              <div className="divide-y divide-slate-50">
                {users.slice(0, 6).map(u => {
                  const conf = getPaysConfig(u.pays);
                  return (
                    <div key={u.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#1A1A2E] rounded-xl flex items-center justify-center font-black text-[#B8860B] text-xs">{u.prenom[0]}{u.nom[0]}</div>
                        <div>
                          <div className="flex items-center gap-2">{roleBadge(u)}{statutBadge(u.statut)}</div>
                          <p className="text-xs font-bold text-slate-700">{u.prenom} {u.nom} · {conf.flag} {u.pays}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-[#B8860B]">{u.commission_mois.toLocaleString('fr-FR')} FCFA</p>
                        <p className="text-[10px] text-slate-400">{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── UTILISATEURS ── */}
        {!loading && tab === 'users' && (
          <div>
            {/* Filtres */}
            <div className="flex gap-3 mb-5 flex-wrap">
              <input placeholder="Rechercher..." className="flex-1 min-w-[200px] max-w-xs bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B8860B] transition-all"
                value={searchUser} onChange={e => setSearchUser(e.target.value)} />
              <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[#B8860B] transition-all"
                value={userFilter} onChange={e => setUserFilter(e.target.value)}>
                <option value="all">Tous ({users.length})</option>
                <option value="proprietaire">Propriétaires ({kpis.proprios})</option>
                <option value="locataire">Locataires ({kpis.locataires})</option>
                <option value="suspendu">Suspendus ({kpis.suspendus})</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredUsers.map(u => {
                const conf = getPaysConfig(u.pays);
                const isExpanded = expanded === u.id;
                const isSelf = u.id === profile?.id;
                return (
                  <div key={u.id} className={`bg-white rounded-[1.5rem] border shadow-sm overflow-hidden transition-all ${u.statut === 'suspendu' ? 'border-red-100' : 'border-slate-100'}`}>
                    {/* Ligne principale */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${u.statut === 'suspendu' ? 'bg-red-100 text-red-500' : 'bg-[#1A1A2E] text-[#B8860B]'}`}>
                          {u.prenom?.[0] || '?'}{u.nom?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-slate-800">{u.prenom} {u.nom}</p>
                            {roleBadge(u)} {statutBadge(u.statut)}
                            {isSelf && <span className="text-[9px] font-black bg-[#B8860B] text-white px-2 py-0.5 rounded-full">Vous</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1"><Mail size={9} />{u.email}</span>
                            {u.telephone && <span className="flex items-center gap-1"><Phone size={9} />{u.telephone}</span>}
                            <span>{conf.flag} {u.pays}</span>
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-lg">{u.code_unique}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Stats */}
                        {u.role === 'proprietaire' && (
                          <div className="hidden md:flex items-center gap-3 mr-2">
                            <div className="text-center"><p className="text-sm font-black text-[#1A1A2E]">{u.nb_maisons}</p><p className="text-[9px] text-slate-400">Maisons</p></div>
                            <div className="text-center bg-[#B8860B]/10 rounded-xl px-2 py-1"><p className="text-xs font-black text-[#B8860B]">{u.commission_mois.toLocaleString('fr-FR')}</p><p className="text-[9px] text-[#B8860B]">Com.</p></div>
                          </div>
                        )}
                        <button onClick={() => setExpanded(isExpanded ? null : u.id)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-all">
                          <Settings size={13} /> {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Panel étendu */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-5">

                        {/* Actions rapides */}
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Actions rapides</p>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => toggleStatut(u)} disabled={saving || isSelf}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${u.statut === 'actif' ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100'}`}>
                              {u.statut === 'actif' ? <><Ban size={13} /> Suspendre</> : <><CheckCircle2 size={13} /> Réactiver</>}
                            </button>
                            <button onClick={() => envoyerResetPassword(u.email)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-all">
                              <Mail size={13} /> Reset mot de passe
                            </button>
                            {!isSelf && (
                              <button onClick={() => setConfirmDelete(u)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all">
                                <Trash2 size={13} /> Supprimer le compte
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Rôle */}
                        {!isSelf && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Crown size={11} /> Rôle administrateur</p>
                              {editingRole !== u.id && <button onClick={() => setEditingRole(u.id)} className="text-xs font-bold text-[#B8860B] flex items-center gap-1"><Edit2 size={11} /> Modifier</button>}
                            </div>
                            {editingRole === u.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {ADMIN_ROLES.map(r => (
                                    <button key={r.value} onClick={() => updateRole(u.id, u.role, r.value, r.value === 'super_admin')} disabled={saving}
                                      className={`p-3 rounded-xl border text-left transition-all ${(u.admin_role || '') === r.value ? 'border-[#B8860B]/50 bg-[#B8860B]/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                      <div className={`flex items-center gap-2 mb-1 ${r.color}`}>{r.icon}<span className="text-xs font-black">{r.label}</span></div>
                                    </button>
                                  ))}
                                </div>
                                <button onClick={() => setEditingRole(null)} className="text-xs text-slate-400 font-bold flex items-center gap-1"><X size={11} /> Annuler</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">{roleBadge(u)}<span className="text-xs text-slate-400">· Rôle app : <strong>{u.role}</strong></span></div>
                            )}
                          </div>
                        )}

                        {/* Permissions */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Shield size={11} /> Permissions</p>
                            {editingPerms !== u.id ? (
                              <button onClick={() => openEditPerms(u)} className="text-xs font-bold text-[#B8860B] flex items-center gap-1"><Edit2 size={11} /> Modifier</button>
                            ) : (
                              <div className="flex gap-3">
                                <button onClick={() => setEditingPerms(null)} className="text-xs text-slate-400 font-bold flex items-center gap-1"><X size={11} /> Annuler</button>
                                <button onClick={() => savePermissions(u.id)} disabled={saving} className="text-xs text-green-600 font-bold flex items-center gap-1"><Save size={11} /> Sauvegarder</button>
                              </div>
                            )}
                          </div>
                          {editingPerms === u.id ? (
                            <div>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {Object.keys(PRESETS).map(preset => (
                                  <button key={preset} onClick={() => { const keys = PRESETS[preset]; const s: Record<string, boolean> = {}; PERMS.forEach(p => { s[p.key] = keys.includes(p.key); }); setPermState(s); }}
                                    className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-white hover:bg-[#B8860B]/10 text-slate-500 hover:text-[#B8860B] border border-slate-200 hover:border-[#B8860B]/30 transition-all">
                                    {preset}
                                  </button>
                                ))}
                              </div>
                              <div className="space-y-3">
                                {Object.entries(PERM_GROUPS).map(([group, perms]) => (
                                  <div key={group}>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{group}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {perms.map(perm => (
                                        <label key={perm.key} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${permState[perm.key] ? 'border-[#B8860B]/40 bg-[#B8860B]/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                          <input type="checkbox" className="w-3.5 h-3.5 accent-[#B8860B]" checked={!!permState[perm.key]} onChange={e => setPermState(s => ({ ...s, [perm.key]: e.target.checked }))} />
                                          <span className="text-[10px] font-medium text-slate-600">{perm.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {u.permissions && Object.entries(u.permissions).filter(([, v]) => v).length > 0
                                ? Object.entries(u.permissions).filter(([, v]) => v).map(([k]) => {
                                    const p = PERMS.find(x => x.key === k);
                                    return p ? <span key={k} className="text-[9px] font-black bg-[#B8860B]/10 text-[#B8860B] px-2 py-1 rounded-lg">{p.label}</span> : null;
                                  })
                                : <p className="text-[10px] text-slate-400 italic">Permissions par défaut (selon rôle)</p>
                              }
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes admin</p>
                            {editingNotes !== u.id ? (
                              <button onClick={() => { setNotesDraft(u.admin_notes || ''); setEditingNotes(u.id); }} className="text-xs font-bold text-[#B8860B] flex items-center gap-1"><Edit2 size={11} /> {u.admin_notes ? 'Modifier' : 'Ajouter'}</button>
                            ) : (
                              <div className="flex gap-3">
                                <button onClick={() => setEditingNotes(null)} className="text-xs text-slate-400 font-bold flex items-center gap-1"><X size={11} /> Annuler</button>
                                <button onClick={() => saveNotes(u.id)} disabled={saving} className="text-xs text-green-600 font-bold flex items-center gap-1"><Save size={11} /> Sauvegarder</button>
                              </div>
                            )}
                          </div>
                          {editingNotes === u.id ? (
                            <textarea rows={2} placeholder="Notes internes..." className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#B8860B] resize-none transition-all"
                              value={notesDraft} onChange={e => setNotesDraft(e.target.value)} />
                          ) : u.admin_notes ? (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3 italic">{u.admin_notes}</p>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">Aucune note</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredUsers.length === 0 && <div className="text-center py-16 text-slate-400 italic text-sm">Aucun utilisateur trouvé.</div>}
            </div>
          </div>
        )}

        {/* ── RÔLES ── */}
        {!loading && tab === 'roles' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50">
                <h2 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest flex items-center gap-2"><Shield size={14} className="text-[#B8860B]" /> Récapitulatif des rôles</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {users.filter(u => u.admin_role || u.is_super_admin).map(u => {
                  const conf = getPaysConfig(u.pays);
                  return (
                    <div key={u.id} className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1A1A2E] rounded-xl flex items-center justify-center font-black text-[#B8860B] text-xs">{u.prenom[0]}{u.nom[0]}</div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{u.prenom} {u.nom}</p>
                          <p className="text-[10px] text-slate-400">{conf.flag} {u.pays} · {u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">{roleBadge(u)}{statutBadge(u.statut)}</div>
                    </div>
                  );
                })}
                {users.filter(u => u.admin_role || u.is_super_admin).length === 0 && (
                  <p className="p-8 text-center text-slate-400 italic text-sm">Aucun admin configuré.</p>
                )}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Pour modifier les rôles, allez dans l'onglet <strong>Utilisateurs</strong> et cliquez sur ⚙ à côté de l'utilisateur.</p>
            </div>
          </div>
        )}

        {/* ── COMMISSIONS ── */}
        {!loading && tab === 'commissions' && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-[#1A1A2E] rounded-[2rem] p-6 text-white">
                <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-2">À percevoir ce mois</p>
                <p className="text-5xl font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')}</p>
                <p className="text-slate-400 text-sm mt-1">FCFA (3,5% de {kpis.revenus_mois.toLocaleString('fr-FR')} FCFA)</p>
              </div>
              <div className="bg-white rounded-[2rem] border border-green-100 shadow-sm p-6">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Cumulé cette année</p>
                <p className="text-5xl font-black text-green-600">{kpis.commission_annee.toLocaleString('fr-FR')}</p>
                <p className="text-slate-400 text-sm mt-1">FCFA</p>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
              <div className="p-5 border-b border-slate-50"><h2 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest flex items-center gap-2"><Percent size={14} className="text-[#B8860B]" /> Détail propriétaires</h2></div>
              <table className="w-full min-w-[700px]">
                <thead><tr className="border-b border-slate-50">{['Propriétaire','Pays','Revenus mois','Commission mois','Revenus année','Commission année'].map(h => <th key={h} className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {proprios.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic">Aucun propriétaire.</td></tr> : proprios.map(p => {
                    const conf = getPaysConfig(p.pays); const ca = Math.round(p.revenus_annee * 3.5 / 100);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4"><p className="text-sm font-black text-[#1A1A2E]">{p.prenom} {p.nom}</p><p className="text-[10px] text-slate-400">{p.email}</p></td>
                        <td className="px-5 py-4 text-sm text-slate-500">{conf.flag} {p.pays}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-700">{p.revenus_mois.toLocaleString('fr-FR')} {conf.symbole}</td>
                        <td className="px-5 py-4"><span className={`text-sm font-black ${p.commission_mois > 0 ? 'text-[#B8860B]' : 'text-slate-400'}`}>{p.commission_mois.toLocaleString('fr-FR')} {conf.symbole}</span></td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-700">{p.revenus_annee.toLocaleString('fr-FR')} {conf.symbole}</td>
                        <td className="px-5 py-4"><span className={`text-sm font-black ${ca > 0 ? 'text-green-600' : 'text-slate-400'}`}>{ca.toLocaleString('fr-FR')} {conf.symbole}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
                {proprios.length > 0 && (
                  <tfoot className="border-t-2 border-[#B8860B]/20 bg-[#B8860B]/5">
                    <tr>
                      <td className="px-5 py-4 text-sm font-black text-[#B8860B]" colSpan={2}>TOTAL</td>
                      <td className="px-5 py-4 text-sm font-black text-slate-700">{kpis.revenus_mois.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-sm font-black text-[#B8860B]">{kpis.commission_mois.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-sm font-black text-slate-700">{users.reduce((s, u) => s + u.revenus_annee, 0).toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-sm font-black text-green-600">{kpis.commission_annee.toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-[#1A1A2E] mb-2">Supprimer ce compte ?</h3>
            <p className="text-sm text-slate-500 mb-2"><strong>{confirmDelete.prenom} {confirmDelete.nom}</strong></p>
            <p className="text-xs text-red-500 mb-6">Cette action est irréversible. Toutes les données seront effacées (maisons, locataires, paiements, contrats...).</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">Annuler</button>
              <button onClick={() => supprimerUser(confirmDelete)} disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

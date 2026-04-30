import { useState, useEffect } from 'react';
import {
  Users, Home, Banknote, TrendingUp, Loader2,
  ShieldCheck, Building2, Globe, Percent, UserX,
  RefreshCw, LogOut, AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPaysConfig } from '@/lib/countries';

interface ProprioStats {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  pays: string;
  created_at: string;
  code_unique: string;
  nb_maisons: number;
  nb_unites: number;
  nb_locataires: number;
  revenus_mois: number;
  commission_mois: number;
}

interface GlobalStats {
  totalProprios: number;
  totalMaisons: number;
  totalUnites: number;
  totalLocataires: number;
  totalRevenus: number;
  totalCommissions: number;
}

export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [proprios, setProprios] = useState<ProprioStats[]>([]);
  const [global, setGlobal] = useState<GlobalStats>({ totalProprios: 0, totalMaisons: 0, totalUnites: 0, totalLocataires: 0, totalRevenus: 0, totalCommissions: 0 });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'proprietaire')
        .order('created_at', { ascending: false });

      if (!profiles) return;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const results = await Promise.all(profiles.map(async (p) => {
        const [maisonsRes, unitesRes, locatairesRes, paiementsRes] = await Promise.all([
          supabase!.from('maisons').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id),
          supabase!.from('unites').select('id', { count: 'exact', head: true }).eq('proprietaire_id' as any, p.id),
          supabase!.from('locataires').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id),
          supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id)
            .eq('mois', currentMonth).eq('annee', currentYear).eq('statut', 'payé'),
        ]);

        // Pour les unités, on passe par les maisons
        const { data: maisons } = await supabase!.from('maisons').select('id').eq('proprietaire_id', p.id);
        const maisonIds = maisons?.map(m => m.id) || [];
        let nbUnites = 0;
        if (maisonIds.length > 0) {
          const { count } = await supabase!.from('unites').select('id', { count: 'exact', head: true }).in('maison_id', maisonIds);
          nbUnites = count || 0;
        }

        const revenus = (paiementsRes.data || []).reduce((s: number, x: { montant: number }) => s + x.montant, 0);
        return {
          id: p.id,
          nom: p.nom, prenom: p.prenom, email: p.email,
          pays: p.pays || 'Bénin',
          created_at: p.created_at,
          code_unique: p.code_unique || '—',
          nb_maisons: maisonsRes.count || 0,
          nb_unites: nbUnites,
          nb_locataires: locatairesRes.count || 0,
          revenus_mois: revenus,
          commission_mois: Math.round(revenus * 3.5 / 100),
        };
      }));

      setProprios(results);
      setGlobal({
        totalProprios: results.length,
        totalMaisons: results.reduce((s, r) => s + r.nb_maisons, 0),
        totalUnites: results.reduce((s, r) => s + r.nb_unites, 0),
        totalLocataires: results.reduce((s, r) => s + r.nb_locataires, 0),
        totalRevenus: results.reduce((s, r) => s + r.revenus_mois, 0),
        totalCommissions: results.reduce((s, r) => s + r.commission_mois, 0),
      });
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 md:p-8 pb-32 lg:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={24} className="text-[#B8860B]" />
            <h1 className="text-2xl font-black text-[#1A1A2E]">Super Admin</h1>
          </div>
          <p className="text-sm text-slate-500">
            Connecté : <strong>{profile?.prenom} {profile?.nom}</strong> · {profile?.email}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} variant="outline" className="rounded-xl flex items-center gap-2 text-xs" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </Button>
          <Button onClick={async () => { await signOut(); navigate('/'); }} variant="outline" className="rounded-xl text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-2 text-xs">
            <LogOut size={14} /> Quitter
          </Button>
        </div>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
        {[
          { label: 'Propriétaires', value: global.totalProprios, icon: <Users size={16} />, color: 'text-[#1A1A2E]', bg: 'bg-slate-50' },
          { label: 'Maisons', value: global.totalMaisons, icon: <Building2 size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Unités', value: global.totalUnites, icon: <Home size={16} />, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Locataires', value: global.totalLocataires, icon: <Users size={16} />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Revenus mois', value: `${global.totalRevenus.toLocaleString('fr-FR')}`, icon: <Banknote size={16} />, color: 'text-amber-600', bg: 'bg-amber-50', suffix: ' FCFA' },
          { label: 'Commissions 3,5%', value: `${global.totalCommissions.toLocaleString('fr-FR')}`, icon: <Percent size={16} />, color: 'text-[#B8860B]', bg: 'bg-[#B8860B]/10', suffix: ' FCFA' },
        ].map((k, i) => (
          <Card key={i} className="rounded-3xl border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-8 h-8 ${k.bg} rounded-xl flex items-center justify-center ${k.color} mb-3`}>
                {k.icon}
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
              <p className={`text-lg font-black ${k.color}`}>{k.value}{k.suffix || ''}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liste des propriétaires */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-black text-[#1A1A2E] uppercase tracking-widest text-sm flex items-center gap-2">
            <Globe size={16} className="text-[#B8860B]" /> Tous les propriétaires
          </h2>
          <Badge className="bg-slate-100 text-slate-600 border-none font-black">{proprios.length}</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-[#B8860B]" size={32} />
          </div>
        ) : proprios.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
            <UserX size={36} className="text-slate-200" />
            <p className="text-sm italic">Aucun propriétaire inscrit.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {proprios.map(p => {
              const paysConf = getPaysConfig(p.pays);
              return (
                <div key={p.id} className="p-5 flex items-center justify-between flex-wrap gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1A1A2E] rounded-2xl flex items-center justify-center font-black text-[#B8860B] text-sm shrink-0">
                      {p.prenom[0]}{p.nom[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{p.prenom} {p.nom}</p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{paysConf.flag} {p.pays}</span>
                        <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">{p.code_unique}</span>
                        <span className="text-[9px] text-slate-300">· Inscrit {new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 flex-wrap">
                    {[
                      { label: 'Maisons', value: p.nb_maisons, icon: <Building2 size={12} /> },
                      { label: 'Unités', value: p.nb_unites, icon: <Home size={12} /> },
                      { label: 'Locataires', value: p.nb_locataires, icon: <Users size={12} /> },
                    ].map((stat, i) => (
                      <div key={i} className="text-center">
                        <p className="text-lg font-black text-[#1A1A2E] flex items-center gap-1 justify-center">
                          <span className="text-slate-400">{stat.icon}</span>{stat.value}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{stat.label}</p>
                      </div>
                    ))}

                    <div className="text-center min-w-[90px]">
                      <p className="text-sm font-black text-green-600">{p.revenus_mois.toLocaleString('fr-FR')}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{paysConf.symbole}/mois</p>
                    </div>

                    <div className="text-center min-w-[80px] bg-[#B8860B]/10 rounded-xl px-3 py-2">
                      <p className="text-sm font-black text-[#B8860B]">{p.commission_mois.toLocaleString('fr-FR')}</p>
                      <p className="text-[9px] text-[#B8860B] font-black uppercase">Commission</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note sur les paiements MoMo */}
      <div className="mt-6 p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-amber-800 mb-1">Commission mensuelle à collecter</p>
          <p className="text-xs text-amber-700">
            Total commissions du mois en cours : <strong>{global.totalCommissions.toLocaleString('fr-FR')} FCFA</strong> (3,5% de {global.totalRevenus.toLocaleString('fr-FR')} FCFA collectés par les propriétaires).
            Les propriétaires paient via la page "Commission" de leur dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Home, Banknote, TrendingUp, Loader2, ShieldCheck, ArrowLeft, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ProprioStats {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  abonnement_plan: string;
  created_at: string;
  nb_maisons: number;
  nb_locataires: number;
  revenus_mois: number;
}

export default function SuperAdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProprioStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({ totalProprios: 0, totalMaisons: 0, totalLocataires: 0, totalRevenus: 0 });

  useEffect(() => {
    if (profile?.role !== 'proprietaire') return;
    loadStats();
  }, [profile]);

  async function loadStats() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'proprietaire')
        .order('created_at', { ascending: false });

      if (!profiles) return;

      const statsPromises = profiles.map(async (p) => {
        const [maisonsRes, locatairesRes, paiementsRes] = await Promise.all([
          supabase.from('maisons').select('id', { count: 'exact' }).eq('proprietaire_id', p.id),
          supabase.from('locataires').select('id', { count: 'exact' }).eq('proprietaire_id', p.id),
          supabase.from('paiements').select('montant').eq('proprietaire_id', p.id)
            .eq('mois', new Date().getMonth() + 1).eq('annee', new Date().getFullYear()).eq('statut', 'payé'),
        ]);
        return {
          id: p.id,
          nom: p.nom,
          prenom: p.prenom,
          email: p.email,
          abonnement_plan: p.abonnement_plan,
          created_at: p.created_at,
          nb_maisons: maisonsRes.count || 0,
          nb_locataires: locatairesRes.count || 0,
          revenus_mois: (paiementsRes.data || []).reduce((s: number, x: { montant: number }) => s + x.montant, 0),
        };
      });

      const result = await Promise.all(statsPromises);
      setStats(result);
      setGlobalStats({
        totalProprios: result.length,
        totalMaisons: result.reduce((s, r) => s + r.nb_maisons, 0),
        totalLocataires: result.reduce((s, r) => s + r.nb_locataires, 0),
        totalRevenus: result.reduce((s, r) => s + r.revenus_mois, 0),
      });
    } finally {
      setLoading(false);
    }
  }

  const PLAN_COLOR: Record<string, string> = {
    starter: 'bg-slate-100 text-slate-600',
    pro: 'bg-[#B8860B]/10 text-[#B8860B]',
    enterprise: 'bg-purple-100 text-purple-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#B8860B]" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 lg:pb-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-[#B8860B]" />
            <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Super Admin</h1>
          </div>
          <p className="text-sm text-slate-500">Vue globale de tous les propriétaires</p>
        </div>
      </div>

      {/* STATS GLOBALES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Propriétaires</p>
            <h3 className="text-2xl font-black text-[#1A1A2E] flex items-center gap-2">
              <Users size={18} className="text-slate-400" /> {globalStats.totalProprios}
            </h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-blue-50/40">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest mb-1">Maisons</p>
            <h3 className="text-2xl font-black text-blue-600 flex items-center gap-2">
              <Building2 size={18} /> {globalStats.totalMaisons}
            </h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-green-50/40">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-green-500/70 uppercase tracking-widest mb-1">Locataires</p>
            <h3 className="text-2xl font-black text-green-600 flex items-center gap-2">
              <Users size={18} /> {globalStats.totalLocataires}
            </h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-amber-50/40">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-1">Revenus du mois</p>
            <h3 className="text-lg font-black text-amber-600">
              {globalStats.totalRevenus.toLocaleString()} <span className="text-xs">FCFA</span>
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* LISTE PROPRIETAIRES */}
      <h2 className="text-lg font-black text-[#1A1A2E] mb-4 uppercase tracking-widest">Tous les propriétaires</h2>
      <div className="space-y-3">
        {stats.map(p => (
          <div key={p.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1A1A2E] rounded-2xl flex items-center justify-center font-black text-[#B8860B] text-base">
                  {p.prenom[0]}{p.nom[0]}
                </div>
                <div>
                  <h4 className="font-black text-slate-800">{p.prenom} {p.nom}</h4>
                  <p className="text-xs text-slate-400">{p.email}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Inscrit le {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-lg font-black text-[#1A1A2E] flex items-center gap-1"><Home size={14} className="text-slate-400" />{p.nb_maisons}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Maisons</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-[#1A1A2E] flex items-center gap-1"><Users size={14} className="text-slate-400" />{p.nb_locataires}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Locataires</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-green-600 flex items-center gap-1"><TrendingUp size={14} />{p.revenus_mois.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">FCFA/mois</p>
                </div>
                <Badge className={`${PLAN_COLOR[p.abonnement_plan] || PLAN_COLOR.starter} border-none font-black text-xs uppercase`}>
                  {p.abonnement_plan}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

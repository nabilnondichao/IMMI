import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Home, Banknote, TrendingUp, Loader2, ShieldCheck,
  Building2, Globe, Percent, RefreshCw, ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getPaysConfig } from '@/lib/countries';

interface ProprioStats {
  id: string; nom: string; prenom: string; email: string;
  pays: string; created_at: string;
  nb_maisons: number; nb_locataires: number;
  revenus_mois: number; commission_mois: number;
}

export default function SuperAdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [proprios, setProprios] = useState<ProprioStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    try {
      const now = new Date();
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'proprietaire').order('created_at', { ascending: false });
      if (!profiles) return;

      const rows = await Promise.all(profiles.map(async (p) => {
        const [mRes, lRes, payRes] = await Promise.all([
          supabase!.from('maisons').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id),
          supabase!.from('locataires').select('id', { count: 'exact', head: true }).eq('proprietaire_id', p.id),
          supabase!.from('paiements').select('montant').eq('proprietaire_id', p.id).eq('mois', now.getMonth() + 1).eq('annee', now.getFullYear()).eq('statut', 'payé'),
        ]);
        const rev = (payRes.data || []).reduce((s: number, x: any) => s + x.montant, 0);
        return { id: p.id, nom: p.nom, prenom: p.prenom, email: p.email, pays: p.pays || 'Bénin', created_at: p.created_at, nb_maisons: mRes.count || 0, nb_locataires: lRes.count || 0, revenus_mois: rev, commission_mois: Math.round(rev * 3.5 / 100) };
      }));

      setProprios(rows);
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }

  const global = useMemo(() => ({
    proprios: proprios.length,
    maisons: proprios.reduce((s, r) => s + r.nb_maisons, 0),
    locataires: proprios.reduce((s, r) => s + r.nb_locataires, 0),
    revenus: proprios.reduce((s, r) => s + r.revenus_mois, 0),
    commission: proprios.reduce((s, r) => s + r.commission_mois, 0),
  }), [proprios]);

  return (
    <div className="p-6 md:p-8 pb-32 lg:pb-8">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/dashboard')}><ArrowLeft size={20} /></Button>
          <div>
            <div className="flex items-center gap-2"><ShieldCheck size={22} className="text-[#B8860B]" /><h1 className="text-2xl font-black text-[#1A1A2E]">Super Admin</h1></div>
            <p className="text-sm text-slate-500">Mis à jour {lastRefresh.toLocaleTimeString('fr-FR')} · {profile?.prenom} {profile?.nom}</p>
          </div>
        </div>
        <Button onClick={load} disabled={loading} variant="outline" className="rounded-xl flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {[
          { l: 'Propriétaires', v: global.proprios, c: 'text-[#1A1A2E]' },
          { l: 'Maisons', v: global.maisons, c: 'text-blue-600' },
          { l: 'Locataires', v: global.locataires, c: 'text-green-600' },
          { l: 'Revenus mois', v: `${global.revenus.toLocaleString('fr-FR')} FCFA`, c: 'text-amber-600' },
          { l: 'Commission 3,5%', v: `${global.commission.toLocaleString('fr-FR')} FCFA`, c: 'text-[#B8860B]' },
        ].map((k, i) => (
          <Card key={i} className="rounded-3xl border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.l}</p>
              <p className={`text-xl font-black ${k.c}`}>{k.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-[#B8860B]" size={32} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-black text-[#1A1A2E] text-sm uppercase tracking-widest flex items-center gap-2"><Globe size={15} className="text-[#B8860B]" /> Tous les propriétaires</h2>
            <Badge className="bg-slate-100 text-slate-600 border-none font-black">{proprios.length}</Badge>
          </div>
          <div className="divide-y divide-slate-50">
            {proprios.map(p => {
              const conf = getPaysConfig(p.pays);
              return (
                <div key={p.id} className="p-5 flex items-center justify-between flex-wrap gap-4 hover:bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#1A1A2E] rounded-2xl flex items-center justify-center font-black text-[#B8860B]">{p.prenom[0]}{p.nom[0]}</div>
                    <div>
                      <p className="font-black text-slate-800">{p.prenom} {p.nom}</p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">{conf.flag} {p.pays} · Inscrit {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 flex-wrap">
                    <div className="text-center"><p className="text-lg font-black text-[#1A1A2E]">{p.nb_maisons}</p><p className="text-[9px] text-slate-400 uppercase">Maisons</p></div>
                    <div className="text-center"><p className="text-lg font-black text-[#1A1A2E]">{p.nb_locataires}</p><p className="text-[9px] text-slate-400 uppercase">Locataires</p></div>
                    <div className="text-center bg-green-50 rounded-xl px-3 py-2"><p className="text-sm font-black text-green-600">{p.revenus_mois.toLocaleString('fr-FR')}</p><p className="text-[9px] text-green-700 uppercase">{conf.symbole}/mois</p></div>
                    <div className="text-center bg-[#B8860B]/10 rounded-xl px-3 py-2"><p className="text-sm font-black text-[#B8860B]">{p.commission_mois.toLocaleString('fr-FR')}</p><p className="text-[9px] text-[#B8860B] uppercase">Commission</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

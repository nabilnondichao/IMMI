import React, { useMemo, useState } from 'react';
import { Calculator, TrendingUp, AlertTriangle, Loader2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { usePaiements, useDepenses, useMaisons, useAllUnites } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { getPaysConfig } from '@/lib/countries';

const TAUX_IMPOTS: Record<string, { taux: number; nom: string; abattement: number }> = {
  'Bénin':         { taux: 15, nom: 'Taxe Foncière (TF)',                              abattement: 30 },
  "Côte d'Ivoire": { taux: 18, nom: 'Impôt Foncier (IF)',                              abattement: 25 },
  'Sénégal':       { taux: 20, nom: 'Contribution Foncière des Propriétés Bâties',     abattement: 40 },
  'Togo':          { taux: 15, nom: 'Taxe Foncière Unique (TFU)',                      abattement: 30 },
  'Burkina Faso':  { taux: 16, nom: 'Contribution du Secteur Immobilier',              abattement: 25 },
  'Mali':          { taux: 15, nom: 'Impôt sur les Revenus Fonciers',                  abattement: 30 },
  'Niger':         { taux: 14, nom: 'Taxe sur les Revenus Immobiliers',                abattement: 20 },
  'Ghana':         { taux: 8,  nom: 'Property Rate',                                   abattement: 0  },
  'Nigeria':       { taux: 10, nom: 'Tenement Rate / Income Tax',                      abattement: 20 },
};

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const COLORS = ['#B8860B','#1A1A2E','#10B981','#3B82F6','#EF4444','#8B5CF6'];

export default function ImpotsPage() {
  const { profile } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const { paiements, isLoading: pLoad } = usePaiements({});
  const { depenses, isLoading: dLoad } = useDepenses();
  const { maisons } = useMaisons();
  const { unites } = useAllUnites();

  const pays = profile?.pays || 'Bénin';
  const conf = getPaysConfig(pays);
  const fisc = TAUX_IMPOTS[pays] ?? TAUX_IMPOTS['Bénin'];

  const revenusBruts = useMemo(() =>
    paiements.filter(p => p.statut === 'payé' && p.annee === year).reduce((s, p) => s + p.montant, 0),
    [paiements, year]);

  const depTotal = useMemo(() =>
    depenses.filter(d => new Date(d.date_depense).getFullYear() === year).reduce((s, d) => s + d.montant, 0),
    [depenses, year]);

  const base = Math.max(0, revenusBruts * (1 - fisc.abattement / 100) - depTotal);
  const impot = Math.round(base * fisc.taux / 100);
  const net = revenusBruts - depTotal - impot;
  const tauxEff = revenusBruts > 0 ? ((impot / revenusBruts) * 100).toFixed(1) : '0';

  const mensuel = useMemo(() => MOIS.map((nom, i) => {
    const m = i + 1;
    const rev = paiements.filter(p => p.statut === 'payé' && p.annee === year && p.mois === m).reduce((s, p) => s + p.montant, 0);
    const dep = depenses.filter(d => { const dd = new Date(d.date_depense); return dd.getFullYear() === year && dd.getMonth() + 1 === m; }).reduce((s, d) => s + d.montant, 0);
    const imp = Math.round(Math.max(0, rev * (1 - fisc.abattement / 100) - dep) * fisc.taux / 100);
    return { nom, revenus: rev, depenses: dep, impot: imp };
  }), [paiements, depenses, year, fisc]);

  const parMaison = useMemo(() => maisons.map(m => {
    const ids = unites.filter(u => u.maison_id === m.id).map(u => u.id);
    const val = paiements.filter(p => p.statut === 'payé' && p.annee === year && ids.includes(p.unite_id)).reduce((s, p) => s + p.montant, 0);
    return { nom: m.nom, value: val };
  }).filter(m => m.value > 0), [maisons, unites, paiements, year]);

  if (pLoad || dLoad) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#B8860B]" size={40} /></div>;

  const years = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()];

  return (
    <div className="p-6 md:p-8 pb-32 lg:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Impôts & Fiscalité</h1>
          <p className="text-sm text-slate-500">{conf.flag} {pays} · {fisc.nom} · {fisc.taux}% (abattement {fisc.abattement}%)</p>
        </div>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-28 rounded-xl font-bold"><SelectValue /></SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { l: 'Revenus bruts', v: revenusBruts, c: 'text-blue-600' },
          { l: 'Dépenses déductibles', v: depTotal, c: 'text-amber-600' },
          { l: `Impôt estimé (${fisc.taux}%)`, v: impot, c: 'text-red-600' },
          { l: 'Revenus nets', v: net, c: 'text-green-600' },
        ].map((k, i) => (
          <Card key={i} className="rounded-3xl border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.l}</p>
              <h3 className={`text-xl font-black ${k.c}`}>{k.v.toLocaleString('fr-FR')}</h3>
              <p className="text-[10px] text-slate-400">{conf.symbole}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bilan fiscal */}
      <div className="bg-[#1A1A2E] rounded-[2rem] p-6 mb-8 grid md:grid-cols-3 gap-6 text-white">
        <div className="col-span-2 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={20} className="text-[#B8860B]" />
            <h2 className="font-black text-lg">Calcul fiscal {year}</h2>
          </div>
          {[
            { l: 'Revenus bruts locatifs', v: revenusBruts },
            { l: `Abattement forfaitaire (${fisc.abattement}%)`, v: -Math.round(revenusBruts * fisc.abattement / 100) },
            { l: 'Charges déductibles', v: -depTotal },
            { l: 'Base imposable', v: base, bold: true },
            { l: `${fisc.nom} (${fisc.taux}%)`, v: -impot, bold: true, gold: true },
          ].map((r, i) => (
            <div key={i} className={`flex justify-between py-2 ${i > 0 ? 'border-t border-white/10' : ''}`}>
              <span className={`${r.bold ? 'font-black' : 'text-slate-400'} text-sm`}>{r.l}</span>
              <span className={`font-black text-sm ${r.gold ? 'text-[#B8860B]' : r.v < 0 ? 'text-red-400' : 'text-white'}`}>
                {r.v < 0 ? '-' : ''}{Math.abs(r.v).toLocaleString('fr-FR')} {conf.symbole}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center items-center bg-white/5 rounded-2xl p-6 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Taux effectif</p>
          <p className="text-5xl font-black text-[#B8860B]">{tauxEff}<span className="text-2xl">%</span></p>
          <div className="mt-4 p-3 bg-green-500/10 rounded-xl w-full">
            <p className="text-xs font-black text-green-400">Revenu net</p>
            <p className="text-lg font-black text-green-400">{net.toLocaleString('fr-FR')} {conf.symbole}</p>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <Tabs defaultValue="mensuel">
        <TabsList className="mb-6">
          <TabsTrigger value="mensuel"><BarChart3 size={14} className="mr-1" />Mensuel</TabsTrigger>
          <TabsTrigger value="maisons"><TrendingUp size={14} className="mr-1" />Par maison</TabsTrigger>
        </TabsList>
        <TabsContent value="mensuel">
          <Card className="rounded-[2rem] border-slate-100 shadow-sm">
            <CardHeader><CardTitle className="font-black text-[#1A1A2E] text-base">Revenus / Dépenses / Impôt par mois — {year}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mensuel}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="nom" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v: number) => [`${v.toLocaleString('fr-FR')} ${conf.symbole}`]} />
                    <Bar dataKey="revenus" name="Revenus" fill="#B8860B" radius={[4,4,0,0]} />
                    <Bar dataKey="depenses" name="Dépenses" fill="#1A1A2E" radius={[4,4,0,0]} />
                    <Bar dataKey="impot" name="Impôt" fill="#EF4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="maisons">
          <Card className="rounded-[2rem] border-slate-100 shadow-sm">
            <CardHeader><CardTitle className="font-black text-[#1A1A2E] text-base">Revenus par propriété — {year}</CardTitle></CardHeader>
            <CardContent>
              {parMaison.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 italic text-sm">Aucun paiement confirmé pour {year}.</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={parMaison} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ nom, percent }) => `${nom} ${(percent * 100).toFixed(0)}%`}>
                        {parMaison.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString('fr-FR')} ${conf.symbole}`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">Estimations indicatives. Consultez un expert-comptable pour votre déclaration fiscale officielle.</p>
      </div>
    </div>
  );
}

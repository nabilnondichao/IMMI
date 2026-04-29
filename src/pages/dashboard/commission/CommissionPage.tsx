import React, { useMemo, useState } from 'react';
import { Percent, CheckCircle2, Clock, MessageCircle, Calculator, Info, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePaiements, useMaisons, useAllUnites, useLocataires } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const TAUX = 3.5;

const TYPE_LABELS: Record<string, string> = {
  loyer: 'Loyer',
  caution: 'Caution',
  eau: 'Avance Eau',
  electricite: 'Avance Électricité',
  vidange_fosse: 'Vidange Fosse',
  autre: 'Autre charge',
};

export default function CommissionPage() {
  const { user, profile } = useAuth();
  const { paiements, isLoading } = usePaiements({});
  const { maisons } = useMaisons();
  const { unites } = useAllUnites();
  const { locataires } = useLocataires();
  const [payingFacture, setPayingFacture] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Calcul commission par mois
  const facturesMois = useMemo(() => {
    const confirmed = paiements.filter(p => p.statut === 'payé');

    // Grouper par mois/année
    const map: Record<string, { mois: number; annee: number; base: number; details: any[] }> = {};
    confirmed.forEach(p => {
      const key = `${p.annee}-${p.mois}`;
      if (!map[key]) map[key] = { mois: p.mois, annee: p.annee, base: 0, details: [] };
      map[key].base += p.montant;
      const loc = locataires.find(l => l.id === p.locataire_id);
      const unt = unites.find(u => u.id === p.unite_id);
      const msn = maisons.find(m => m.id === unt?.maison_id);
      map[key].details.push({
        locataire: loc ? `${loc.prenom} ${loc.nom}` : '—',
        unite: unt?.nom || '—',
        maison: msn?.nom || '—',
        montant: p.montant,
        type: (p as any).type_charge || 'loyer',
        ref: p.reference_immo,
      });
    });

    return Object.values(map)
      .sort((a, b) => b.annee - a.annee || b.mois - a.mois)
      .map(m => ({
        ...m,
        commission: Math.round(m.base * TAUX / 100),
        key: `${m.annee}-${m.mois}`,
        isCurrent: m.mois === currentMonth && m.annee === currentYear,
      }));
  }, [paiements, locataires, unites, maisons, currentMonth, currentYear]);

  const totalDu = useMemo(() => {
    return facturesMois
      .filter(f => f.isCurrent)
      .reduce((s, f) => s + f.commission, 0);
  }, [facturesMois]);

  const totalAnnee = useMemo(() => {
    return facturesMois
      .filter(f => f.annee === currentYear)
      .reduce((s, f) => s + f.commission, 0);
  }, [facturesMois, currentYear]);

  const MOIS_NOMS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

  function getMoisNom(m: number) {
    return MOIS_NOMS[m - 1];
  }

  function getWaMessage(facture: typeof facturesMois[0]) {
    const ref = `IMMO-COM-${String(facture.annee)}${String(facture.mois).padStart(2,'0')}-${profile?.id?.slice(0,6).toUpperCase()}`;
    return encodeURIComponent(
      `Bonjour ImmoAfrik ! 👋\n\n` +
      `Je souhaite payer ma commission du mois de ${getMoisNom(facture.mois)} ${facture.annee}.\n\n` +
      `📊 Base : ${facture.base.toLocaleString()} FCFA\n` +
      `💰 Commission (${TAUX}%) : *${facture.commission.toLocaleString()} FCFA*\n` +
      `🔖 Référence : ${ref}\n\n` +
      `Propriétaire : ${profile?.prenom} ${profile?.nom}\n` +
      `Email : ${profile?.email}`
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#B8860B]" size={40} /></div>;
  }

  return (
    <div className="p-4 md:p-8 pb-32 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Commission ImmoAfrik</h1>
        <p className="text-sm text-slate-500">{TAUX}% sur chaque paiement confirmé (loyers, caution, eau, électricité, vidange)</p>
      </div>

      {/* EXPLICATION */}
      <Card className="rounded-[2rem] border-blue-100 bg-blue-50/40 shadow-sm mb-8">
        <CardContent className="p-5 flex gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
            <Info size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-black text-blue-800 mb-1">Comment fonctionne la commission ?</p>
            <p className="text-xs text-blue-700 font-medium">
              Pour chaque paiement <strong>confirmé</strong> enregistré sur ImmoAfrik (loyer, caution, eau, électricité, vidange fosse...),
              une commission de <strong>{TAUX}%</strong> est calculée. Elle est payable chaque mois via Mobile Money.
              L'argent va toujours directement de votre locataire vers vous — ImmoAfrik facture uniquement la commission.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="rounded-3xl border-2 border-[#B8860B]/30 bg-gradient-to-br from-[#1A1A2E] to-[#252542] text-white col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Percent size={16} className="text-[#B8860B]" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">À payer ce mois</p>
            </div>
            <h3 className="text-3xl font-black text-[#B8860B]">{totalDu.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-1">FCFA — {getMoisNom(currentMonth)} {currentYear}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total {currentYear}</p>
            <h3 className="text-xl font-black text-[#1A1A2E]">{totalAnnee.toLocaleString()} <span className="text-[10px]">FCFA</span></h3>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taux commission</p>
            <h3 className="text-xl font-black text-[#B8860B]">{TAUX}%</h3>
            <p className="text-[10px] text-slate-400">sur paiements confirmés</p>
          </CardContent>
        </Card>
      </div>

      {/* PAYER CE MOIS */}
      {totalDu > 0 && (
        <Card className="rounded-[2rem] border-2 border-[#B8860B] shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-1">Facture du mois</p>
                <h3 className="text-2xl font-black text-[#1A1A2E]">{totalDu.toLocaleString()} FCFA</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {getMoisNom(currentMonth)} {currentYear} · Taux {TAUX}% · Base {facturesMois.find(f => f.isCurrent)?.base.toLocaleString() || 0} FCFA
                </p>
              </div>
              <Button
                onClick={() => {
                  const facture = facturesMois.find(f => f.isCurrent);
                  if (facture) window.open(`https://wa.me/22900000000?text=${getWaMessage(facture)}`, '_blank');
                }}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-xl flex items-center gap-2 px-6 py-4"
              >
                <MessageCircle size={18} />
                Payer via WhatsApp
              </Button>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-xs text-slate-600">
              <p className="font-black text-slate-800 mb-1">Instructions de paiement :</p>
              <p>1. Cliquez "Payer via WhatsApp" — un message pré-rempli s'ouvre</p>
              <p>2. Envoyez <strong>{totalDu.toLocaleString()} FCFA</strong> via Mobile Money au numéro ImmoAfrik</p>
              <p>3. Votre compte reste actif — aucune interruption de service</p>
            </div>
          </CardContent>
        </Card>
      )}

      {totalDu === 0 && (
        <Card className="rounded-[2rem] border-green-100 bg-green-50/40 shadow-sm mb-8">
          <CardContent className="p-6 flex items-center gap-4">
            <CheckCircle2 size={32} className="text-green-500 shrink-0" />
            <div>
              <p className="font-black text-green-800">Aucune commission due ce mois</p>
              <p className="text-xs text-green-700 mt-1">Vous êtes à jour. La commission sera calculée dès le premier paiement confirmé.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HISTORIQUE */}
      <Card className="rounded-[2rem] border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest flex items-center gap-2">
            <Calculator size={16} className="text-[#B8860B]" />
            Historique des commissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facturesMois.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic text-sm">
              Aucun paiement confirmé pour l'instant.
            </div>
          ) : (
            <div className="space-y-3">
              {facturesMois.map(f => (
                <div key={f.key} className={`p-4 rounded-2xl border transition-all ${f.isCurrent ? 'border-[#B8860B]/30 bg-[#B8860B]/5' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-black text-[#1A1A2E] flex items-center gap-2">
                        {getMoisNom(f.mois)} {f.annee}
                        {f.isCurrent && <Badge className="bg-[#B8860B] text-white border-none text-[9px] font-black">CE MOIS</Badge>}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Base : {f.base.toLocaleString()} FCFA · {f.details.length} paiement(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#B8860B] text-lg">{f.commission.toLocaleString()} FCFA</p>
                      <p className="text-[10px] text-slate-400">{TAUX}% de commission</p>
                    </div>
                  </div>

                  {/* Détail des paiements */}
                  <div className="mt-3 space-y-1">
                    {f.details.slice(0, 3).map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-[10px] text-slate-500 bg-white rounded-xl px-3 py-1.5">
                        <span className="font-medium">{d.locataire} · {d.unite} · <span className="text-[#B8860B] font-bold">{TYPE_LABELS[d.type] || d.type}</span></span>
                        <span className="font-black">{d.montant.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                    {f.details.length > 3 && (
                      <p className="text-[10px] text-slate-400 italic px-3">+{f.details.length - 3} autre(s)...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { Crown, Zap, Building2, Check, MessageCircle, ArrowUpRight, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PLANS = {
  starter: {
    nom: 'Starter', prix: 0, icon: <Building2 size={20} />, couleur: 'bg-slate-700',
    limites: '2 maisons • 10 unités • Cash uniquement',
  },
  pro: {
    nom: 'Pro', prix: 4990, icon: <Zap size={20} />, couleur: 'bg-[#B8860B]',
    limites: 'Maisons illimitées • MoMo • PDF • Analytics',
  },
  enterprise: {
    nom: 'Enterprise', prix: 14990, icon: <Crown size={20} />, couleur: 'bg-[#1A1A2E]',
    limites: 'Tout inclus • Multi-gestionnaire • WhatsApp bot',
  },
};

export default function AbonnementPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const planActuel = (profile?.abonnement_plan || 'starter') as keyof typeof PLANS;
  const plan = PLANS[planActuel];
  const expiration = profile?.abonnement_expiration;
  const isGratuit = planActuel === 'starter';

  const features: Record<string, string[]> = {
    starter: ['2 maisons max', '10 unités max', 'Paiements cash', 'Reçus PDF basiques', 'Dashboard standard'],
    pro: ['Maisons illimitées', 'Unités illimitées', 'Mobile Money', 'Reçus PDF auto', 'Upload contrats', 'Analytiques avancées', 'Codes invitation', 'Avances loyer/eau/élec'],
    enterprise: ['Tout du Pro', 'Multi-gestionnaire', 'Export CSV/Excel', 'Rapport fiscal auto', 'Bot WhatsApp', 'Support 24h/7j'],
  };

  return (
    <div className="p-8 pb-32 lg:pb-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Mon Abonnement</h1>
        <p className="text-sm text-slate-500">Gérez votre plan ImmoAfrik</p>
      </div>

      {/* Plan actuel */}
      <Card className="rounded-[2rem] border-2 border-[#B8860B]/30 bg-gradient-to-br from-[#1A1A2E] to-[#252542] text-white mb-8 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Plan actuel</p>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${plan.couleur} rounded-xl flex items-center justify-center`}>
                  {plan.icon}
                </div>
                <h2 className="text-3xl font-black text-[#B8860B]">{plan.nom}</h2>
              </div>
              <p className="text-sm text-slate-400 font-medium">{plan.limites}</p>
            </div>
            <div className="text-right">
              {isGratuit ? (
                <Badge className="bg-slate-600 text-white border-none font-black">Gratuit</Badge>
              ) : (
                <div>
                  <p className="text-2xl font-black text-[#B8860B]">{plan.prix.toLocaleString()} FCFA</p>
                  <p className="text-xs text-slate-400">/ mois</p>
                </div>
              )}
              {expiration && (
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 justify-end">
                  <Calendar size={12} />
                  <span>Expire le {new Date(expiration).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Fonctionnalités incluses</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {features[planActuel].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <Check size={14} className="text-[#B8860B] shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade si starter ou pro */}
      {planActuel !== 'enterprise' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {planActuel === 'starter' && (
            <Card className="rounded-[2rem] border-2 border-[#B8860B] overflow-hidden">
              <div className="bg-[#B8860B] p-3 text-center">
                <p className="text-white font-black text-xs uppercase tracking-widest">Recommandé</p>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#B8860B] rounded-xl flex items-center justify-center text-white">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-[#1A1A2E]">Pro</h3>
                    <p className="text-sm font-black text-[#B8860B]">4 990 FCFA/mois</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4">Maisons illimitées, MoMo, PDF, Analytics...</p>
                <Button
                  onClick={() => { setShowUpgrade(true); }}
                  className="w-full bg-[#B8860B] hover:bg-[#9A700A] text-white font-black rounded-2xl"
                >
                  Passer au Pro <ArrowUpRight size={16} className="ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
          <Card className="rounded-[2rem] border border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#1A1A2E] rounded-xl flex items-center justify-center text-[#B8860B]">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="font-black text-[#1A1A2E]">Enterprise</h3>
                  <p className="text-sm font-black text-slate-500">14 990 FCFA/mois</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4">Tout inclus + multi-gestionnaire + WhatsApp bot...</p>
              <Button
                onClick={() => navigate('/tarifs')}
                variant="outline"
                className="w-full rounded-2xl font-black border-slate-200"
              >
                Voir les détails
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Renouvellement */}
      {!isGratuit && (
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-6">
            <h3 className="font-black text-[#1A1A2E] mb-4 flex items-center gap-2">
              <RefreshCw size={18} className="text-[#B8860B]" />
              Renouveler mon abonnement
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Pour renouveler, envoyez {plan.prix.toLocaleString()} FCFA via Mobile Money avec la référence :
              <span className="font-black text-[#1A1A2E] mx-1">IMMO-{planActuel.toUpperCase()}-{profile?.id?.slice(0, 6).toUpperCase()}</span>
            </p>
            <Button
              onClick={() => window.open(`https://wa.me/22900000000?text=Bonjour, je souhaite renouveler mon abonnement ImmoAfrik ${plan.nom}`, '_blank')}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-2xl flex items-center gap-2"
            >
              <MessageCircle size={16} /> Contacter sur WhatsApp
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal upgrade */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full">
            <h3 className="text-xl font-black text-[#1A1A2E] mb-2">Passer au plan Pro</h3>
            <p className="text-sm text-slate-500 mb-6">4 990 FCFA / mois — activation sous 2h</p>
            <div className="space-y-4 mb-6">
              {[
                'Envoyez 4 990 FCFA via Mobile Money',
                `Référence : IMMO-PRO-${profile?.email?.split('@')[0]?.toUpperCase()}`,
                'Envoyez la capture sur WhatsApp',
                'Votre compte Pro est activé sous 2h',
              ].map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 bg-[#B8860B] text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">{i + 1}</div>
                  <p className="text-sm text-slate-600 font-medium pt-0.5">{s}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#1A1A2E] rounded-2xl p-4 text-center mb-6">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Numéro MoMo</p>
              <p className="text-2xl font-black text-[#B8860B]">+229 XX XX XX XX</p>
              <p className="text-xs text-slate-400 mt-1">MTN / Orange / Wave / Moov</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => window.open('https://wa.me/22900000000', '_blank')}
                className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-2xl"
              >
                <MessageCircle size={16} className="mr-2" /> WhatsApp
              </Button>
              <Button variant="outline" onClick={() => setShowUpgrade(false)} className="flex-1 rounded-2xl">Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

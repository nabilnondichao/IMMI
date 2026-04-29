import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Building2, Crown, ArrowLeft, Phone, MessageCircle } from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    nom: 'Starter',
    prix: 0,
    devise: 'FCFA',
    periode: 'Gratuit pour toujours',
    icon: <Building2 size={28} />,
    couleur: 'bg-slate-800',
    badge: null,
    features: [
      'Jusqu\'à 2 maisons',
      'Jusqu\'à 10 unités',
      'Paiements cash uniquement',
      'Reçus PDF basiques',
      'Dashboard basique',
      'Gestion locataires (limité)',
    ],
    limitations: [
      'Pas de Mobile Money',
      'Pas d\'upload de contrats',
      'Pas d\'analytiques avancées',
      'Pas de codes invitation',
    ],
  },
  {
    id: 'pro',
    nom: 'Pro',
    prix: 4990,
    devise: 'FCFA',
    periode: 'par mois',
    icon: <Zap size={28} />,
    couleur: 'bg-[#B8860B]',
    badge: 'Le plus populaire',
    features: [
      'Maisons illimitées',
      'Unités illimitées',
      'Mobile Money (MTN, Orange, Wave, Moov)',
      'Reçus PDF automatiques',
      'Upload contrats PDF',
      'Analytiques complètes',
      'Codes invitation locataires',
      'Avances loyer / eau / électricité',
      'Gestion AIRBNB + longue durée',
      'Notifications en temps réel',
      'Support par email',
    ],
    limitations: [],
  },
  {
    id: 'enterprise',
    nom: 'Enterprise',
    prix: 14990,
    devise: 'FCFA',
    periode: 'par mois',
    icon: <Crown size={28} />,
    couleur: 'bg-[#1A1A2E]',
    badge: 'Tout inclus',
    features: [
      'Tout du plan Pro',
      'Multi-gestionnaire (inviter employé)',
      'Export comptable CSV / Excel',
      'Rapport fiscal automatique annuel',
      'Bot WhatsApp pour locataires',
      'OCR pièces d\'identité',
      'Tableau de bord multi-propriétés',
      'Statistiques avancées',
      'Support prioritaire 24h/7j',
      'Formation personnalisée',
    ],
    limitations: [],
  },
];

const MOMO_NUMEROS = {
  pro: { numero: '+229 XX XX XX XX', nom: 'ImmoAfrik Pro', reference: 'IMMO-PRO' },
  enterprise: { numero: '+229 XX XX XX XX', nom: 'ImmoAfrik Enterprise', reference: 'IMMO-ENT' },
};

export default function TarifsPage() {
  const navigate = useNavigate();
  const [planChoisi, setPlanChoisi] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#1A1A2E] text-white py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8860B]/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
        >
          <ArrowLeft size={16} /> Accueil
        </button>
        <div className="relative z-10">
          <span className="text-[#B8860B] font-black uppercase tracking-widest text-xs">ImmoAfrik</span>
          <h1 className="text-4xl md:text-5xl font-black mt-3 mb-4">Nos tarifs simples</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Gérez votre patrimoine immobilier en Afrique avec des outils professionnels. Commencez gratuitement, évoluez selon vos besoins.
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-[2rem] shadow-sm border-2 overflow-hidden transition-all hover:shadow-lg ${
                plan.id === 'pro' ? 'border-[#B8860B] scale-105 shadow-[#B8860B]/20 shadow-lg' : 'border-slate-100'
              }`}
            >
              {plan.badge && (
                <div className={`${plan.couleur} text-white text-center py-2 text-[10px] font-black uppercase tracking-widest`}>
                  {plan.badge}
                </div>
              )}

              <div className="p-8">
                <div className={`w-14 h-14 ${plan.couleur} text-white rounded-2xl flex items-center justify-center mb-4`}>
                  {plan.icon}
                </div>
                <h2 className="text-2xl font-black text-[#1A1A2E]">{plan.nom}</h2>
                <div className="mt-3 mb-6">
                  {plan.prix === 0 ? (
                    <p className="text-3xl font-black text-[#1A1A2E]">Gratuit</p>
                  ) : (
                    <div>
                      <span className="text-4xl font-black text-[#1A1A2E]">{plan.prix.toLocaleString()}</span>
                      <span className="text-slate-400 font-bold ml-2">FCFA / mois</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{plan.periode}</p>
                </div>

                <button
                  onClick={() => {
                    if (plan.id === 'starter') {
                      navigate('/auth/inscription');
                    } else {
                      setPlanChoisi(plan.id);
                    }
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all mb-8 ${
                    plan.id === 'pro'
                      ? 'bg-[#B8860B] text-white hover:bg-[#9A700A]'
                      : plan.id === 'enterprise'
                      ? 'bg-[#1A1A2E] text-white hover:bg-[#252542]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {plan.id === 'starter' ? 'Commencer gratuitement' : `Passer au ${plan.nom}`}
                </button>

                <div className="space-y-3">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} className="text-green-600" />
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{f}</span>
                    </div>
                  ))}
                  {plan.limitations.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 opacity-40">
                      <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-slate-400 text-xs font-black">✕</span>
                      </div>
                      <span className="text-sm text-slate-400 font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Paiement */}
        <div className="mt-16 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-[#1A1A2E] mb-6">Comment payer votre abonnement ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#B8860B]/10 rounded-2xl flex items-center justify-center shrink-0">
                <Phone size={20} className="text-[#B8860B]" />
              </div>
              <div>
                <p className="font-black text-slate-800 text-sm">Mobile Money</p>
                <p className="text-xs text-slate-500 mt-1">MTN, Orange, Wave, Moov — envoyez directement sur notre numéro avec votre référence.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                <MessageCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-black text-slate-800 text-sm">WhatsApp</p>
                <p className="text-xs text-slate-500 mt-1">Contactez-nous sur WhatsApp après votre paiement pour une activation rapide.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal instruction paiement */}
      {planChoisi && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black text-[#1A1A2E] mb-2">
              Abonnement {planChoisi === 'pro' ? 'Pro — 4 990 FCFA' : 'Enterprise — 14 990 FCFA'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">Suivez ces étapes pour activer votre abonnement :</p>

            <div className="space-y-4 mb-6">
              {[
                { n: '1', txt: `Envoyez ${planChoisi === 'pro' ? '4 990' : '14 990'} FCFA via Mobile Money au numéro ci-dessous` },
                { n: '2', txt: 'Utilisez comme motif/référence : IMMO-' + planChoisi.toUpperCase() + '-[VOTRE_EMAIL]' },
                { n: '3', txt: 'Envoyez la capture de confirmation sur WhatsApp' },
                { n: '4', txt: 'Votre compte est activé sous 2h maximum' },
              ].map(s => (
                <div key={s.n} className="flex gap-3 items-start">
                  <div className="w-7 h-7 bg-[#B8860B] text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">{s.n}</div>
                  <p className="text-sm text-slate-600 font-medium pt-0.5">{s.txt}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#1A1A2E] rounded-2xl p-4 text-center mb-6">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Numéro MoMo ImmoAfrik</p>
              <p className="text-2xl font-black text-[#B8860B]">+229 XX XX XX XX</p>
              <p className="text-xs text-slate-400 mt-1">MTN / Orange / Wave / Moov</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.open('https://wa.me/22900000000?text=Bonjour, je viens de payer mon abonnement ImmoAfrik ' + planChoisi.toUpperCase(), '_blank')}
                className="flex-1 bg-[#25D366] text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
              <button
                onClick={() => setPlanChoisi(null)}
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

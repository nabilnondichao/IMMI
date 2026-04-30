import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Percent, Wallet, Zap, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EXEMPLES = [
  { loyer: 25000, label: 'Chambre simple' },
  { loyer: 50000, label: 'Chambre salon' },
  { loyer: 100000, label: 'Appartement' },
  { loyer: 150000, label: 'Boutique' },
];

const AVANTAGES = [
  'Inscription et utilisation gratuite',
  'Maisons et unités illimitées',
  'Mobile Money (MTN, Orange, Wave, Moov)',
  'Suivi arriérés et paiements',
  'Contrats PDF, reçus automatiques',
  'Gestion des dépenses et actifs',
  'Locataires avec espace dédié',
  'Analytiques et rapports complets',
  'Gestionnaires (inviter un employé)',
  'Support WhatsApp',
];

export default function TarifsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#1A1A2E] text-white py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8860B]/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
        >
          <ArrowLeft size={16} /> Accueil
        </button>
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="text-[#B8860B] font-black uppercase tracking-widest text-xs">Modèle simple et transparent</span>
          <h1 className="text-4xl md:text-6xl font-black mt-3 mb-4">
            Gratuit. <br />
            <span className="text-[#B8860B]">3,5%</span> par loyer perçu.
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Aucun abonnement fixe. ImmoAfrik perçoit uniquement une petite commission sur chaque loyer que vous confirmez — vous ne payez que quand vous encaissez.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">

        {/* Principe */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <Zap size={28} className="text-[#B8860B]" />, titre: 'Inscription gratuite', desc: 'Créez votre compte et commencez à gérer vos biens immédiatement, sans payer.' },
            { icon: <Percent size={28} className="text-[#B8860B]" />, titre: '3,5% de commission', desc: 'Pour chaque loyer confirmé sur la plateforme, ImmoAfrik prend 3,5%. Rien d\'autre.' },
            { icon: <Wallet size={28} className="text-[#B8860B]" />, titre: 'Paiement via MoMo', desc: 'Réglez votre commission mensuelle via Mobile Money directement depuis votre dashboard.' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 text-center">
              <div className="w-14 h-14 bg-[#B8860B]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                {item.icon}
              </div>
              <h3 className="font-black text-[#1A1A2E] text-lg mb-3">{item.titre}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Simulateur */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <h2 className="text-xl font-black text-[#1A1A2E] mb-2">Simulateur de commission</h2>
          <p className="text-sm text-slate-500 mb-6">Ce que vous payez selon le montant de vos loyers perçus par mois</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EXEMPLES.map((ex) => (
              <div key={ex.loyer} className="bg-slate-50 rounded-2xl p-5 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{ex.label}</p>
                <p className="text-lg font-black text-[#1A1A2E]">{ex.loyer.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mb-3">FCFA/mois</p>
                <div className="h-px bg-slate-200 mb-3" />
                <p className="text-xs font-medium text-slate-500">Commission</p>
                <p className="text-xl font-black text-[#B8860B]">{Math.round(ex.loyer * 3.5 / 100).toLocaleString()}</p>
                <p className="text-[10px] text-[#B8860B]">FCFA</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            Commission calculée uniquement sur les paiements <strong>confirmés</strong> — pas sur les paiements en attente.
          </p>
        </div>

        {/* Ce qui est inclus */}
        <div className="bg-[#1A1A2E] rounded-[2rem] p-8 text-white">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <CheckCircle2 size={22} className="text-[#B8860B]" /> Tout est inclus — aucune fonctionnalité cachée
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AVANTAGES.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-[#B8860B]/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 size={12} className="text-[#B8860B]" />
                </div>
                <span className="text-sm text-slate-300 font-medium">{a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <h2 className="text-xl font-black text-[#1A1A2E] mb-6">Questions fréquentes</h2>
          <div className="space-y-5">
            {[
              { q: 'Quand est-ce que je paie la commission ?', r: 'La commission est calculée à la fin de chaque mois, uniquement sur les paiements que vous avez confirmés. Vous recevez un récapitulatif et payez via Mobile Money.' },
              { q: 'Que se passe-t-il si je ne confirme pas de paiements ce mois ?', r: 'Rien. Si vous n\'avez pas confirmé de paiement, vous ne payez rien. Gratuit complet.' },
              { q: 'Les avances, cautions et dépenses sont-elles incluses dans la commission ?', r: 'Non. La commission de 3,5% s\'applique uniquement sur les loyers confirmés. Les cautions, avances et dépenses ne sont pas soumises à commission.' },
              { q: 'Puis-je utiliser ImmoAfrik pour mes locataires aussi ?', r: 'Oui. Vos locataires ont un espace gratuit dédié pour envoyer leurs preuves de paiement et suivre leur historique. Leur inscription est entièrement gratuite.' },
            ].map((faq, i) => (
              <div key={i} className="border-b border-slate-100 pb-5">
                <p className="font-black text-[#1A1A2E] mb-2">{faq.q}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{faq.r}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-6">
          <h3 className="text-2xl font-black text-[#1A1A2E] mb-3">Prêt à simplifier votre gestion ?</h3>
          <p className="text-slate-500 mb-6">Inscription gratuite, sans carte bancaire requise.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth/inscription"
              className="px-8 py-4 bg-[#B8860B] text-white rounded-2xl font-black flex items-center gap-2 hover:bg-[#9A700A] transition-all">
              Créer mon compte <ArrowRight size={18} />
            </Link>
            <button
              onClick={() => window.open('https://wa.me/22900000000?text=Bonjour ImmoAfrik, je souhaite en savoir plus sur la plateforme.', '_blank')}
              className="px-8 py-4 bg-[#25D366] text-white rounded-2xl font-black flex items-center gap-2 hover:bg-[#128C7E] transition-all">
              <MessageCircle size={18} /> Nous contacter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Building2, ShieldCheck, Wallet, History, Users, ArrowRight, LayoutDashboard, Menu, X, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const PAYS_COUVERTS = [
  '🇧🇯 Bénin', "🇨🇮 Côte d'Ivoire", '🇸🇳 Sénégal', '🇹🇬 Togo',
  '🇧🇫 Burkina Faso', '🇲🇱 Mali', '🇳🇪 Niger', '🇬🇳 Guinée',
  '🇬🇭 Ghana', '🇳🇬 Nigeria', '🇸🇱 Sierra Leone', '🇱🇷 Liberia',
  '🇬🇲 Gambie', '🇬🇼 Guinée-Bissau', '🇲🇷 Mauritanie', '🇨🇻 Cap-Vert',
];

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const stats = [
    { label: 'Propriétaires', value: '500+' },
    { label: 'Pays couverts', value: '16' },
    { label: 'Unités gérées', value: '50k+' },
    { label: 'Revenus gérés', value: '2B+' },
  ];

  const features = [
    {
      title: 'Suivi des Arriérés',
      desc: 'Notifications automatiques dès qu’un loyer dépasse sa date d’échéance.',
      icon: <History className="text-[#B8860B]" size={24} />
    },
    {
      title: 'Validation Mobile Money',
      desc: 'Réconciliation instantanée des reçus MTN, Orange, Moov et Wave.',
      icon: <Wallet className="text-[#B8860B]" size={24} />
    },
    {
      title: 'Contrats Dématérialisés',
      desc: 'Générez des contrats conformes aux lois locales en quelques clics.',
      icon: <ShieldCheck className="text-[#B8860B]" size={24} />
    },
    {
      title: 'Multi-Propriétés',
      desc: 'Vue d’ensemble sur l’ensemble de votre parc immobilier, où qu’il soit.',
      icon: <Building2 className="text-[#B8860B]" size={24} />
    },
    {
      title: 'Accès Locataires',
      desc: 'Un espace dédié pour que vos locataires envoient leurs preuves de paiement.',
      icon: <Users className="text-[#B8860B]" size={24} />
    },
    {
      title: 'Outils Analytics',
      desc: 'Calculez votre rentabilité nette et suivez vos dépenses de maintenance.',
      icon: <LayoutDashboard className="text-[#B8860B]" size={24} />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#1A1A2E]/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#B8860B] rounded-lg flex items-center justify-center font-bold text-white text-xl">IA</div>
            <span className="text-white font-bold text-lg md:text-xl tracking-tight">Immo<span className="text-[#B8860B]">Afrik</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-[#B8860B] transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-[#B8860B] transition-colors">Tarifs</a>
            <Link to="/auth/connexion" className="hover:text-white transition-colors">Connexion</Link>
            <Link to="/auth/inscription" className="bg-[#B8860B] text-white px-5 py-2.5 rounded-full hover:bg-opacity-90 transition-all font-bold">
              Commencer gratuitement
            </Link>
          </div>

          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-[#1A1A2E] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              Gérez tous vos biens <br />
              <span className="text-[#B8860B]">immobilier</span> depuis un seul endroit.
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-lg">
              La plateforme de gestion locative pour l'Afrique de l'Ouest. Bénin, Sénégal, Côte d'Ivoire, Ghana, Nigeria et 11 autres pays. Loyers, Mobile Money, contrats — tout en un.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth/inscription" className="px-8 py-4 bg-[#B8860B] rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform group">
                Commencer gratuitement
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/demo" className="px-8 py-4 bg-white/10 rounded-xl font-bold border border-white/20 hover:bg-white/20 transition-all">
                Voir la démo
              </Link>
            </div>
          </motion.div>
          
          <div className="relative">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              <img 
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200" 
                alt="Architecture moderne Afrique" 
                className="w-full h-auto"
              />
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#B8860B]/10 blur-[120px] -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-black text-[#1A1A2E] mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-[#B8860B] uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-[#1A1A2E] mb-6 tracking-tight">
            Résolvez vos problèmes de gestion
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto italic">
            Conçue pour répondre aux défis spécifiques de l'immobilier en Afrique de l'Ouest et Centrale.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all group"
            >
              <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:bg-[#B8860B] transition-colors group-hover:text-white group-hover:shadow-[#B8860B]/20">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-4">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <p className="text-[#B8860B] font-black uppercase tracking-widest text-xs mb-4">Modèle transparent</p>
          <h2 className="text-3xl md:text-5xl font-black mb-6">Gratuit pour commencer.<br />3,5% seulement quand vous encaissez.</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-16 text-lg">
            Pas d'abonnement mensuel. Pas de frais cachés. ImmoAfrik prend uniquement <strong className="text-[#B8860B]">3,5%</strong> sur chaque loyer confirmé — vous ne payez que quand vous gagnez.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Inscription', value: 'Gratuite', sub: 'Pour toujours' },
              { label: 'Commission', value: '3,5%', sub: 'Par loyer confirmé' },
              { label: 'Abonnement', value: '0 FCFA', sub: 'Aucun forfait fixe' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3">{item.label}</p>
                <p className="text-5xl font-black text-[#B8860B] mb-2">{item.value}</p>
                <p className="text-slate-400 text-sm font-medium">{item.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-[#B8860B]/30 rounded-3xl p-8 max-w-2xl mx-auto mb-10">
            <p className="font-black text-white text-lg mb-4">Exemple concret</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-white">50 000</p>
                <p className="text-xs text-slate-400 mt-1">FCFA loyer perçu</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[#B8860B] font-black text-2xl">→</span>
              </div>
              <div>
                <p className="text-2xl font-black text-[#B8860B]">1 750</p>
                <p className="text-xs text-slate-400 mt-1">FCFA commission (3,5%)</p>
              </div>
            </div>
          </div>

          <Link to="/auth/inscription" className="inline-flex items-center gap-3 px-10 py-5 bg-[#B8860B] rounded-2xl font-black text-lg hover:bg-[#9A700A] transition-all hover:scale-105">
            Créer mon compte gratuitement <ArrowRight size={22} />
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8860B]/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#B8860B]/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </section>

      {/* Pays couverts */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Globe size={20} className="text-[#B8860B]" />
            <p className="text-xs font-black text-[#B8860B] uppercase tracking-widest">Disponible dans toute l'Afrique de l'Ouest</p>
          </div>
          <h2 className="text-2xl font-black text-[#1A1A2E] mb-8">16 pays · Multi-devises · MoMo local</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {PAYS_COUVERTS.map((pays, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-sm font-bold text-slate-700 hover:border-[#B8860B]/30 hover:bg-[#B8860B]/5 transition-all"
              >
                {pays}
              </motion.span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-6">FCFA · GH₵ · ₦ · GNF · Le et plus — chaque pays avec ses opérateurs MoMo locaux</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A2E] text-slate-400 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#B8860B] rounded flex items-center justify-center font-bold text-white uppercase">IA</div>
              <span className="text-white font-bold text-xl tracking-tighter">ImmoAfrik</span>
            </div>
            <p className="text-sm italic leading-relaxed mb-6">
              Simplifiez la gestion de vos revenus locatifs en Afrique grâce à une technologie adaptée à vos réalités.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div>
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Produit</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white">Tarifs</a></li>
                <li><a href="#" className="hover:text-white">Mobile Money</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Support</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Aide</a></li>
                <li><a href="#" className="hover:text-white">Tutoriels</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Légal</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white">Conditions</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-white/5 text-xs text-center md:text-left">
          &copy; {new Date().getFullYear()} ImmoAfrik. Tous droits réservés. Built with trust in West Africa.
        </div>
      </footer>
    </div>
  );
}

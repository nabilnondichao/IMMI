import { Building2, ShieldCheck, Wallet, History, Users, ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const stats = [
    { label: 'Propriétaires', value: '500+' },
    { label: 'Pays', value: '8' },
    { label: 'Unités gérées', value: '50k+' },
    { label: 'FCFA collectés', value: '2B+' },
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
              Essai Gratuit
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
              La première plateforme de gestion locative pensée exclusivement pour le marché immobilier en Afrique. Centralisez loyers, contrats et maintenance.
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
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-16 underline decoration-[#B8860B] decoration-8 underline-offset-8">Nos Forfaits</h2>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="p-10 rounded-[2.5rem] bg-white text-slate-900 border-4 border-slate-200">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Idéal pour débuter</div>
              <h3 className="text-3xl font-black mb-6">Starter</h3>
              <div className="text-5xl font-black mb-4">5.000 <span className="text-lg">FCFA/mois</span></div>
              <ul className="space-y-4 mb-10 text-slate-500 font-medium">
                <li className="flex items-center gap-3">✓ Jusqu'à 10 unités</li>
                <li className="flex items-center gap-3">✓ Suivi des arriérés</li>
                <li className="flex items-center gap-3">✓ Support standard</li>
              </ul>
              <Link to="/auth/inscription" className="w-full block py-4 text-center rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">Choisir Starter</Link>
            </div>

            {/* Pro */}
            <div className="p-10 rounded-[2.5rem] bg-[#B8860B] text-white shadow-2xl shadow-[#B8860B]/20 transform md:scale-105">
              <div className="text-xs font-black uppercase tracking-widest text-amber-200 mb-2">Recommandé</div>
              <h3 className="text-3xl font-black mb-6">Pro</h3>
              <div className="text-5xl font-black mb-4">15.000 <span className="text-lg">FCFA/mois</span></div>
              <ul className="space-y-4 mb-10 font-medium text-amber-50">
                <li className="flex items-center gap-3">✓ Unités illimitées</li>
                <li className="flex items-center gap-3">✓ Analytics avancés</li>
                <li className="flex items-center gap-3">✓ Gestion des dépenses</li>
                <li className="flex items-center gap-3">✓ Priorité support</li>
              </ul>
              <Link to="/auth/inscription" className="w-full block py-4 text-center rounded-2xl bg-[#1A1A2E] text-white font-bold hover:bg-opacity-90 transition-all shadow-lg">Devenir Pro</Link>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8860B]/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#B8860B]/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
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

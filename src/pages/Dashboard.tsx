import { 
  PROPRIETAIRES, 
  MAISONS, 
  UNITES, 
  LOCATAIRES, 
  PAIEMENTS, 
  getTotalArrieres 
} from '../lib/mock-data';
import { StatutPaiement } from '../types/immoafrik';
import { Building2, Users, Receipt, AlertCircle, Home, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const admin = PROPRIETAIRES[0];
  const housesCount = MAISONS.filter(m => m.proprietaire_id === admin.id).length;
  const tenantsCount = LOCATAIRES.length;
  const pendingPayments = PAIEMENTS.filter(p => p.statut === StatutPaiement.EN_ATTENTE).length;
  
  const totalDebt = LOCATAIRES.reduce((acc, loc) => acc + getTotalArrieres(loc.id), 0);

  const handleLogout = () => {
    navigate('/auth/connexion');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">ImmoGestion Dashboard</h1>
          <p className="text-slate-500">Bienvenue, {admin.prenom} {admin.nom} ({admin.code_unique})</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-amber-100 text-[#B8860B] rounded-full text-xs font-bold uppercase tracking-widest border border-amber-200">
              {admin.abonnement.plan}
            </span>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700">{admin.pays}</p>
              <p className="text-[10px] text-slate-400">Expiration: {admin.abonnement.date_expiration}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
            title="Déconnexion"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-2 text-blue-600">
            <Building2 size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Maisons</span>
          </div>
          <div className="text-3xl font-bold text-[#1A1A2E]">{housesCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Actif</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-2 text-purple-600">
            <Users size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Locataires</span>
          </div>
          <div className="text-3xl font-bold text-[#1A1A2E]">{tenantsCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Contrats actifs</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-2 text-amber-600">
            <Receipt size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">MoMo En Cours</span>
          </div>
          <div className="text-3xl font-bold text-[#1A1A2E]">{pendingPayments}</div>
          <p className="text-[10px] text-slate-400 mt-1 text-amber-600">Validation nécessaire</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 bg-red-50/10">
          <div className="flex items-center gap-4 mb-2 text-red-600">
            <AlertCircle size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Dettes Clients</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{totalDebt.toLocaleString()} FCFA</div>
          <p className="text-[10px] text-red-400 mt-1 italic tracking-tighter">Action requise</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Liste des Maisons */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[#1A1A2E] text-sm uppercase tracking-wider">
              <Home size={16} className="text-[#B8860B]" />
              Patrimoine Immobilier
            </div>
            <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Ajouter</button>
          </div>
          <div className="divide-y divide-slate-50">
            {MAISONS.slice(0, 5).map(maison => (
              <div key={maison.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm group-hover:text-[#B8860B] transition-colors">{maison.nom}</h3>
                  <p className="text-xs text-slate-500">{maison.adresse}, {maison.ville}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold bg-[#1A1A2E] text-white px-2 py-0.5 rounded leading-none">
                    {UNITES.filter(u => u.maison_id === maison.id).length} U
                  </span>
                </div>
              </div>
            ))}
            <div className="p-4 text-center">
              <button className="text-xs text-slate-400 font-bold uppercase tracking-widest hover:text-[#B8860B]">Afficher tout le portefeuille</button>
            </div>
          </div>
        </section>

        {/* Locataires avec Alertes */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-red-50/30 border-b border-red-100 flex items-center gap-2 font-bold text-red-700 text-sm uppercase tracking-wider">
            <AlertCircle size={16} />
            Alertes de paiement
          </div>
          <div className="divide-y divide-slate-50">
            {LOCATAIRES.filter(l => getTotalArrieres(l.id) > 0).map(loc => (
              <div key={loc.id} className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{loc.prenom} {loc.nom}</h3>
                  <p className="text-[10px] text-slate-400 font-mono italic">{loc.telephone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">-{getTotalArrieres(loc.id).toLocaleString()} FCFA</p>
                  <p className="text-[9px] font-black text-red-300 uppercase tracking-widest">En contentieux</p>
                </div>
              </div>
            ))}
            {PAIEMENTS.filter(p => p.statut === StatutPaiement.EN_ATTENTE).map(p => {
              const loc = LOCATAIRES.find(l => l.id === p.locataire_id);
              return (
                <div key={p.id} className="p-4 flex justify-between items-center bg-amber-50/50">
                  <div>
                    <h3 className="font-semibold text-amber-900 text-sm">{loc?.prenom} {loc?.nom}</h3>
                    <p className="text-[10px] text-amber-600/80 font-bold">REÇU MOBILE MONEY : {p.operateur_momo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-700">{p.montant.toLocaleString()} FCFA</p>
                    <button className="text-[9px] font-black bg-amber-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-amber-700 transition-colors uppercase tracking-widest">
                      Confirmer
                    </button>
                  </div>
                </div>
              );
            })}
            {LOCATAIRES.filter(l => getTotalArrieres(l.id) === 0).length === LOCATAIRES.length && (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-400 italic">Aucune alerte critique en cours.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

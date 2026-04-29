/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  Receipt, 
  CreditCard, 
  FileText, 
  Wallet, 
  BarChart3, 
  Settings, 
  LayoutDashboard, 
  LogOut, 
  Bell, 
  Search, 
  User,
  Menu,
  X,
  BellRing
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PROPRIETAIRES, PAIEMENTS, CONTRATS, NOTIFICATIONS } from '@/lib/mock-data';
import { StatutPaiement, StatutContrat } from '@/types/immoafrik';
import NotificationCenter from './notifications/NotificationCenter';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isNotifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const admin = PROPRIETAIRES[0];
  const pendingPaymentsCount = PAIEMENTS.filter(p => p.statut === StatutPaiement.EN_ATTENTE).length;

  const unreadNotifsCount = NOTIFICATIONS.filter(n => !n.lu).length;

  const contractAlertsCount = CONTRATS.filter(c => {
    const daysToExpiry = Math.floor((new Date(c.date_fin).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return c.statut === StatutContrat.ACTIF && daysToExpiry <= 30 && daysToExpiry > 0;
  }).length;

  const sidebarItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', path: '/dashboard' },
    { icon: <Home size={20} />, label: 'Mes maisons', path: '/dashboard/maisons' },
    { icon: <Users size={20} />, label: 'Locataires', path: '/dashboard/locataires' },
    { icon: <Receipt size={20} />, label: 'Paiements', path: '/dashboard/paiements', alert: pendingPaymentsCount },
    { icon: <FileText size={20} />, label: 'Contrats', path: '/dashboard/contrats', alert: contractAlertsCount, alertColor: 'bg-amber-500' },
    { icon: <CreditCard size={20} />, label: 'Dépenses', path: '/dashboard/depenses' },
    { icon: <BarChart3 size={20} />, label: 'Impôts', path: '/dashboard/impots' },
    { icon: <Wallet size={20} />, label: 'Paramètres MoMo', path: '/dashboard/momo' },
    { icon: <BellRing size={20} />, label: 'Alertes', path: '/dashboard/alertes' },
    { icon: <Settings size={20} />, label: 'Abonnement', path: '/dashboard/abonnement' },
  ];

  const currentItem = sidebarItems.find(item => location.pathname === item.path) || sidebarItems[0];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* SIDEBAR - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1A2E] text-white transition-transform duration-300 transform hidden lg:block">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#B8860B] rounded flex items-center justify-center font-bold">IA</div>
          <span className="text-xl font-black tracking-tighter">Immo<span className="text-[#B8860B]">Afrik</span></span>
        </div>
        
        <nav className="mt-6 px-4">
          <ul className="space-y-1">
            {sidebarItems.map((item, i) => (
              <li key={i}>
                <button 
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-[#B8860B] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 font-semibold text-sm">
                    {item.icon}
                    {item.label}
                  </div>
                  {item.alert && item.alert > 0 && (
                    <span className={`${item.alertColor || 'bg-red-500'} text-white text-[10px] font-black px-1.5 py-0.5 rounded-full inline-block`}>
                      {item.alert}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-8 w-full px-8">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-slate-500 hover:text-red-400 transition-colors text-sm font-bold"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* MOBILE NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A2E] border-t border-white/10 px-6 py-3 flex justify-between items-center">
        {sidebarItems.slice(0, 5).map((item, i) => (
          <button 
            key={i} 
            onClick={() => navigate(item.path)}
            className={`${location.pathname === item.path ? 'text-[#B8860B]' : 'text-slate-400'}`}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-64">
        {/* HEADER */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <NotificationCenter isOpen={isNotifOpen} onClose={() => setNotifOpen(false)} />
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 hidden md:flex">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Rechercher..." className="bg-transparent border-none focus:outline-none text-sm w-64" />
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setNotifOpen(true)}
              className="relative p-2 text-slate-400 hover:text-[#1A1A2E] transition-all hover:bg-slate-50 rounded-xl"
            >
              <Bell size={22} />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#1A1A2E] uppercase tracking-tight">{admin.prenom} {admin.nom}</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest leading-none">Plan {admin.abonnement.plan}</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-[#1A1A2E] rounded-full border-2 border-[#B8860B]/20 flex items-center justify-center text-white font-bold overflow-hidden shadow-inner uppercase tracking-tighter text-xs">
                {admin.prenom[0]}{admin.nom[0]}
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

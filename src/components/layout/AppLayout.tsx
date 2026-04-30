/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Home,
  Receipt,
  FileText,
  CreditCard,
  BarChart3,
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Wallet,
  BellRing,
  Users,
  TrendingUp,
  Landmark,
  MessageCircle,
  Percent,
  Shield,
  UserCog,
  ShieldCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingPaiements, useContrats } from '@/hooks/useData';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import MobileNav from './MobileNav';

interface AppLayoutProps {
  children: React.ReactNode;
  userType: 'proprietaire' | 'locataire';
}

export default function AppLayout({ children, userType }: AppLayoutProps) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { pendingPaiements } = usePendingPaiements();
  const { contrats } = useContrats();

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const pendingPaymentsCount = pendingPaiements?.length || 0;
  const contractAlertsCount = contrats.filter(c => {
    const daysToExpiry = Math.floor((new Date(c.date_fin).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return c.statut === 'actif' && daysToExpiry <= 30 && daysToExpiry > 0;
  }).length;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const ownerItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Home size={20} />, label: 'Mes maisons', path: '/dashboard/maisons' },
    { icon: <Users size={20} />, label: 'Locataires', path: '/dashboard/locataires' },
    { icon: <Receipt size={20} />, label: 'Paiements', path: '/dashboard/paiements', alert: pendingPaymentsCount },
    { icon: <FileText size={20} />, label: 'Contrats', path: '/dashboard/contrats', alert: contractAlertsCount, alertColor: 'bg-amber-500' },
    { icon: <CreditCard size={20} />, label: 'Dépenses', path: '/dashboard/depenses' },
    { icon: <Landmark size={20} />, label: 'Actifs', path: '/dashboard/actifs' },
    { icon: <TrendingUp size={20} />, label: 'Analytiques', path: '/dashboard/analytics' },
    { icon: <BarChart3 size={20} />, label: 'Impôts', path: '/dashboard/impots' },
    { icon: <Wallet size={20} />, label: 'MoMo', path: '/dashboard/momo' },
    { icon: <MessageCircle size={20} />, label: 'Messages WA', path: '/dashboard/messages' },
    { icon: <Percent size={20} />, label: 'Commission', path: '/dashboard/commission' },
    { icon: <Shield size={20} />, label: 'Cautions', path: '/dashboard/cautions' },
    { icon: <UserCog size={20} />, label: 'Gestionnaires', path: '/dashboard/gestionnaires' },
    { icon: <BellRing size={20} />, label: 'Alertes', path: '/dashboard/alertes' },
    { icon: <ShieldCheck size={20} />, label: 'Super Admin', path: '/admin' },
  ];

  const sidebarItems = userType === 'proprietaire' ? ownerItems : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden lg:flex flex-col bg-[#1A1A2E] text-white fixed h-full z-40 transition-all duration-300 shadow-2xl ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-black tracking-widest text-[#B8860B] uppercase"
            >
              ImmoAfrik
            </motion.h1>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="text-white hover:bg-white/10 rounded-xl"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                location.pathname === item.path 
                  ? 'bg-[#B8860B] text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isSidebarCollapsed && (
                <span className="text-sm font-black uppercase tracking-widest flex-1 text-left">{item.label}</span>
              )}
              {!isSidebarCollapsed && item.alert && item.alert > 0 && (
                <Badge className={`${item.alertColor || 'bg-red-500'} text-white border-none min-w-5 h-5 flex items-center justify-center p-0 text-[10px]`}>
                  {item.alert}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span className="text-sm font-black uppercase tracking-widest">Quitter</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ${userType === 'locataire' ? 'lg:ml-0' : ''}`}>
        
        {/* HEADER */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-[#1A1A2E]"
            >
              <Menu size={24} />
            </Button>
            <h2 className="lg:hidden font-black text-sm uppercase tracking-widest text-[#B8860B]">ImmoAfrik</h2>
            <div className="hidden lg:flex items-center gap-3">
              <Badge className="bg-slate-100 text-slate-500 border-none font-bold">
                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setNotifOpen(true)}
              className="relative rounded-xl hover:bg-slate-50 text-[#1A1A2E]"
            >
              <Bell size={22} />
            </Button>

            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-100">
               <div className="text-right">
                 <p className="text-xs font-black text-[#1A1A2E] leading-none mb-1">
                   {profile?.prenom || 'Utilisateur'} {profile?.nom || ''}
                 </p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                   {profile?.role === 'proprietaire' ? 'Propriétaire' : 'Locataire'}
                 </p>
               </div>
               <div className="w-10 h-10 bg-[#1A1A2E] rounded-xl flex items-center justify-center font-bold text-white text-xs">
                 {profile?.prenom?.[0] || 'U'}{profile?.nom?.[0] || ''}
               </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="hidden md:flex rounded-xl hover:bg-red-50 text-red-500"
              title="Déconnexion"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className={`flex-1 ${userType === 'locataire' ? 'pb-32' : 'pb-24 lg:pb-8'}`}>
          {children}
        </main>

        {/* MOBILE BOTTOM NAV */}
        <MobileNav userType={userType} />
      </div>

      <NotificationCenter isOpen={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}

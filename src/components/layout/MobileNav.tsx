/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Home, 
  Receipt, 
  Building2, 
  BellRing, 
  Menu,
  Smartphone,
  History,
  FileText,
  User,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileNavProps {
  userType: 'proprietaire' | 'locataire';
}

export default function MobileNav({ userType }: MobileNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const ownerItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Accueil', path: '/dashboard' },
    { icon: <Building2 size={22} />, label: 'Maisons', path: '/dashboard/maisons' },
    { icon: <Receipt size={22} />, label: 'Paiements', path: '/dashboard/paiements' },
    { icon: <BellRing size={22} />, label: 'Alertes', path: '/dashboard/alertes' },
    { icon: <Menu size={22} />, label: 'Menu', path: '/dashboard/momo' },
  ];

  const tenantItems = [
    { icon: <Home size={22} />, label: 'Accueil', path: '/locataire' },
    { icon: <Smartphone size={22} />, label: 'Payer', path: '/locataire/payer' },
    { icon: <History size={22} />, label: 'Archives', path: '/locataire' },
    { icon: <FileText size={22} />, label: 'Baux', path: '/locataire' },
    { icon: <User size={22} />, label: 'Profil', path: '/locataire' },
  ];

  const items = userType === 'proprietaire' ? ownerItems : tenantItems;

  return (
    <div className="lg:hidden fixed bottom-6 left-4 right-4 bg-[#1A1A2E]/95 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl p-2 z-50">
      <div className="flex items-center justify-between px-2">
        {items.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1.5 py-2 px-3 rounded-3xl transition-all duration-300 ${
                isActive 
                  ? 'bg-[#B8860B] text-white scale-110 shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'block' : 'hidden md:block'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

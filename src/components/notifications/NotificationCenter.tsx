/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Clock, 
  Trash2, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NOTIFICATIONS, TypeNotification, Notification } from '@/lib/mock-data';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.lu).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
  };

  const getIcon = (type: TypeNotification) => {
    switch (type) {
      case TypeNotification.URGENT:
        return <AlertCircle className="text-red-500" size={20} />;
      case TypeNotification.IMPORTANT:
        return <AlertTriangle className="text-amber-500" size={20} />;
      case TypeNotification.INFO:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const handleAction = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.actionPath) {
      navigate(notif.actionPath);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell size={24} className="text-[#1A1A2E]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1A1A2E] tracking-tight">Notifications</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{unreadCount} non lues</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-slate-200">
                <X size={20} />
              </Button>
            </div>

            {/* Actions */}
            <div className="px-6 py-3 border-b border-slate-50 flex justify-between items-center bg-white">
              <Button 
                variant="ghost" 
                className="text-[10px] font-black uppercase tracking-widest text-[#B8860B] hover:bg-amber-50 h-8 rounded-lg"
                onClick={markAllRead}
              >
                Tout marquer comme lu
              </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="font-bold text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      notif.lu 
                        ? 'bg-white border-slate-100 opacity-60' 
                        : 'bg-white border-[#B8860B]/20 shadow-sm border-l-4'
                    }`}
                    style={{ borderLeftColor: notif.lu ? '' : (notif.type === TypeNotification.URGENT ? '#EF4444' : notif.type === TypeNotification.IMPORTANT ? '#F59E0B' : '#3B82F6') }}
                  >
                    <div className="flex gap-4">
                      <div className="shrink-0 pt-1">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`text-sm font-black truncate ${notif.lu ? 'text-slate-500' : 'text-[#1A1A2E]'}`}>
                            {notif.titre}
                          </h3>
                          <span className="text-[9px] font-bold text-slate-400 shrink-0 ml-2">
                             {new Date(notif.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2">
                           {notif.actionPath && (
                             <Button 
                               variant="ghost" 
                               className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-50 hover:bg-slate-100 text-[#1A1A2E]"
                               onClick={() => handleAction(notif)}
                             >
                               Voir <ChevronRight size={12} className="ml-1" />
                             </Button>
                           )}
                           {!notif.lu && (
                             <Button 
                               variant="ghost" 
                               className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#B8860B] hover:bg-amber-50"
                               onClick={() => markAsRead(notif.id)}
                             >
                               Marquer lu
                             </Button>
                           )}
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 ml-auto"
                             onClick={() => deleteNotif(notif.id)}
                           >
                             <Trash2 size={14} />
                           </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100">
               <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                 <Clock size={14} />
                 <span>Dernière mise à jour : il y a quelques secondes</span>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

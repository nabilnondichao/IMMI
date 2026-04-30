import React from 'react';
import {
  Bell, X, CheckCircle2, AlertCircle, Info,
  Clock, Trash2, ChevronRight, AlertTriangle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, NotifDB } from '@/hooks/useData';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

function getIcon(type: NotifDB['type']) {
  switch (type) {
    case 'error': return <AlertCircle className="text-red-500" size={20} />;
    case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
    case 'success': return <CheckCircle2 className="text-green-500" size={20} />;
    default: return <Info className="text-blue-500" size={20} />;
  }
}

function getBorderColor(type: NotifDB['type']) {
  switch (type) {
    case 'error': return '#EF4444';
    case 'warning': return '#F59E0B';
    case 'success': return '#10B981';
    default: return '#3B82F6';
  }
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, isLoading, refresh } = useNotifications();

  const unreadCount = notifications.filter(n => !n.lu).length;

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    refresh();
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteNotification(id);
    refresh();
  }

  async function handleAction(notif: NotifDB) {
    await handleMarkRead(notif.id);
    if (notif.action_path) {
      navigate(notif.action_path);
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />
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
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-slate-200">
                <X size={20} />
              </Button>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <div className="px-6 py-3 border-b border-slate-50 bg-white">
                <Button variant="ghost"
                  className="text-[10px] font-black uppercase tracking-widest text-[#B8860B] hover:bg-amber-50 h-8 rounded-lg"
                  onClick={handleMarkAllRead}>
                  Tout marquer comme lu
                </Button>
              </div>
            )}

            {/* Liste */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="animate-spin text-[#B8860B]" size={28} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 py-16">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-green-400" />
                  </div>
                  <p className="font-bold text-sm">Aucune notification</p>
                  <p className="text-xs text-center text-slate-300 px-4">Vous êtes à jour ! Les alertes de paiement et de contrat apparaîtront ici.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      notif.lu
                        ? 'bg-white border-slate-100 opacity-60'
                        : 'bg-white border-l-4 shadow-sm'
                    }`}
                    style={{ borderLeftColor: notif.lu ? '' : getBorderColor(notif.type) }}
                  >
                    <div className="flex gap-4">
                      <div className="shrink-0 pt-1">{getIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`text-sm font-black truncate ${notif.lu ? 'text-slate-500' : 'text-[#1A1A2E]'}`}>
                            {notif.titre}
                          </h3>
                          <span className="text-[9px] font-bold text-slate-400 shrink-0 ml-2">
                            {new Date(notif.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">{notif.message}</p>
                        <div className="flex items-center gap-2">
                          {notif.action_path && (
                            <Button variant="ghost"
                              className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-50 hover:bg-slate-100 text-[#1A1A2E]"
                              onClick={() => handleAction(notif)}>
                              Voir <ChevronRight size={12} className="ml-1" />
                            </Button>
                          )}
                          {!notif.lu && (
                            <Button variant="ghost"
                              className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#B8860B] hover:bg-amber-50"
                              onClick={() => handleMarkRead(notif.id)}>
                              Marquer lu
                            </Button>
                          )}
                          <Button variant="ghost" size="icon"
                            className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 ml-auto"
                            onClick={() => handleDelete(notif.id)}>
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
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Clock size={14} />
                <span>Rafraîchi automatiquement toutes les 30 sec</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Download, 
  User, 
  Home, 
  Smartphone, 
  Eye, 
  ShieldCheck, 
  ArrowRight,
  Printer,
  Hash,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { OperateurMoMo } from '@/types/immoafrik';

interface ConfirmationCardProps {
  payment: {
    id: string;
    locataire: string;
    maison: string;
    unite: string;
    montant: number;
    operateur: OperateurMoMo;
    reference: string;
    transactionId: string;
    date: string;
  };
  onConfirm: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export default function ConfirmationCard({ payment, onConfirm, onReject }: ConfirmationCardProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      onConfirm(payment.id);
      setIsConfirming(false);
    }, 1500);
  };

  const opColor = payment.operateur === OperateurMoMo.MTN ? 'bg-amber-400' : payment.operateur === OperateurMoMo.WAVE ? 'bg-blue-400' : 'bg-orange-500';

  return (
    <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
      <CardContent className="p-0">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${opColor} rounded-2xl flex items-center justify-center font-black text-white text-[10px]`}>
              {payment.operateur}
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-widest">{payment.operateur} MONEY</p>
              <p className="text-[10px] text-slate-400 font-bold">{payment.date}</p>
            </div>
          </div>
          <Badge className="bg-[#B8860B]/10 text-[#B8860B] border-none font-black text-[9px] px-3 py-1 rounded-full">
            EN ATTENTE
          </Badge>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Locataire</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#1A1A2E] rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {payment.locataire[0]}
                </div>
                <span className="text-sm font-black text-[#1A1A2E] tracking-tight">{payment.locataire}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant</p>
              <p className="text-xl font-black text-[#1A1A2E]">{payment.montant.toLocaleString()} FCFA</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
               <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                 <Home size={12} className="text-[#B8860B]" /> Unité
               </div>
               <p className="text-xs font-bold text-[#1A1A2E] uppercase">{payment.unite}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
               <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                 <Hash size={12} className="text-[#B8860B]" /> Référence
               </div>
               <p className="text-xs font-black text-[#1A1A2E] truncate">{payment.reference}</p>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100">
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Smartphone size={14} /> ID Transaction soumis
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-black text-amber-900">{payment.transactionId}</span>
              <button className="text-[9px] font-black bg-white/50 px-2 py-1 rounded-lg text-amber-800 hover:bg-white transition-colors">VÉRIFIER SMS</button>
            </div>
          </div>

          <div className="flex items-center gap-1 p-2 bg-blue-50/50 rounded-2xl border border-dashed border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300">
              <Download size={20} />
            </div>
            <div className="flex-1 px-2">
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Preuve (.jpg)</p>
              <p className="text-[8px] text-slate-400 font-bold">Screenshot_20240428.jpg</p>
            </div>
            <Eye size={16} className="text-blue-400 mr-2" />
          </div>
        </div>

        <div className="p-4 bg-slate-50/80 grid grid-cols-2 gap-4">
          <Dialog>
             <DialogTrigger asChild>
               <Button variant="ghost" className="rounded-2xl font-black text-xs text-red-500 hover:bg-red-50 hover:text-red-600">
                 <X size={18} className="mr-2" />
                 REJETER
               </Button>
             </DialogTrigger>
             <DialogContent className="rounded-[2.5rem]">
               <DialogHeader>
                 <DialogTitle className="font-black text-xl">Motif du rejet</DialogTitle>
                 <DialogDescription>Le locataire recevra une notification avec cette explication.</DialogDescription>
               </DialogHeader>
               <div className="py-4">
                 <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400">Pourquoi rejetez-vous ce paiement ?</Label>
                 <textarea 
                   className="w-full min-h-[100px] mt-2 rounded-2xl border border-slate-200 p-4 text-sm focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                   placeholder="Ex: Référence incorrecte, montant incomplet..."
                   value={rejectReason}
                   onChange={(e) => setRejectReason(e.target.value)}
                 />
               </div>
               <DialogFooter>
                 <Button 
                   onClick={() => onReject(payment.id, rejectReason)}
                   className="w-full bg-red-600 text-white font-black rounded-2xl py-6"
                 >
                   Confirmer le rejet
                 </Button>
               </DialogFooter>
             </DialogContent>
          </Dialog>

          <Button 
            disabled={isConfirming}
            onClick={handleConfirm}
            className="bg-[#1A1A2E] text-white rounded-2xl font-black text-xs hover:bg-black group-hover:bg-[#B8860B] transition-all"
          >
            {isConfirming ? (
              <ShieldCheck className="animate-pulse" size={18} />
            ) : (
              <>
                <Check size={18} className="mr-2" />
                CONFIRMER
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

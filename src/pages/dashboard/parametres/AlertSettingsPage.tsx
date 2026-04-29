/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Clock, 
  Settings2, 
  Save, 
  Send, 
  Smartphone,
  AlertCircle,
  CheckCircle2,
  BellRing
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROPRIETAIRES } from '@/lib/mock-data';

export default function AlertSettingsPage() {
  const proprio = PROPRIETAIRES[0];
  const [waTemplate, setWaTemplate] = useState(`Bonjour [Prénom], votre loyer de [Mois] d'un montant de [Montant] FCFA est en attente. Merci de régulariser. — ${proprio.prenom} ${proprio.nom}`);

  return (
    <div className="p-8 pb-32 lg:pb-8 max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight flex items-center gap-3">
          Configuration des Alertes
          <BellRing className="text-[#B8860B]" size={28} />
        </h1>
        <p className="text-sm text-slate-500 font-medium">Personnalisez comment et quand vous êtes notifié.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT: CHANNEL TOGGLES */}
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Canaux</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Smartphone size={18} />
                  </div>
                  <Label className="font-bold text-sm">In-App</Label>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#B8860B]/10 text-[#B8860B] rounded-xl">
                    <Mail size={18} />
                  </div>
                  <Label className="font-bold text-sm">Email</Label>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                    <MessageSquare size={18} />
                  </div>
                  <Label className="font-bold text-sm">WhatsApp</Label>
                </div>
                <Badge className="bg-green-100 text-green-600 border-none text-[8px] font-black tracking-widest uppercase">Bêta</Badge>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden border-l-4 border-amber-400">
             <CardContent className="p-6">
                <div className="flex gap-4">
                  <AlertCircle className="text-amber-500 shrink-0" size={20} />
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Les alertes WhatsApp nécessitent un abonnement <span className="font-black text-[#1A1A2E]">PRO</span> actif.
                  </p>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* RIGHT: DETAILED CONFIG */}
        <div className="md:col-span-2 space-y-8">
          
          {/* TRIGGERS & DELAYS */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-lg font-black tracking-tight">Délais & Déclencheurs</CardTitle>
              <CardDescription>Réglez la sensibilité de vos rappels automatiques.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#1A1A2E]">Relance Loyer Impayé</p>
                    <p className="text-[10px] text-slate-400 font-medium italic">Seuil de relance automatique après échéance</p>
                  </div>
                  <div className="w-32">
                    <Select defaultValue="j7">
                      <SelectTrigger className="rounded-xl font-bold text-xs h-10 border-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="j3">J + 3 jours</SelectItem>
                        <SelectItem value="j7">J + 7 jours</SelectItem>
                        <SelectItem value="j15">J + 15 jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#1A1A2E]">Alerte Fin de Contrat</p>
                    <p className="text-[10px] text-slate-400 font-medium italic">Anticipation avant la date de fin effective</p>
                  </div>
                  <div className="w-32">
                    <Select defaultValue="m1">
                      <SelectTrigger className="rounded-xl font-bold text-xs h-10 border-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="j15">15 jours</SelectItem>
                        <SelectItem value="m1">1 mois</SelectItem>
                        <SelectItem value="m2">2 mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WHATSAPP TEMPLATE */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                <MessageSquare size={20} className="text-green-500" />
                Modèle WhatsApp
              </CardTitle>
              <CardDescription>Personnalisez le message envoyé à vos locataires.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corps du message</Label>
                  <div className="flex gap-2">
                    {['[Prénom]', '[Mois]', '[Montant]'].map(tag => (
                      <span key={tag} className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter cursor-pointer hover:bg-slate-200 transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Textarea 
                  value={waTemplate}
                  onChange={(e) => setWaTemplate(e.target.value)}
                  className="rounded-2xl min-h-[120px] font-medium leading-relaxed bg-slate-50/50 border-slate-100 italic text-slate-600" 
                />
              </div>

              <div className="flex gap-4">
                 <Button variant="outline" className="flex-1 rounded-xl h-11 font-black text-xs border-slate-200 flex items-center gap-2">
                   <Send size={16} />
                   Tester l'envoi
                 </Button>
                 <Button className="flex-1 rounded-xl h-11 bg-[#1A1A2E] text-white font-black text-xs flex items-center gap-2">
                   <Save size={16} />
                   Sauvegarder
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* FINAL NOTIFICATION PREVIEW */}
      <div className="bg-slate-100/50 rounded-[3rem] p-8 border border-slate-200/50">
         <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-4">
           <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
             <CheckCircle2 size={24} />
           </div>
           <h3 className="text-xl font-black text-[#1A1A2E] tracking-tight">Vos alertes sont prêtes</h3>
           <p className="text-xs text-slate-500 font-medium">ImmoAfrik surveille désormais vos baux et paiements en temps réel selon ces paramètres.</p>
         </div>
      </div>
    </div>
  );
}

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-widest border border-current ${className}`}>
    {children}
  </span>
);

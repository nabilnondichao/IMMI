/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Smartphone, 
  Check, 
  ShieldCheck, 
  Eye, 
  Copy, 
  Save, 
  SmartphoneNfc,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { OperateurMoMo } from '@/types/immoafrik';

const OPERATORS = [
  { id: OperateurMoMo.MTN, label: 'MTN Mobile Money', color: 'bg-amber-400', iconColor: 'text-amber-600' },
  { id: OperateurMoMo.ORANGE, label: 'Orange Money', color: 'bg-orange-500', iconColor: 'text-orange-600' },
  { id: OperateurMoMo.WAVE, label: 'Wave', color: 'bg-blue-400', iconColor: 'text-blue-600' },
  { id: OperateurMoMo.MOOV, label: 'Moov Money', color: 'bg-green-500', iconColor: 'text-green-600' },
];

export default function MoMoParams() {
  const [configs, setConfigs] = useState(
    OPERATORS.reduce((acc, op) => ({
      ...acc,
      [op.id]: { enabled: op.id === OperateurMoMo.MTN, number: '', name: '' }
    }), {} as any)
  );

  const [previewOp, setPreviewOp] = useState(OperateurMoMo.MTN);

  const updateConfig = (opId: string, field: string, value: any) => {
    setConfigs((prev: any) => ({
      ...prev,
      [opId]: { ...prev[opId], [field]: value }
    }));
  };

  return (
    <div className="p-8 pb-32 lg:pb-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Paramètres Mobile Money</h1>
          <p className="text-sm text-slate-500">Configurez vos comptes de réception pour les paiements des locataires</p>
        </div>
        <Button className="bg-[#1A1A2E] text-white font-bold rounded-xl flex items-center gap-2">
          <Save size={18} />
          Sauvegarder tout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CONFIGURATION SECTION */}
        <div className="space-y-6">
          {OPERATORS.map((op) => (
            <Card key={op.id} className={`rounded-[2.5rem] border-slate-100 shadow-sm transition-all ${configs[op.id].enabled ? 'ring-2 ring-slate-100' : 'opacity-60'}`}>
              <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${op.color} rounded-2xl flex items-center justify-center font-black text-white text-xs`}>
                    {op.id}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">{op.label}</CardTitle>
                    <CardDescription className="text-[10px] font-bold">Encaissements via {op.id}</CardDescription>
                  </div>
                </div>
                <Switch 
                  checked={configs[op.id].enabled} 
                  onCheckedChange={(v) => updateConfig(op.id, 'enabled', v)}
                />
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Numéro de téléphone</Label>
                    <Input 
                      placeholder="+229 00 00 00 00" 
                      className="rounded-xl font-bold" 
                      disabled={!configs[op.id].enabled}
                      value={configs[op.id].number}
                      onChange={(e) => updateConfig(op.id, 'number', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom du compte</Label>
                    <Input 
                      placeholder="Ex: Jean DUPONT" 
                      className="rounded-xl font-bold"
                      disabled={!configs[op.id].enabled}
                      value={configs[op.id].name}
                      onChange={(e) => updateConfig(op.id, 'name', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* PREVIEW SECTION */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-[#1A1A2E] rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#B8860B]/10 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-8">
                <Eye size={20} className="text-[#B8860B]" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Aperçu Locataire</h3>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Étape : Paiement MoMo</p>
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <div className="bg-[#B8860B]/10 border border-[#B8860B]/30 rounded-2xl p-4 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#B8860B]">Instructions</span>
                        <div className={`px-2 py-1 ${OPERATORS.find(o => o.id === previewOp)?.color} rounded-lg text-[8px] font-black`}>
                          {previewOp}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-[#B8860B] rounded-full flex items-center justify-center text-[10px] shrink-0 font-black">1</div>
                          <p className="text-xs font-medium">Ouvrez votre application {previewOp} Money</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-[#B8860B] rounded-full flex items-center justify-center text-[10px] shrink-0 font-black">2</div>
                          <p className="text-xs font-medium">
                            Envoyez le montant au <span className="text-[#B8860B] font-bold">{configs[previewOp].number || 'XXXXXXXX'}</span>
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-[#B8860B] rounded-full flex items-center justify-center text-[10px] shrink-0 font-black">3</div>
                          <p className="text-xs font-medium">
                            Nom du bénéficiaire : <span className="font-bold">{configs[previewOp].name || 'NOM DU PROPRIÉTAIRE'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Référence à saisir exactement :</Label>
                       <div className="bg-white/5 border border-dashed border-white/20 p-4 rounded-xl flex items-center justify-between group">
                         <span className="font-mono text-lg font-black tracking-widest">IMMO-RES1-202504-R2-001</span>
                         <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#B8860B]">
                           <Copy size={18} />
                         </button>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
                  <p className="text-[10px] font-bold text-slate-400">Changer l'opérateur pour l'aperçu :</p>
                  <div className="flex gap-2">
                    {OPERATORS.filter(op => configs[op.id].enabled).map(op => (
                      <button 
                        key={op.id}
                        onClick={() => setPreviewOp(op.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${previewOp === op.id ? 'ring-2 ring-[#B8860B] bg-white/5' : 'bg-white/5 opacity-40'}`}
                      >
                        <div className={`w-6 h-6 ${op.color} rounded-md`}></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex gap-4">
               <Button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold py-6 text-xs gap-2">
                 <SmartphoneNfc size={18} />
                 Simuler une demande
               </Button>
               <Button className="bg-[#B8860B] text-white rounded-2xl px-6 font-bold">
                 <Zap size={18} />
               </Button>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Sécurité Garantie</p>
              <p className="text-xs text-blue-700 leading-relaxed font-medium"> Les numéros de téléphone saisis ici seront les seuls autorisés pour les paiements MoMo. Les locataires ne pourront pas valider leur preuve de paiement s'ils ne copient pas le bon code de référence.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

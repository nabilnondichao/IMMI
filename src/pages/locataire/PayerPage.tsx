/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ChevronRight, 
  Copy, 
  Smartphone, 
  CreditCard, 
  Wallet, 
  ArrowLeft, 
  X, 
  Loader2, 
  ShieldCheck, 
  SmartphoneNfc,
  AlertCircle,
  Timer,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { FileUploader } from '@/components/upload/FileUploader';
import { supabase } from '@/lib/supabase';
import { StatutPaiement, TypePaiement, OperateurMoMo } from '@/types/immoafrik';

const STEPS = ['Récapitulatif', 'Opérateur', 'Instructions', 'Confirmation'];

export default function PayerPage() {
  const [step, setStep] = useState(1);
  const [selectedOp, setSelectedOp] = useState<OperateurMoMo | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [hasPaid, setHasPaid] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const { profile, isLoading: authLoading } = useAuth();
  const { locataires, isLoading: locatairesLoading } = useLocataires();
  const { unites, isLoading: unitesLoading } = useAllUnites();
  const { maisons, isLoading: maisonsLoading } = useMaisons();
  const { paiements, isLoading: paiementsLoading } = usePaiements();

  const isLoading = authLoading || locatairesLoading || unitesLoading || maisonsLoading || paiementsLoading;

  // Get current tenant data
  const tenant = locataires.find(l => l.id === profile?.id);
  const unit = unites.find(u => u.id === tenant?.unite_id);
  const house = maisons.find(m => m.id === unit?.maison_id);
  const totalDue = unit?.loyer_mensuel || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A2E] mx-auto mb-4"></div>
        <p className="text-slate-500">Chargement de la page de paiement...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-500 font-bold">Profil locataire non trouvé.</p>
      </div>
    );
  }

  // Reference Code Generator: IMMO-${maisonCode}-${AAAAMM}-${uniteCode}-${id}
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const refCode = `IMMO-${house?.id.split('-')[1]}-${dateStr}-${unit?.nom}-${tenant.id.split('-')[1]}`.toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(refCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 5));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const submitProof = async () => {
    if (!tenant || !unit || !house) return;

    setIsSubmitting(true);
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const currentYear = currentDate.getFullYear();

      const paymentData = {
        locataire_id: tenant.id,
        unite_id: unit.id,
        maison_id: house.id,
        mois: currentMonth,
        annee: currentYear,
        montant: totalDue,
        type: TypePaiement.MOMO,
        statut: StatutPaiement.EN_ATTENTE,
        reference_immo: refCode,
        numero_transaction_momo: transactionId,
        operateur_momo: selectedOp,
        capture_ecran_url: uploadedFiles.length > 0 ? uploadedFiles[0] : null,
        date_paiement: currentDate.toISOString(),
        confirme_par_proprio: false,
        notes: `Paiement soumis par ${tenant.prenom} ${tenant.nom}`
      };

      const { error } = await supabase
        .from('paiements')
        .insert([paymentData]);

      if (error) throw error;

      setStep(5);
    } catch (error) {
      console.error('Erreur lors de la soumission du paiement:', error);
      alert('Erreur lors de la soumission. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* HEADER */}
      <div className="bg-[#1A1A2E] text-white p-6 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-white/10 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-black text-sm uppercase tracking-[0.2em]">Règlement Loyer</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8">
        {/* STEPPER */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-[#B8860B] text-white ring-4 ring-[#B8860B]/20' : 'bg-slate-200 text-slate-400'}`}>
                  {step > i + 1 ? <Check size={14} /> : i + 1}
                </div>
              </div>
            ))}
          </div>
          <Progress value={(step / 5) * 100} className="h-1 bg-slate-200" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[400px]"
          >
            {/* ETAPE 1 : RECAPITULATIF */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Montant total dû</p>
                  <h2 className="text-5xl font-black text-[#1A1A2E] tracking-tighter">
                    {totalDue.toLocaleString()} <span className="text-xl">FCFA</span>
                  </h2>
                </div>

                <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Détails de la facture</span>
                    <Badge className="bg-amber-100 text-amber-700 font-black text-[10px]">AVRIL 2025</Badge>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Loyer mensuel ({unit?.nom})</span>
                      <span className="font-bold text-[#1A1A2E]">{unit?.loyer_mensuel.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Arriérés</span>
                      <span className="font-bold text-red-500">0 FCFA</span>
                    </div>
                    <div className="h-px bg-slate-100 my-2"></div>
                    <div className="flex justify-between items-center font-black">
                      <span className="text-slate-800">TOTAL À PAYER</span>
                      <span className="text-xl text-[#1A1A2E]">{totalDue.toLocaleString()} FCFA</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-3xl flex gap-3">
                  <ShieldCheck className="text-blue-600 shrink-0" size={20} />
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">Paiement sécurisé par certificat SSL. Vos informations de transaction sont cryptées.</p>
                </div>

                <Button 
                  onClick={handleNext}
                  className="w-full bg-[#1A1A2E] text-white font-black rounded-2xl py-8 text-lg mt-8"
                >
                  Payer maintenant
                </Button>
              </div>
            )}

            {/* ETAPE 2 : CHOIX OPERATEUR */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-black text-[#1A1A2E] tracking-tight mb-8">Choisissez votre moyen de paiement</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: OperateurMoMo.MTN, label: 'MTN Mobile Money', color: 'bg-amber-400', desc: 'Frais : 0 FCFA' },
                    { id: OperateurMoMo.ORANGE, label: 'Orange Money', color: 'bg-orange-500', desc: 'Frais : 1% ' },
                    { id: OperateurMoMo.WAVE, label: 'Wave', color: 'bg-blue-400', desc: 'Frais : 0 FCFA' },
                  ].map((op) => (
                    <button 
                      key={op.id}
                      onClick={() => setSelectedOp(op.id)}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-4 ${selectedOp === op.id ? 'border-[#B8860B] bg-white shadow-xl scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                    >
                      <div className={`w-16 h-16 ${op.color} rounded-2xl flex items-center justify-center font-black text-white text-xl`}>
                        {op.id}
                      </div>
                      <div>
                        <p className="font-black text-[#1A1A2E] tracking-tight">{op.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{op.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <Button 
                  onClick={handleNext}
                  disabled={!selectedOp}
                  className="w-full bg-[#1A1A2E] text-white font-black rounded-2xl py-8 text-lg mt-8"
                >
                  Continuer avec {selectedOp || '...'}
                </Button>
              </div>
            )}

            {/* ETAPE 3 : INSTRUCTIONS */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-[#B8860B] rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                  
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <SmartphoneNfc size={20} />
                    Instructions {selectedOp}
                  </h3>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-black/20 rounded-xl flex items-center justify-center font-black text-xs shrink-0">1</div>
                      <p className="text-sm font-bold">Ouvrez votre application {selectedOp} Money</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-black/20 rounded-xl flex items-center justify-center font-black text-xs shrink-0">2</div>
                      <p className="text-sm font-bold">Envoyez <span className="text-black font-black">{totalDue.toLocaleString()} FCFA</span> au numéro :</p>
                    </div>
                    <div className="pl-12">
                      <div className="bg-black/20 p-4 rounded-2xl flex items-center justify-between border border-white/10">
                        <span className="text-xl font-black tracking-widest">+225 07 48 22 11 00</span>
                        <Copy size={20} className="text-white/50" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-white/70">Bénéficiaire : JEAN DUPONT GESTION</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-black/20 rounded-xl flex items-center justify-center font-black text-xs shrink-0">3</div>
                      <p className="text-sm font-bold">Dans le champ REFERENCE / MOTIF, tapez exactement :</p>
                    </div>
                    <div className="pl-12">
                      <div className="bg-white text-[#1A1A2E] p-6 rounded-[2rem] text-center relative group">
                        <p className="text-xl md:text-2xl font-black tracking-[0.2em]">{refCode}</p>
                        <button 
                          onClick={handleCopy}
                          className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#1A1A2E] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-transform"
                        >
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
                          {isCopied ? 'Code copié' : 'Copier le code'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 flex items-center justify-center gap-3 bg-black/10 p-4 rounded-2xl">
                    <Timer size={18} className="text-white/50" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Ce code expire dans 23:47:12</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-3xl">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <p className="text-xs text-amber-700 font-medium">NB: Si vous n'utilisez pas le code exact, votre paiement pourrait subir des retards de validation.</p>
                </div>

                <Button 
                  onClick={handleNext}
                  className="w-full bg-[#1A1A2E] text-white font-black rounded-2xl py-8 text-lg mt-8"
                >
                  J'ai effectué le paiement
                </Button>
              </div>
            )}

            {/* ETAPE 4 : CONFIRMATION PROUVE */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-black text-[#1A1A2E] tracking-tight mb-4">Soumettre votre preuve de paiement</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border border-slate-100">
                    <Checkbox id="hasPaid" checked={hasPaid} onCheckedChange={(v) => setHasPaid(!!v)} className="w-6 h-6 rounded-lg border-2 border-slate-200" />
                    <Label htmlFor="hasPaid" className="text-sm font-bold text-slate-700">Je confirme avoir effectué le transfert de {totalDue.toLocaleString()} FCFA.</Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">ID de transaction (Reçu par SMS)</Label>
                    <Input 
                      placeholder="Ex: #MTN2025061234" 
                      className="rounded-[2rem] py-6 px-6 font-bold text-lg border-2" 
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Capture d'écran (Optionnel)</Label>
                    <FileUploader
                      onUpload={setUploadedFiles}
                      accept="image/*"
                      multiple={false}
                      maxFiles={1}
                      maxSizeMB={5}
                      bucket="uploads"
                      folder="paiements"
                      label="Glissez votre capture d'écran ici ou cliquez pour sélectionner"
                      existingFiles={uploadedFiles}
                    />
                  </div>
                </div>

                <Button 
                  onClick={submitProof}
                  disabled={!hasPaid || !transactionId || isSubmitting}
                  className="w-full bg-[#1A1A2E] text-white font-black rounded-2xl py-8 text-lg mt-8"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Soumettre ma preuve'}
                </Button>
              </div>
            )}

            {/* ETAPE 5 : ATTENTE / SUCCÈS */}
            {step === 5 && (
              <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center text-green-600">
                    <ShieldCheck size={48} className="animate-bounce" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1A1A2E] rounded-xl flex items-center justify-center text-white">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-[#1A1A2E] tracking-tight">Paiement enregistré !</h3>
                  <div className="max-w-xs mx-auto space-y-4">
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      Votre preuve de paiement (Ref: <span className="font-bold text-[#1A1A2E]">{transactionId}</span>) est en cours de vérification par le propriétaire.
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B8860B] bg-[#B8860B]/10 py-2 rounded-full">
                      Statut : En attente de confirmation
                    </p>
                  </div>
                </div>

                <Card className="w-full rounded-[2.5rem] border-slate-100 bg-white/50 backdrop-blur-md">
                   <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6 text-left">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                          <AlertCircle size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-800">Délai estimé</p>
                          <p className="text-[10px] text-slate-500 font-medium">Généralement validé en moins de 2 heures</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full rounded-xl font-bold py-6 border-slate-200">
                        Consulter mon historique
                      </Button>
                   </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FOOTER NAV (Only for tenant view) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 lg:hidden">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-1 text-slate-300">
            <LayoutDashboard size={20} />
          </button>
          <button className="flex flex-col items-center gap-1 text-[#B8860B]">
            <CreditCard size={20} />
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-300">
            <Receipt size={20} />
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-300">
            <Wallet size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility icon for layout (had an error earlier)
function LayoutDashboard({ size }: { size: number }) {
  return <div style={{ width: size, height: size }} className="bg-current rounded-sm opacity-20"></div>
}

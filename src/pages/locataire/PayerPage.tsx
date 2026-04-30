import React, { useState } from 'react';
import {
  Check, Copy, Smartphone, ArrowLeft, Loader2,
  ShieldCheck, AlertCircle, Receipt, Home, Calendar, Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useMyLocataireProfile, useMaisons, useAllUnites, useMomoConfigs, createPaiement } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';

const OPERATEURS = [
  { id: 'MTN', label: 'MTN MoMo', color: 'bg-yellow-400', textColor: 'text-yellow-900' },
  { id: 'Orange', label: 'Orange Money', color: 'bg-orange-500', textColor: 'text-white' },
  { id: 'Wave', label: 'Wave', color: 'bg-blue-500', textColor: 'text-white' },
  { id: 'Moov', label: 'Moov Africa', color: 'bg-blue-700', textColor: 'text-white' },
];

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function PayerPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { locataire, isLoading: locLoading } = useMyLocataireProfile();
  const { unites } = useAllUnites();
  const { maisons } = useMaisons();
  const { momoConfigs } = useMomoConfigs();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const unite = unites.find(u => u.id === locataire?.unite_id);
  const maison = maisons.find(m => m.id === unite?.maison_id);
  const montant = unite?.loyer_mensuel || 0;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Chercher la config MoMo du proprio pour l'opérateur sélectionné
  const momoConfig = momoConfigs.find(c => c.operateur === selectedOp);

  function copierNumero() {
    if (momoConfig?.numero) {
      navigator.clipboard.writeText(momoConfig.numero);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locataire || !unite || !maison || !selectedOp) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPaiement(
        {
          locataire_id: locataire.id,
          unite_id: unite.id,
          maison_id: maison.id,
          proprietaire_id: locataire.proprietaire_id,
          mois: currentMonth,
          annee: currentYear,
          montant,
          type: 'momo',
          statut: 'en_attente',
          numero_transaction_momo: transactionId || null,
          operateur_momo: selectedOp,
          capture_ecran_url: null,
          date_paiement: new Date().toISOString().split('T')[0],
          confirme_par_proprio: false,
          notes: null,
        },
        maison.nom,
        unite.nom
      );
      setSuccess(true);
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (locLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#B8860B]" size={40} />
      </div>
    );
  }

  if (!locataire) {
    return (
      <div className="p-8 text-center">
        <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
        <p className="font-black text-slate-800 text-lg mb-2">Profil locataire introuvable</p>
        <p className="text-sm text-slate-500">Votre propriétaire doit vous assigner une unité pour pouvoir payer.</p>
        <Button onClick={() => navigate('/locataire')} className="mt-6 rounded-xl">Retour</Button>
      </div>
    );
  }

  if (!unite) {
    return (
      <div className="p-8 text-center">
        <Home size={48} className="text-slate-300 mx-auto mb-4" />
        <p className="font-black text-slate-800 text-lg mb-2">Aucune unité assignée</p>
        <p className="text-sm text-slate-500">Votre propriétaire doit vous assigner une chambre ou appartement.</p>
        <Button onClick={() => navigate('/locataire')} className="mt-6 rounded-xl">Retour</Button>
      </div>
    );
  }

  if (step === 3 && success) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-[#1A1A2E] mb-3">Paiement envoyé !</h2>
        <p className="text-slate-500 mb-2">Votre paiement de <strong>{montant.toLocaleString()} FCFA</strong> est en attente de confirmation par votre propriétaire.</p>
        <p className="text-xs text-slate-400 mb-8">Vous serez notifié dès validation. Mois : {MOIS_NOMS[currentMonth - 1]} {currentYear}</p>
        <Button onClick={() => navigate('/locataire')} className="w-full bg-[#1A1A2E] text-white rounded-xl py-4 font-bold">
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 lg:pb-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => step === 1 ? navigate('/locataire') : setStep(s => (s - 1) as 1 | 2 | 3)}
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-black text-[#1A1A2E]">Payer mon loyer</h1>
          <p className="text-xs text-slate-500">Étape {step}/2</p>
        </div>
      </div>

      {/* Récap loyer */}
      <Card className="rounded-[2rem] border-slate-100 shadow-sm mb-6 bg-[#1A1A2E]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#B8860B]/20 rounded-xl flex items-center justify-center">
              <Home size={18} className="text-[#B8860B]" />
            </div>
            <div>
              <p className="font-black text-white text-sm">{unite.nom}</p>
              <p className="text-xs text-slate-400">{maison?.nom}</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Loyer mensuel</p>
              <p className="text-3xl font-black text-[#B8860B]">{montant.toLocaleString()} <span className="text-base">FCFA</span></p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar size={12} />
              <span>{MOIS_NOMS[currentMonth - 1]} {currentYear}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Étape 1 : Choisir opérateur */}
      {step === 1 && (
        <div>
          <p className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest mb-4">Choisir votre opérateur Mobile Money</p>
          <div className="grid grid-cols-2 gap-3">
            {OPERATEURS.map(op => (
              <button key={op.id}
                onClick={() => { setSelectedOp(op.id); setStep(2); }}
                className="p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-[#B8860B] hover:shadow-md transition-all text-left font-black text-slate-800">
                <div className={`w-8 h-8 ${op.color} rounded-xl mb-3 flex items-center justify-center`}>
                  <Smartphone size={16} className={op.textColor} />
                </div>
                {op.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Étape 2 : Instructions + saisie transaction */}
      {step === 2 && selectedOp && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">{error}</div>}

          {momoConfig ? (
            <div className="bg-slate-50 rounded-2xl p-5">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Numéro {selectedOp} du propriétaire</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-[#1A1A2E] font-mono">{momoConfig.numero}</p>
                <button type="button" onClick={copierNumero}
                  className="flex items-center gap-2 text-xs font-bold text-[#B8860B] bg-[#B8860B]/10 px-3 py-2 rounded-xl">
                  {isCopied ? <><Check size={12} /> Copié !</> : <><Copy size={12} /> Copier</>}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Nom : {momoConfig.nom_compte}</p>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-2xl p-4 text-sm text-amber-700">
              Votre propriétaire n'a pas encore configuré de numéro {selectedOp}. Contactez-le directement.
            </div>
          )}

          <div className="bg-[#1A1A2E] rounded-2xl p-5 space-y-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Instructions</p>
            {[
              `Ouvrez votre app ${selectedOp} MoMo`,
              `Envoyez ${montant.toLocaleString()} FCFA${momoConfig ? ` au ${momoConfig.numero}` : ''}`,
              'Notez le numéro de transaction',
              'Entrez-le ci-dessous et confirmez',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-[#B8860B] rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-xs text-slate-300 font-medium">{step}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">Numéro de transaction</Label>
            <Input className="rounded-xl font-mono" placeholder="Ex: MTN20250430123456"
              value={transactionId} onChange={e => setTransactionId(e.target.value)} />
            <p className="text-[10px] text-slate-400">Optionnel mais recommandé pour un suivi rapide</p>
          </div>

          <Button type="submit" disabled={submitting}
            className="w-full bg-[#B8860B] hover:bg-[#9A700A] text-white font-black rounded-xl py-5 text-base flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={18} /> Confirmer le paiement de {montant.toLocaleString()} FCFA</>}
          </Button>
        </form>
      )}
    </div>
  );
}

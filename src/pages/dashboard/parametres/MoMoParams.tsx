import React, { useState, useEffect } from 'react';
import { Smartphone, Check, ShieldCheck, Save, Trash2, Plus, Loader2, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useMomoConfigs, createMomoConfig, deleteMomoConfig } from '@/hooks/useData';
import { PAYS_AFRIQUE_OUEST, getOperateurs, getPaysConfig } from '@/lib/countries';

export default function MoMoParams() {
  const { user, profile } = useAuth();
  const { momoConfigs, isLoading, refresh } = useMomoConfigs();

  const userPays = profile?.pays || 'Bénin';
  const paysConfig = getPaysConfig(userPays);
  const operateursDuPays = getOperateurs(userPays);

  // Tous les opérateurs disponibles (pays sélectionné + possibilité d'en ajouter d'autres)
  const [selectedPays, setSelectedPays] = useState(userPays);
  const operateursAffiches = getOperateurs(selectedPays);

  const [form, setForm] = useState({ operateur: '', numero: '', nom_compte: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.operateur || !form.numero || !form.nom_compte) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    if (!user) return;
    setSaving(true); setError(null);
    try {
      await createMomoConfig({
        proprietaire_id: user.id,
        operateur: form.operateur as any,
        numero: form.numero,
        nom_compte: form.nom_compte,
        is_primary: momoConfigs.length === 0,
      });
      setForm({ operateur: '', numero: '', nom_compte: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try { await deleteMomoConfig(id); refresh(); }
    finally { setDeleting(null); }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#B8860B]" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 pb-32 lg:pb-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Mobile Money</h1>
        <p className="text-sm text-slate-500">
          Configurez vos numéros de réception — {paysConfig.flag} {userPays} · {paysConfig.devise} ({paysConfig.symbole})
        </p>
      </div>

      {/* Comptes configurés */}
      {momoConfigs.length > 0 && (
        <div className="mb-8 space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Comptes actifs</p>
          {momoConfigs.map(config => {
            const op = PAYS_AFRIQUE_OUEST.flatMap(p => p.operateurs).find(o => o.id === config.operateur);
            return (
              <div key={config.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 ${op?.color || 'bg-slate-400'} rounded-xl flex items-center justify-center font-black text-white text-[10px]`}>
                    {config.operateur}
                  </div>
                  <div>
                    <p className="font-black text-[#1A1A2E] text-sm">{config.operateur}</p>
                    <p className="text-xs text-slate-500 font-mono">{config.numero}</p>
                    <p className="text-[10px] text-slate-400">{config.nom_compte}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {config.is_primary && (
                    <span className="text-[9px] font-black bg-[#B8860B]/10 text-[#B8860B] px-2 py-1 rounded-lg">Principal</span>
                  )}
                  <button onClick={() => handleDelete(config.id)} disabled={deleting === config.id}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                    {deleting === config.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulaire ajouter */}
      <Card className="rounded-[2rem] border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-black text-[#1A1A2E] flex items-center gap-2">
            <Plus size={18} className="text-[#B8860B]" /> Ajouter un compte MoMo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            {error && <div className="p-3 bg-red-50 rounded-xl text-red-600 text-xs font-medium">{error}</div>}

            {/* Sélecteur de pays pour voir les opérateurs */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Globe size={11} /> Opérateurs disponibles par pays
              </Label>
              <Select value={selectedPays} onValueChange={setSelectedPays}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYS_AFRIQUE_OUEST.map(p => (
                    <SelectItem key={p.nom} value={p.nom}>{p.flag} {p.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opérateur *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {operateursAffiches.map(op => (
                  <button key={op.id} type="button"
                    onClick={() => setForm(f => ({ ...f, operateur: op.id }))}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                      form.operateur === op.id
                        ? 'border-[#B8860B] bg-[#B8860B]/5'
                        : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}>
                    <div className={`w-8 h-8 ${op.color} rounded-xl flex items-center justify-center font-black text-white text-[9px] shrink-0`}>
                      {op.id.slice(0, 3)}
                    </div>
                    <span className="text-xs font-bold text-slate-700 leading-tight">{op.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Numéro de téléphone *</Label>
                <Input className="rounded-xl font-mono" placeholder={`${paysConfig.indicatif} XX XX XX XX`}
                  value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom du compte *</Label>
                <Input className="rounded-xl" placeholder="Ex: Jean DUPONT"
                  value={form.nom_compte} onChange={e => setForm(f => ({ ...f, nom_compte: e.target.value }))} />
              </div>
            </div>

            <Button type="submit" disabled={saving || !form.operateur}
              className="w-full bg-[#1A1A2E] text-white font-bold rounded-xl py-5 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={18} /> :
                success ? <><Check size={18} /> Sauvegardé !</> :
                <><Save size={18} /> Ajouter ce compte</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info sécurité */}
      <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-blue-600 rounded-xl text-white shrink-0">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Sécurité</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Ces numéros seront affichés à vos locataires lors du paiement. Vérifiez qu'ils sont corrects avant de les activer.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, Building, UserCircle,
  Loader2, Phone, Mail, Lock, Check, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { linkLocataireToUser } from '../../hooks/useData';

export default function Inscription() {
  const [activeTab, setActiveTab] = useState<'proprio' | 'locataire'>('proprio');
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const { signUp, user, profile, isLoading: authLoading } = useAuth();

  const [proprioForm, setProprioForm] = useState({ prenom: '', nom: '', email: '', telephone: '', pays: 'Bénin', password: '' });
  const [locForm, setLocForm] = useState({ prenom: '', nom: '', email: '', telephone: '', password: '', codeProprietaire: '' });
  const [ownerFound, setOwnerFound] = useState<{ id: string; nom: string; prenom: string } | null>(null);
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && profile) {
      navigate(profile.role === 'locataire' ? '/locataire' : '/dashboard');
    }
  }, [user, profile, authLoading, navigate]);

  async function verifierCode(code: string) {
    if (code.length < 4) { setOwnerFound(null); setCodeVerified(false); return; }
    setCodeLoading(true);
    try {
      const { data } = await supabase!
        .from('profiles')
        .select('id, nom, prenom')
        .eq('code_unique', code.toUpperCase().trim())
        .eq('role', 'proprietaire')
        .maybeSingle();
      if (data) { setOwnerFound(data); setCodeVerified(true); }
      else { setOwnerFound(null); setCodeVerified(false); }
    } finally { setCodeLoading(false); }
  }

  async function handleProprioSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (proprioForm.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setIsLoading(true); setError(null);
    const { error: err } = await signUp(proprioForm.email, proprioForm.password, {
      nom: proprioForm.nom, prenom: proprioForm.prenom, telephone: proprioForm.telephone,
      role: 'proprietaire', pays: proprioForm.pays,
    });
    if (err) { setError(err.message); setIsLoading(false); return; }
    setStep(2); setIsLoading(false);
  }

  async function handleLocataireSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerFound) { setError('Code propriétaire invalide. Vérifiez le code.'); return; }
    if (locForm.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setIsLoading(true); setError(null);
    try {
      const { error: err } = await signUp(locForm.email, locForm.password, {
        nom: locForm.nom, prenom: locForm.prenom, telephone: locForm.telephone, role: 'locataire',
      });
      if (err) throw err;
      await new Promise(r => setTimeout(r, 1200));
      const { data: { user: newUser } } = await supabase!.auth.getUser();
      if (newUser) {
        await linkLocataireToUser(newUser.id, ownerFound.id, locForm.nom, locForm.prenom, locForm.telephone);
      }
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription.');
    } finally { setIsLoading(false); }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#B8860B]" size={48} />
      </div>
    );
  }

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#B8860B] transition-colors";

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8860B]/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
      <Link to="/" className="absolute top-8 left-8 text-white/50 hover:text-[#B8860B] transition-colors flex items-center gap-2 font-bold text-sm">
        <ArrowLeft size={16} /> Retour
      </Link>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#B8860B] rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-[#B8860B]/20 mb-5">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Créer un compte</h1>
          <p className="text-slate-400 mt-1 text-sm">ImmoAfrik — Gestion immobilière en Afrique</p>
        </div>

        {step === 1 && (
          <div className="bg-white/5 p-1 rounded-2xl mb-6 flex border border-white/10">
            <button onClick={() => { setActiveTab('proprio'); setError(null); }}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'proprio' ? 'bg-[#B8860B] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <Building size={16} /> Propriétaire
            </button>
            <button onClick={() => { setActiveTab('locataire'); setError(null); setOwnerFound(null); setCodeVerified(false); }}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'locataire' ? 'bg-[#B8860B] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <UserCircle size={16} /> Locataire
            </button>
          </div>
        )}

        <div className="bg-white rounded-[2rem] p-7 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center">{error}</div>
          )}

          {/* SUCCÈS */}
          {step === 2 && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                <Check size={32} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Compte créé !</h3>
                <p className="text-sm text-slate-500 mt-2 px-4">
                  {activeTab === 'proprio'
                    ? 'Vérifiez votre email pour confirmer. Votre code propriétaire sera disponible après connexion.'
                    : 'Inscription réussie ! Vérifiez votre email et connectez-vous. Votre propriétaire vous assignera bientôt votre logement.'}
                </p>
              </div>
              <button onClick={() => navigate('/auth/connexion')}
                className="w-full bg-[#1A1A2E] text-white py-4 rounded-xl font-bold hover:bg-[#252542] transition-all">
                Se connecter
              </button>
            </div>
          )}

          {/* FORMULAIRE PROPRIO */}
          {step === 1 && activeTab === 'proprio' && (
            <form onSubmit={handleProprioSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prénom *</label>
                  <input required type="text" placeholder="Koffi" className={inputClass}
                    value={proprioForm.prenom} onChange={e => setProprioForm(f => ({ ...f, prenom: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom *</label>
                  <input required type="text" placeholder="Adanhoume" className={inputClass}
                    value={proprioForm.nom} onChange={e => setProprioForm(f => ({ ...f, nom: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input required type="email" placeholder="koffi@exemple.com" className={`${inputClass} pl-11`}
                    value={proprioForm.email} onChange={e => setProprioForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input required type="tel" placeholder="+229 97 00 00 00" className={`${inputClass} pl-11`}
                    value={proprioForm.telephone} onChange={e => setProprioForm(f => ({ ...f, telephone: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pays *</label>
                <select required className={inputClass}
                  value={proprioForm.pays} onChange={e => setProprioForm(f => ({ ...f, pays: e.target.value }))}>
                  <option value="Bénin">Bénin</option>
                  <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                  <option value="Sénégal">Sénégal</option>
                  <option value="Togo">Togo</option>
                  <option value="Cameroun">Cameroun</option>
                  <option value="Mali">Mali</option>
                  <option value="Guinée">Guinée</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input required type={showPwd ? 'text' : 'password'} minLength={6} placeholder="Minimum 6 caractères"
                    className={`${inputClass} pl-11 pr-11`}
                    value={proprioForm.password} onChange={e => setProprioForm(f => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full bg-[#1A1A2E] text-white py-4 rounded-xl font-bold hover:bg-[#252542] transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-1">
                {isLoading ? <><Loader2 className="animate-spin" size={18} /> Création...</> : 'Créer mon compte propriétaire'}
              </button>
            </form>
          )}

          {/* FORMULAIRE LOCATAIRE */}
          {step === 1 && activeTab === 'locataire' && (
            <form onSubmit={handleLocataireSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Code de votre propriétaire *</label>
                <div className="relative">
                  <input type="text" required placeholder="Ex: IMMO-A1B2" maxLength={20}
                    className={`${inputClass} pr-24 font-mono font-bold text-center tracking-widest`}
                    style={{ textTransform: 'uppercase' }}
                    value={locForm.codeProprietaire}
                    onChange={e => {
                      const v = e.target.value.toUpperCase();
                      setLocForm(f => ({ ...f, codeProprietaire: v }));
                      setCodeVerified(false); setOwnerFound(null);
                      if (v.length >= 6) verifierCode(v);
                    }} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {codeLoading ? <Loader2 size={16} className="animate-spin text-slate-400" /> :
                      codeVerified ? <Check size={16} className="text-green-600" /> : null}
                  </div>
                </div>
                {ownerFound && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2">
                    <Check size={12} /> Propriétaire trouvé : <strong>{ownerFound.prenom} {ownerFound.nom}</strong>
                  </div>
                )}
                {!codeVerified && locForm.codeProprietaire.length > 5 && !codeLoading && (
                  <p className="text-xs text-red-500 px-1">Code introuvable. Demandez le bon code à votre propriétaire.</p>
                )}
                <p className="text-[10px] text-slate-400 italic">Code fourni par votre propriétaire (format IMMO-XXXX)</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prénom *</label>
                  <input required type="text" placeholder="Moussa" className={inputClass}
                    value={locForm.prenom} onChange={e => setLocForm(f => ({ ...f, prenom: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom *</label>
                  <input required type="text" placeholder="Koné" className={inputClass}
                    value={locForm.nom} onChange={e => setLocForm(f => ({ ...f, nom: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input required type="email" placeholder="moussa@exemple.com" className={`${inputClass} pl-11`}
                    value={locForm.email} onChange={e => setLocForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone MoMo *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input required type="tel" placeholder="+229 97 00 00 00" className={`${inputClass} pl-11`}
                    value={locForm.telephone} onChange={e => setLocForm(f => ({ ...f, telephone: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input required type={showPwd ? 'text' : 'password'} minLength={6} placeholder="Minimum 6 caractères"
                    className={`${inputClass} pl-11 pr-11`}
                    value={locForm.password} onChange={e => setLocForm(f => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading || !ownerFound}
                className="w-full bg-[#1A1A2E] text-white py-4 rounded-xl font-bold hover:bg-[#252542] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1">
                {isLoading ? <><Loader2 className="animate-spin" size={18} /> Inscription...</> : 'Créer mon compte locataire'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-400 mt-6 text-sm">
          Déjà un compte ? <Link to="/auth/connexion" className="text-[#B8860B] font-bold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

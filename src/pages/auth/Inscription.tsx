import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Copy, Check, ArrowLeft, Building, UserCircle, Loader2, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Inscription() {
  const [activeTab, setActiveTab] = useState<'proprio' | 'locataire'>('proprio');
  const [step, setStep] = useState(1);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [ownerFound, setOwnerFound] = useState<{ id: string; nom: string; prenom: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proprietaireCode, setProprietaireCode] = useState('');
  const navigate = useNavigate();
  const { signUp, user, profile, isLoading: authLoading } = useAuth();

  // Form state for proprietaire
  const [proprioForm, setProprioForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    pays: '',
    password: '',
  });

  // Form state for locataire
  const [locataireForm, setLocataireForm] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    password: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role === 'locataire') {
        navigate('/locataire');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleProprioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: signUpError } = await signUp(
      proprioForm.email,
      proprioForm.password,
      {
        nom: proprioForm.nom,
        prenom: proprioForm.prenom,
        telephone: proprioForm.telephone,
        role: 'proprietaire',
        pays: proprioForm.pays,
      }
    );

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    // Generate a display code (actual code comes from database trigger)
    const code = `IMM${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setGeneratedCode(code);
    setStep(2);
    setIsLoading(false);
  };

  const handleLocataireSearch = async () => {
    if (!proprietaireCode.trim()) {
      setError("Veuillez entrer un code propriétaire.");
      return;
    }

    setIsLoading(true);
    setError(null);

    if (!supabase) {
      setError("Service non disponible.");
      setIsLoading(false);
      return;
    }

    // Search for proprietaire by code
    const { data, error: searchError } = await supabase
      .from('profiles')
      .select('id, nom, prenom')
      .eq('code_unique', proprietaireCode.toUpperCase())
      .eq('role', 'proprietaire')
      .single();

    if (searchError || !data) {
      setError("Code propriétaire introuvable. Vérifiez le code et réessayez.");
      setIsLoading(false);
      return;
    }

    setOwnerFound(data);
    setIsLoading(false);
  };

  const handleLocataireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ownerFound) {
      setError("Veuillez d'abord trouver votre propriétaire.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: signUpError } = await signUp(
      locataireForm.email,
      locataireForm.password,
      {
        nom: locataireForm.nom,
        prenom: locataireForm.prenom,
        telephone: locataireForm.telephone,
        role: 'locataire',
      }
    );

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    // Success - show confirmation
    setStep(2);
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#B8860B]" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8860B]/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />

      <Link to="/" className="absolute top-8 left-8 text-white/50 hover:text-[#B8860B] transition-colors flex items-center gap-2 font-bold text-sm">
        <ArrowLeft size={16} />
        Retour à l&apos;accueil
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#B8860B] rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-[#B8860B]/20 mb-6">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Rejoignez <span className="text-[#B8860B]">ImmoAfrik</span></h1>
          <p className="text-slate-400 mt-2">La plateforme de confiance pour l&apos;immobilier en Afrique.</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 p-1 rounded-2xl mb-8 flex border border-white/10">
          <button 
            onClick={() => { setActiveTab('proprio'); setStep(1); setError(null); }}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'proprio' ? 'bg-[#B8860B] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Building size={18} />
            Propriétaire
          </button>
          <button 
            onClick={() => { setActiveTab('locataire'); setStep(1); setOwnerFound(null); setError(null); }}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'locataire' ? 'bg-[#B8860B] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <UserCircle size={18} />
            Locataire
          </button>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'proprio' ? (
              <motion.div 
                key={`proprio-step-${step}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
              >
                {step === 1 ? (
                  <form onSubmit={handleProprioSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prénom</label>
                        <input 
                          required 
                          type="text" 
                          value={proprioForm.prenom}
                          onChange={(e) => setProprioForm({ ...proprioForm, prenom: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B8860B] transition-colors" 
                          placeholder="Koffi" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom</label>
                        <input 
                          required 
                          type="text" 
                          value={proprioForm.nom}
                          onChange={(e) => setProprioForm({ ...proprioForm, nom: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B8860B] transition-colors" 
                          placeholder="Adanhoume" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                      <input 
                        required 
                        type="email" 
                        value={proprioForm.email}
                        onChange={(e) => setProprioForm({ ...proprioForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B8860B] transition-colors" 
                        placeholder="koffi@exemple.com" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          required 
                          type="tel" 
                          value={proprioForm.telephone}
                          onChange={(e) => setProprioForm({ ...proprioForm, telephone: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#B8860B] transition-colors" 
                          placeholder="+229 97 00 00 00" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pays</label>
                      <select 
                        required 
                        value={proprioForm.pays}
                        onChange={(e) => setProprioForm({ ...proprioForm, pays: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B8860B] transition-colors"
                      >
                        <option value="">Sélectionnez un pays</option>
                        <option value="Bénin">Bénin</option>
                        <option value="Côte d'Ivoire">Côte d&apos;Ivoire</option>
                        <option value="Sénégal">Sénégal</option>
                        <option value="Togo">Togo</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de passe</label>
                      <input 
                        required 
                        type="password" 
                        value={proprioForm.password}
                        onChange={(e) => setProprioForm({ ...proprioForm, password: e.target.value })}
                        minLength={6}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B8860B] transition-colors" 
                        placeholder="Minimum 6 caractères"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-[#1A1A2E] text-white py-4 rounded-xl font-bold mt-4 hover:shadow-xl hover:bg-[#252542] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Création en cours...
                        </>
                      ) : (
                        "Créer mon compte immo"
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center">
                      <Check size={40} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Compte créé avec succès !</h3>
                      <p className="text-sm text-slate-500 mt-2 italic px-4">
                        Vérifiez votre email pour confirmer votre inscription. Votre code propriétaire unique sera disponible après confirmation.
                      </p>
                    </div>
                    <div className="relative group">
                      <div className="bg-[#1A1A2E] text-white p-6 rounded-2xl font-mono text-2xl font-black tracking-widest relative overflow-hidden">
                        {generatedCode}
                        <div className="absolute top-0 right-0 p-2 opacity-50 text-[10px] font-bold">PROPRIO CODE</div>
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#B8860B] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                      >
                        {isCopied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier le code</>}
                      </button>
                    </div>
                    <div className="pt-8">
                      <button 
                        onClick={() => navigate('/auth/connexion')}
                        className="text-sm font-bold text-[#1A1A2E] underline underline-offset-4 hover:text-[#B8860B]"
                      >
                        Se connecter maintenant
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key={`locataire-step-${step}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-6"
              >
                {step === 1 ? (
                  !ownerFound ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Code Propriétaire</label>
                        <input 
                          required 
                          type="text" 
                          value={proprietaireCode}
                          onChange={(e) => setProprietaireCode(e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-center font-mono text-xl font-bold focus:outline-none focus:border-[#B8860B] transition-colors uppercase" 
                          placeholder="Ex: IMMXXXXXX" 
                        />
                        <p className="text-[10px] text-slate-400 italic text-center mt-2">Ce code vous a été remis par votre bailleur.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={handleLocataireSearch}
                        disabled={isLoading}
                        className="w-full bg-[#1A1A2E] text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Recherche...
                          </>
                        ) : (
                          "Trouver mon propriétaire"
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {ownerFound.prenom.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Propriétaire Trouvé</p>
                          <h4 className="font-bold text-slate-800">{ownerFound.prenom} {ownerFound.nom}</h4>
                        </div>
                      </div>
                      
                      <form onSubmit={handleLocataireSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prénom</label>
                            <input 
                              required 
                              type="text" 
                              value={locataireForm.prenom}
                              onChange={(e) => setLocataireForm({ ...locataireForm, prenom: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                              placeholder="Moussa" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom</label>
                            <input 
                              required 
                              type="text" 
                              value={locataireForm.nom}
                              onChange={(e) => setLocataireForm({ ...locataireForm, nom: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                              placeholder="Kone" 
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                          <input 
                            required 
                            type="email" 
                            value={locataireForm.email}
                            onChange={(e) => setLocataireForm({ ...locataireForm, email: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                            placeholder="moussa@exemple.com" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone Mobile Money</label>
                          <input 
                            required 
                            type="tel" 
                            value={locataireForm.telephone}
                            onChange={(e) => setLocataireForm({ ...locataireForm, telephone: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                            placeholder="+225 ..." 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de passe</label>
                          <input 
                            required 
                            type="password" 
                            value={locataireForm.password}
                            onChange={(e) => setLocataireForm({ ...locataireForm, password: e.target.value })}
                            minLength={6}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                            placeholder="Minimum 6 caractères"
                          />
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-700 italic">
                          Une fois inscrit, votre propriétaire devra vous assigner votre unité (chambre, appartement, etc.) pour commencer les paiements.
                        </div>
                        <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-[#1A1A2E] text-white py-4 rounded-xl font-bold disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="animate-spin" size={20} />
                              Création en cours...
                            </>
                          ) : (
                            "Créer mon compte locataire"
                          )}
                        </button>
                      </form>
                    </div>
                  )
                ) : (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center">
                      <Check size={40} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Inscription réussie !</h3>
                      <p className="text-sm text-slate-500 mt-2 italic px-4">
                        Vérifiez votre email pour confirmer votre inscription. Votre propriétaire sera notifié de votre demande.
                      </p>
                    </div>
                    <div className="pt-4">
                      <button 
                        onClick={() => navigate('/auth/connexion')}
                        className="text-sm font-bold text-[#1A1A2E] underline underline-offset-4 hover:text-[#B8860B]"
                      >
                        Se connecter maintenant
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-slate-400 mt-8 text-sm">
          Vous avez déjà un compte ? <Link to="/auth/connexion" className="text-[#B8860B] font-bold hover:underline">Connectez-vous</Link>
        </p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signIn, user, profile, isLoading: authLoading } = useAuth();

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      setIsLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError("Email ou mot de passe incorrect. Vérifiez vos identifiants.");
      } else if (signInError.message.includes('Email not confirmed')) {
        setError("Veuillez confirmer votre email avant de vous connecter.");
      } else {
        setError(signInError.message);
      }
      setIsLoading(false);
    }
    // Navigation handled by useEffect when profile loads
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
          <h1 className="text-3xl font-black text-white tracking-tight">Accès <span className="text-[#B8860B]">ImmoAfrik</span></h1>
          <p className="text-slate-400 mt-2">Gérez et payez vos loyers en toute sérénité.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-10 shadow-2xl"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center italic">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/5 transition-all" 
                    placeholder="exemple@mail.com" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/5 transition-all" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#B8860B] focus:ring-[#B8860B]" />
                <span className="text-xs text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Se souvenir de moi</span>
              </label>
              <button type="button" className="text-xs font-bold text-[#B8860B] hover:underline">Mot de passe oublié ?</button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#1A1A2E] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#252542] hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-slate-400 mt-8 text-sm">
          Nouveau sur la plateforme ? <Link to="/auth/inscription" className="text-[#B8860B] font-bold hover:underline">Créer un compte gratuitement</Link>
        </p>
      </div>
    </div>
  );
}

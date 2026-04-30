import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface SignUpMetadata {
  nom: string;
  prenom: string;
  telephone: string;
  role: 'proprietaire' | 'locataire';
  pays?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchProfile(userId: string): Promise<Profile | null> {
    if (!supabase) return null;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return (data as Profile) ?? null;
    } catch {
      return null;
    }
  }

  const refreshProfile = async () => {
    if (user) setProfile(await fetchProfile(user.id));
  };

  useEffect(() => {
    // Si Supabase n'est pas configuré (env vars manquantes)
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Sécurité : si l'auth ne répond pas en 8 secondes, débloquer le site
    const timeout = setTimeout(() => setIsLoading(false), 8000);

    // 1. Récupérer la session existante immédiatement (source de vérité initiale)
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      clearTimeout(timeout);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        const p = await fetchProfile(initialSession.user.id);
        setProfile(p);
      }
      setIsLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setIsLoading(false);
    });

    // 2. Écouter les changements SUIVANTS (connexion, déconnexion, refresh token)
    // On ignore INITIAL_SESSION car getSession() s'en est déjà occupé
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'INITIAL_SESSION') return; // déjà géré par getSession()

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const p = await fetchProfile(newSession.user.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    if (!supabase) return { error: { message: 'Supabase non configuré' } as AuthError };
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: metadata },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: 'Supabase non configuré' } as AuthError };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
}

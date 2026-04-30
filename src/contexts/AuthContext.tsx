import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  // Eviter les double-appels fetchProfile simultanés
  const fetchingRef = useRef(false);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data as Profile;
  };

  const refreshProfile = async () => {
    if (user && !fetchingRef.current) {
      fetchingRef.current = true;
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!supabase) { setIsLoading(false); return; }

    let initialized = false;

    // Récupérer la session initiale une seule fois
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      initialized = true;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        const profileData = await fetchProfile(initialSession.user.id);
        setProfile(profileData);
      }
      setIsLoading(false);
    });

    // Listener sur les changements d'état auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Ignorer le INITIAL_SESSION — déjà géré par getSession() ci-dessus
      if (event === 'INITIAL_SESSION' && initialized) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        if (!fetchingRef.current) {
          fetchingRef.current = true;
          const profileData = await fetchProfile(newSession.user.id);
          setProfile(profileData);
          fetchingRef.current = false;
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } as AuthError };
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: metadata, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } as AuthError };
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

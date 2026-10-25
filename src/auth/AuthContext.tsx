import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';

export interface Utilisateur {
  id: string;
  email?: string;
}

export interface AuthClient {
  auth: {
    getSession(): Promise<{ data: { session: { user: Utilisateur } | null } }>;
    onAuthStateChange(cb: (evenement: string, session: { user: Utilisateur } | null) => void): {
      data: { subscription: { unsubscribe(): void } };
    };
    signInWithPassword(p: { email: string; password: string }): Promise<{ error: { message: string } | null }>;
    signUp(p: { email: string; password: string; options: { emailRedirectTo: string } }): Promise<{ error: { message: string } | null }>;
    signOut(): Promise<{ error: { message: string } | null }>;
  };
}

interface AuthValeur {
  user: Utilisateur | null;
  chargement: boolean;
  seConnecter(email: string, mdp: string): Promise<void>;
  creerCompte(email: string, mdp: string): Promise<void>;
  seDeconnecter(): Promise<void>;
}

const Contexte = createContext<AuthValeur | null>(null);

export function AuthProvider({ client, children }: { client?: AuthClient; children: ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);
  // Sans configuration Supabase, l'app reste utilisable pour les élèves : seules les actions enseignant échouent.
  const c = useMemo<AuthClient | null>(() => {
    if (client) return client;
    try {
      return getSupabase() as unknown as AuthClient;
    } catch {
      return null;
    }
  }, [client]);

  useEffect(() => {
    if (!c) {
      setChargement(false);
      return;
    }
    let actif = true;
    c.auth.getSession().then(({ data }) => {
      if (!actif) return;
      setUser(data.session?.user ?? null);
      setChargement(false);
    });
    const { data } = c.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => {
      actif = false;
      data.subscription.unsubscribe();
    };
  }, [c]);

  const exiger = (): AuthClient => {
    if (!c) throw new Error('Configuration de la connexion manquante : l’espace enseignant n’est pas disponible.');
    return c;
  };

  const valeur: AuthValeur = {
    user,
    chargement,
    async seConnecter(email, mdp) {
      const { error } = await exiger().auth.signInWithPassword({ email, password: mdp });
      if (error) throw new Error(error.message);
    },
    async creerCompte(email, mdp) {
      // redirectTo explicite : sans lui, le lien du courriel renvoie vers une autre app du projet partagé.
      const { error } = await exiger().auth.signUp({ email, password: mdp, options: { emailRedirectTo: window.location.origin + '/connexion' } });
      if (error) throw new Error(error.message);
    },
    async seDeconnecter() {
      await c?.auth.signOut();
    },
  };

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useAuth(): AuthValeur {
  const v = useContext(Contexte);
  if (!v) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return v;
}

export function RequiertEnseignant({ children }: { children: ReactNode }) {
  const { user, chargement } = useAuth();
  if (chargement) return <p>Chargement…</p>;
  if (!user) return <Navigate to="/connexion" replace />;
  return <>{children}</>;
}


import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthState = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setSession(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    const loadSession = async () => {
      try {
        const { data, error } = await client.auth.getSession();

        if (error) {
          console.warn(
            'BRITUME session check failed:',
            error.message
          );
          return;
        }

        if (mounted) {
          setSession(data.session);
        }
      } catch (error) {
        console.warn('BRITUME session check failed:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<void> => {
    const client = supabase;

    if (!client) {
      throw new Error(
        'Supabase is not configured. Check your environment variables.'
      );
    }

    const { error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    const client = supabase;

    if (!client) {
      throw new Error(
        'Supabase is not configured. Check your environment variables.'
      );
    }

    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.'
    );
  }

  return context;
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { Linking } from 'react-native';
import {
  bootstrapApplication,
  exchangeCodeForSession,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from '@precoperto/supabase';
import { getMobileSupabaseClient } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    latitude: number;
    longitude: number;
  }) => Promise<{ requiresConfirmation: boolean }>;
  signOut: () => Promise<void>;
  bootstrap: (input: { name: string; latitude: number; longitude: number }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    try {
      const client = getMobileSupabaseClient();
      void client.auth.getSession().then(({ data }) => {
        if (mounted) {
          setSession(data.session);
          setLoading(false);
        }
      });
      const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (mounted) {
          setSession(nextSession);
          setLoading(false);
        }
      });
      const linkSubscription = Linking.addEventListener('url', ({ url }) => {
        const code = url.match(/[?&]code=([^&]+)/)?.[1];
        if (code) void exchangeCodeForSession(client, decodeURIComponent(code));
      });
      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
        linkSubscription.remove();
      };
    } catch {
      if (mounted) {
        queueMicrotask(() => setLoading(false));
      }
      return () => {
        mounted = false;
      };
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      async signIn(email, password) {
        const { error } = await signInWithEmail(getMobileSupabaseClient(), { email, password });
        if (error) throw new Error(error.message);
      },
      async signUp(input) {
        const { data, error } = await signUpWithEmail(
          getMobileSupabaseClient(),
          input,
          'precoperto://auth/confirm',
        );
        if (error) throw new Error(error.message);
        return { requiresConfirmation: !data.session };
      },
      async signOut() {
        const { error } = await signOut(getMobileSupabaseClient());
        if (error) throw new Error(error.message);
      },
      async bootstrap(input) {
        const client = getMobileSupabaseClient();
        const { data: authData } = await client.auth.getUser();
        if (!authData.user) throw new Error('Sessão necessária.');
        const { error } = await bootstrapApplication(client, {
          ...input,
          email: authData.user.email ?? '',
        });
        if (error) throw new Error(error.message);
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}

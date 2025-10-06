import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { showNotification } from '@mantine/notifications';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  convertAnonymousToEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // If no session, automatically sign in anonymously
      if (!session) {
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (!error && data.session) {
            setSession(data.session);
            setUser(data.session.user);
          }
        } catch (error) {
          console.error('Failed to sign in anonymously:', error);
        }
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in anonymously
  const signInAnonymously = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      showNotification({
        title: 'Signed in',
        message: 'You are now signed in anonymously',
        color: 'blue',
      });
    } catch (error) {
      showNotification({
        title: 'Error',
        message: (error as AuthError).message,
        color: 'red',
      });
      throw error;
    }
  };

  // Sign up with email
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      showNotification({
        title: 'Account created',
        message: 'Your account has been created successfully',
        color: 'green',
      });
    } catch (error) {
      showNotification({
        title: 'Error',
        message: (error as AuthError).message,
        color: 'red',
      });
      throw error;
    }
  };

  // Sign in with email
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      showNotification({
        title: 'Signed in',
        message: 'Welcome back!',
        color: 'green',
      });
    } catch (error) {
      showNotification({
        title: 'Error',
        message: (error as AuthError).message,
        color: 'red',
      });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      showNotification({
        title: 'Signed out',
        message: 'You have been signed out',
        color: 'blue',
      });
    } catch (error) {
      showNotification({
        title: 'Error',
        message: (error as AuthError).message,
        color: 'red',
      });
      throw error;
    }
  };

  // Convert anonymous user to email user
  const convertAnonymousToEmail = async (email: string, password: string) => {
    try {
      if (!user?.is_anonymous) {
        throw new Error('User is not anonymous');
      }

      // Update user with email and password
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (error) throw error;

      showNotification({
        title: 'Account upgraded',
        message: 'Your anonymous account has been upgraded to an email account',
        color: 'green',
      });
    } catch (error) {
      showNotification({
        title: 'Error',
        message: (error as AuthError).message,
        color: 'red',
      });
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signInAnonymously,
    signUp,
    signIn,
    signOut,
    convertAnonymousToEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

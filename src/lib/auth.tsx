import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';
import { supabase } from './supabase';
import type { Business } from './supabase';
import { withTimeout } from './withTimeout';

interface AuthContextValue {
  user: User | null;
  business: Business | null;
  loading: boolean;
  businessError: string | null;
  signUp: (
    email: string,
    password: string,
    biz: { name: string; type: string; openingBalance: number }
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessError, setBusinessError] = useState<string | null>(null);
  // While sign-up is creating the account AND its business, ignore auth-state events so the UI
  // doesn't flash the "set up your business" screen or race a second insert.
  const signingUp = useRef(false);

  async function loadBusiness(userId: string) {
    setBusinessError(null);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        15000,
        'Loading your business'
      );
      if (error) throw new Error(error.message);
      if (firebaseAuth.currentUser?.uid !== userId) return; // signed out / switched while loading
      setBusiness(data as Business | null);
    } catch (e) {
      console.error('loadBusiness failed:', e);
      setBusiness(null);
      setBusinessError(e instanceof Error ? e.message : 'Could not load your business.');
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
      if (signingUp.current) return;
      setUser(fbUser);
      if (fbUser) {
        loadBusiness(fbUser.uid).finally(() => setLoading(false));
      } else {
        setBusiness(null);
        setBusinessError(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const signUp: AuthContextValue['signUp'] = async (email, password, biz) => {
    signingUp.current = true;
    try {
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      } catch (err) {
        console.error('signUp failed:', err);
        return { error: friendlyError(err) };
      }
      const { error: insertError } = await supabase.from('businesses').insert({
        name: biz.name || 'My Business',
        type: biz.type,
        opening_balance: biz.openingBalance || 0,
        lang: 'en',
      });
      // Account exists either way. If the business insert failed, the app shows a retry form.
      if (insertError) console.error('Business insert failed:', insertError);
      await loadBusiness(cred.user.uid);
      setUser(cred.user);
      return { error: null };
    } finally {
      signingUp.current = false;
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { error: null };
    } catch (err) {
      console.error('signIn failed:', err);
      return { error: friendlyError(err) };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(firebaseAuth);
    setBusiness(null);
  };

  const refreshBusiness = async () => {
    const current = firebaseAuth.currentUser;
    if (current) await loadBusiness(current.uid);
  };

  return (
    <AuthContext.Provider
      value={{ user, business, loading, businessError, signUp, signIn, signOut, refreshBusiness }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

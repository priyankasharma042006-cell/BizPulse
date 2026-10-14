import { createClient } from '@supabase/supabase-js';
import { firebaseAuth } from './firebase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase is used purely as the database / edge-function backend.
 * Authentication is handled by Firebase Auth: every request carries the
 * signed-in user's Firebase ID token, which Supabase verifies through its
 * Third-Party Auth integration. Row level security reads the Firebase UID from
 * `auth.jwt() ->> 'sub'`, so only that user's rows are reachable.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => (await firebaseAuth.currentUser?.getIdToken()) ?? null,
});

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  currency: string;
  opening_balance: number;
  lang: string;
  created_at: string;
};

export type Item = {
  id: string;
  business_id: string;
  name: string;
  unit: string;
  cost: number;
  price: number;
  stock: number;
  reorder_level: number;
  shelf_life_days: number | null;
  supplier_id: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  business_id: string;
  type: 'sale' | 'expense';
  amount: number;
  item_id: string | null;
  qty: number | null;
  note: string | null;
  date: string;
  created_at: string;
};

export type Bill = {
  id: string;
  business_id: string;
  payee: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid';
  created_at: string;
};

export type AlertRow = {
  id: string;
  business_id: string;
  kind: string;
  severity: 'critical' | 'warning' | 'info';
  reason: string;
  suggested_action: string | null;
  read_at: string | null;
  created_at: string;
};

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  balance_due: number;
  created_at: string;
};

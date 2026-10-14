import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { fetchAllRows } from '@/lib/fetchAll';
import { withTimeout } from '@/lib/withTimeout';
import type { Transaction, Item, Bill } from '@/lib/supabase';

type Want = { transactions?: boolean; items?: boolean; bills?: boolean };

/**
 * Loads the business's transactions / items / bills.
 * Guarantees `loading` always ends (success, error, or timeout) — never an endless spinner.
 */
export function useBusinessData(want: Want = { transactions: true, items: true, bills: true }) {
  const { business } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  const wantKey = JSON.stringify(want);

  const reload = useCallback(async () => {
    if (!business) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const w = JSON.parse(wantKey) as Want;
      const [tx, it, bl] = await withTimeout(
        Promise.all([
          w.transactions ? fetchAllRows<Transaction>('transactions', business.id, { column: 'date', ascending: true }) : Promise.resolve([] as Transaction[]),
          w.items ? fetchAllRows<Item>('items', business.id, { column: 'name', ascending: true }) : Promise.resolve([] as Item[]),
          w.bills ? fetchAllRows<Bill>('bills', business.id) : Promise.resolve([] as Bill[]),
        ]),
        30000,
        'Loading your data'
      );
      if (!alive.current) return;
      setTransactions(tx);
      setItems(it);
      setBills(bl);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : 'Could not load your data.');
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [business, wantKey]);

  useEffect(() => {
    alive.current = true;
    reload();
    return () => { alive.current = false; };
  }, [reload]);

  return { business, transactions, items, bills, loading, error, reload };
}

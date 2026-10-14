import { supabase } from './supabase';

const PAGE = 1000; // PostgREST returns at most 1000 rows per request by default

/**
 * Fetches EVERY row for a business. A plain `.select()` silently stops at 1000 rows,
 * which would drop the newest transactions and corrupt balances/forecasts.
 */
export async function fetchAllRows<T>(
  table: string,
  businessId: string,
  order?: { column: string; ascending: boolean }
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select('*').eq('business_id', businessId);
    if (order) q = q.order(order.column, { ascending: order.ascending });
    // Stable tiebreaker so pages never overlap or skip rows.
    q = q.order('id', { ascending: true }).range(from, from + PAGE - 1);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

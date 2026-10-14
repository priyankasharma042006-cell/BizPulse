import { useState, useEffect, type FormEvent } from 'react';
import { TrendingUp, TrendingDown, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Item } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { fetchAllRows } from '@/lib/fetchAll';
import { todayStr, parseLocalDate } from '@/lib/dates';

const expenseCategories = ['Rent', 'Supplies', 'Wages', 'Electricity', 'Transport', 'Other'];
const saleCategories = ['Grocery', 'Food', 'Clothing', 'Service', 'Other'];

export function QuickLog() {
  const { business } = useAuth();
  const [type, setType] = useState<'sale' | 'expense'>('sale');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function loadItems() {
    if (!business) return;
    try {
      setItems(await fetchAllRows<Item>('items', business.id, { column: 'name', ascending: true }));
    } catch (e) {
      console.error('Loading items failed:', e);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!business || saving) return;
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    const quantity = itemId ? (parseFloat(qty) || 1) : null;
    if (quantity !== null && quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);

    const insertData: Record<string, unknown> = {
      business_id: business.id,
      type,
      amount: value,
      note: note.trim() || (type === 'sale' ? saleCategories[0] : expenseCategories[0]),
      date: todayStr(), // local calendar day (UTC would log the wrong day in India after midnight)
    };
    if (itemId && quantity !== null) {
      insertData.item_id = itemId;
      insertData.qty = quantity;
    }

    const { error: insertError } = await supabase.from('transactions').insert(insertData);
    if (insertError) {
      console.error('Saving transaction failed:', insertError);
      setError(`Could not save: ${insertError.message}`);
      setSaving(false);
      return;
    }

    // Keep stock in step with the entry (sale = stock out, expense = stock in).
    if (itemId && quantity !== null) {
      const delta = type === 'sale' ? -quantity : quantity;
      const { error: rpcError } = await supabase.rpc('adjust_item_stock', { p_item_id: itemId, p_delta: delta });
      if (rpcError) {
        // Function not deployed yet: fall back to read-then-write using the freshest stock value.
        const { data: fresh } = await supabase.from('items').select('stock').eq('id', itemId).maybeSingle();
        if (fresh) {
          const { error: updError } = await supabase
            .from('items')
            .update({ stock: Math.max(0, Number(fresh.stock) + delta) })
            .eq('id', itemId);
          if (updError) setError(`Entry saved, but stock was not updated: ${updError.message}`);
        }
      }
      await loadItems(); // so the dropdown shows the new stock level
    }

    setSaving(false);
    setSuccess(true);
    setAmount('');
    setNote('');
    setItemId('');
    setQty('');
    setRefreshKey((k) => k + 1); // refresh Recent Entries
    setTimeout(() => setSuccess(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
      <h1 className="font-black uppercase text-2xl md:text-4xl tracking-tighter mb-6">Quick Log</h1>

      {/* Two large square buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setType('sale')}
          className={`border-2 md:border-4 border-black p-6 md:p-8 flex flex-col items-center gap-3 transition-all duration-200 ease-out ${
            type === 'sale'
              ? 'bg-primary-red text-white shadow-hard-4'
              : 'bg-white text-black shadow-hard-4 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
          }`}
        >
          <TrendingUp className="h-10 w-10" strokeWidth={2.5} />
          <span className="font-bold uppercase text-base md:text-lg tracking-wider">Sale</span>
        </button>
        <button
          onClick={() => setType('expense')}
          className={`border-2 md:border-4 border-black p-6 md:p-8 flex flex-col items-center gap-3 transition-all duration-200 ease-out ${
            type === 'expense'
              ? 'bg-primary-blue text-white shadow-hard-4'
              : 'bg-white text-black shadow-hard-4 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
          }`}
        >
          <TrendingDown className="h-10 w-10" strokeWidth={2.5} />
          <span className="font-bold uppercase text-base md:text-lg tracking-wider">Expense</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border-2 md:border-4 border-black shadow-hard-4 p-5 md:p-6 space-y-4">
        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red p-3 text-sm font-medium text-primary-red">
            {error}
          </div>
        )}
        <div>
          <label className="font-bold uppercase text-xs tracking-widest mb-2 block">
            Amount (INR) *
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border-2 border-black p-3 text-lg font-bold focus:outline-none focus:shadow-hard-4 transition-all"
            placeholder="0"
            autoFocus
          />
        </div>

        {/* Category quick-select */}
        <div>
          <label className="font-bold uppercase text-xs tracking-widest mb-2 block">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {(type === 'sale' ? saleCategories : expenseCategories).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setNote(cat)}
                className={`border-2 border-black px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  note === cat
                    ? type === 'sale' ? 'bg-primary-red text-white' : 'bg-primary-blue text-white'
                    : 'bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Link to item (optional) */}
        {items.length > 0 && (
          <div>
            <label className="font-bold uppercase text-xs tracking-widest mb-2 block">
              Link To Item (Optional)
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-hard-4 transition-all"
            >
              <option value="">— None —</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.stock} {item.unit} in stock)
                </option>
              ))}
            </select>
          </div>
        )}

        {itemId && (
          <div>
            <label className="font-bold uppercase text-xs tracking-widest mb-2 block">
              Quantity
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-hard-4 transition-all"
              placeholder="1"
            />
          </div>
        )}

        <div>
          <label className="font-bold uppercase text-xs tracking-widest mb-2 block">
            Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-hard-4 transition-all"
            placeholder="Add a note..."
          />
        </div>

        <Button
          variant={type === 'sale' ? 'red' : 'blue'}
          shape="square"
          className="w-full py-4 text-base"
          type="submit"
          disabled={saving}
        >
          {saving ? 'Saving...' : success ? (
            <span className="flex items-center gap-2">
              <Check className="h-5 w-5" /> Saved!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {type === 'sale' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              Log {type === 'sale' ? 'Sale' : 'Expense'}
            </span>
          )}
        </Button>
      </form>

      {/* Recent entries */}
      <RecentEntries refreshKey={refreshKey} />
    </div>
  );
}

function RecentEntries({ refreshKey }: { refreshKey: number }) {
  const { business } = useAuth();
  const [recent, setRecent] = useState<{ id: string; type: string; amount: number; note: string | null; date: string }[]>([]);

  useEffect(() => {
    if (!business) return;
    supabase
      .from('transactions')
      .select('id, type, amount, note, date')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data, error: recentError }) => {
        if (recentError) console.error('Loading recent entries failed:', recentError);
        else setRecent(data ?? []);
      });
  }, [business, refreshKey]);

  if (recent.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="font-bold uppercase text-sm tracking-widest mb-3">Recent Entries</h2>
      <div className="space-y-2">
        {recent.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 bg-white border-2 border-black p-3 shadow-hard-4"
          >
            {entry.type === 'sale' ? (
              <TrendingUp className="h-5 w-5 text-primary-red flex-shrink-0" strokeWidth={2.5} />
            ) : (
              <TrendingDown className="h-5 w-5 text-primary-blue flex-shrink-0" strokeWidth={2.5} />
            )}
            <div className="flex-1">
              <span className="font-bold text-sm">₹{entry.amount.toLocaleString('en-IN')}</span>
              {entry.note && <span className="text-xs text-gray-500 ml-2">{entry.note}</span>}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {parseLocalDate(entry.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

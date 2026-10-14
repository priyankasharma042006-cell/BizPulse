import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { firebaseAuth } from '@/lib/firebase';
import { fetchAllRows } from '@/lib/fetchAll';
import { buildModel, type BusinessModel } from '@/lib/model';
import type { Transaction, Item, Bill } from '@/lib/supabase';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function AIChat() {
  const { business } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I am your business co-pilot. Ask me anything about your sales, expenses, cash flow, or inventory.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !business || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    let snapshot: { model: BusinessModel; items: Item[]; bills: Bill[] } | null = null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000); // never leave the typing dots forever

    try {
      // Gather ALL business data (paginated) to build aggregated context
      const [transactions, items, bills] = await Promise.all([
        fetchAllRows<Transaction>('transactions', business.id, { column: 'date', ascending: true }),
        fetchAllRows<Item>('items', business.id),
        fetchAllRows<Bill>('bills', business.id),
      ]);
      const model = buildModel(business, transactions, items, bills);
      snapshot = { model, items, bills };
      const { daily, balance, health, cash, week } = model;

      const totalSales = transactions.filter((t) => t.type === 'sale').reduce((a, t) => a + Number(t.amount), 0);
      const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0);

      // Aggregated context only (no personal/customer data)
      const context = {
        business: { name: business.name, type: business.type, opening_balance: business.opening_balance },
        summary: {
          current_balance: Math.round(balance),
          total_sales: Math.round(totalSales),
          total_expenses: Math.round(totalExpenses),
          transaction_count: transactions.length,
          item_count: items.length,
          health_score: health.score,
          health_reasons: health.reasons,
          runway_days: cash.runwayDays,
          risk_date: cash.riskDate,
          sales_change_pct: week.changePct === null ? null : Math.round(week.changePct),
        },
        last_7_days: daily.slice(-7).map((d) => ({ date: d.date, sales: Math.round(d.sales), expenses: Math.round(d.expenses) })),
        low_stock_items: items.filter((i) => i.stock <= i.reorder_level && i.reorder_level > 0).map((i) => ({
          name: i.name, stock: i.stock, unit: i.unit, reorder_level: i.reorder_level,
        })),
        pending_bills: bills.filter((b) => b.status === 'pending').map((b) => ({
          payee: b.payee, amount: b.amount, due_date: b.due_date,
        })),
      };

      // The edge function verifies the user's Firebase ID token itself.
      const token = await firebaseAuth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({ question: userMsg, context }),
      });

      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json();
      if (!data.answer) throw new Error('Invalid response from AI');

      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      console.error('AI chat failed:', e);
      setMessages((prev) => [...prev, { role: 'assistant', content: localAnswer(userMsg, snapshot) }]);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary-blue border-2 border-black flex items-center justify-center shadow-hard-4">
          <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-black uppercase text-xl tracking-tighter">Ask Your Business</h1>
          <p className="text-xs font-medium text-gray-500">AI-powered answers from your data</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pb-4 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] border-2 border-black p-3 md:p-4 ${
                msg.role === 'user'
                  ? 'bg-primary-red text-white shadow-hard-4'
                  : 'bg-white shadow-hard-4'
              }`}
            >
              <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-black p-4 shadow-hard-4">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-primary-red animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-primary-yellow animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-primary-blue animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about your business..."
          className="flex-1 border-2 border-black p-3 focus:outline-none focus:shadow-hard-4 transition-all text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-primary-blue text-white border-2 border-black p-3 shadow-hard-4 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
        >
          <Send className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            'How is my cash flow?',
            'What should I reorder?',
            'What is my health score?',
            'What are my biggest expenses?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-primary-yellow transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Offline answer built from the user's own numbers, used when the AI service can't be reached. */
function localAnswer(
  question: string,
  snap: { model: BusinessModel; items: Item[]; bills: Bill[] } | null
): string {
  const prefix = 'The AI service is unreachable right now, so here is what your data says: ';
  if (!snap) {
    return 'I could not load your data or reach the AI service. Please check your connection and try again.';
  }
  const { model, items, bills } = snap;
  const q = question.toLowerCase();
  const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  if (/cash|balance|flow|runway/.test(q)) {
    const { runwayDays, riskDate } = model.cash;
    return prefix + `your balance is ${inr(model.balance)}. ` + (runwayDays
      ? `It may go negative in about ${runwayDays} days (around ${riskDate}).`
      : 'No cash shortfall is projected in the next 30 days.');
  }
  if (/reorder|stock|inventory/.test(q)) {
    const low = items.filter((i) => i.reorder_level > 0 && i.stock <= i.reorder_level);
    return prefix + (low.length === 0
      ? 'all items are above their reorder levels.'
      : `${low.length} item(s) are low: ${low.map((i) => `${i.name} (${i.stock} ${i.unit})`).join(', ')}.`);
  }
  if (/health|score/.test(q)) {
    const r = model.health.reasons.map((x) => x.label).join(', ');
    return prefix + `your health score is ${model.health.score}/100` + (r ? `, held back by: ${r}.` : '.');
  }
  if (/bill|pay|due/.test(q)) {
    const pending = bills.filter((b) => b.status === 'pending');
    return prefix + (pending.length === 0
      ? 'you have no pending bills.'
      : pending.map((b) => `${b.payee} ${inr(b.amount)} due ${b.due_date}`).join('; ') + '.');
  }
  return prefix + `balance ${inr(model.balance)}, health score ${model.health.score}/100, sales this week ${inr(model.week.last7)}.`;
}

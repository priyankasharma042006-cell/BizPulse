import { useMemo, useState } from 'react';
import { Sparkles, ArrowRight, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { useBusinessData } from '@/hooks/useBusinessData';
import { Spinner, ErrorState } from '@/components/ScreenState';
import { buildModel } from '@/lib/model';
import { firebaseAuth } from '@/lib/firebase';

export function Insights() {
  const { business, transactions, items, bills, loading, error, reload } = useBusinessData();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [aiError, setAiError] = useState<string | null>(null);
  const model = useMemo(
    () => (business && !loading && !error ? buildModel(business, transactions, items, bills) : null),
    [business, transactions, items, bills, loading, error]
  );

  async function fetchAISummary() {
    if (!business || !model) return;
    setAiLoading(true);
    setAiError(null);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const { balance, health, cash, alerts, daily, week } = model;
      const totalSales = transactions.filter((t) => t.type === 'sale').reduce((a, t) => a + Number(t.amount), 0);
      const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0);
      const context = {
        business: { name: business.name, type: business.type },
        summary: {
          current_balance: Math.round(balance),
          total_sales: Math.round(totalSales),
          total_expenses: Math.round(totalExpenses),
          health_score: health.score,
          health_reasons: health.reasons,
          runway_days: cash.runwayDays,
          risk_date: cash.riskDate,
          sales_change_pct: week.changePct === null ? null : Math.round(week.changePct),
        },
        last_7_days: daily.slice(-7).map((d) => ({ date: d.date, sales: Math.round(d.sales), expenses: Math.round(d.expenses) })),
        top_alerts: alerts.slice(0, 3),
      };
      const token = await firebaseAuth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({
          question: 'Give me a weekly insight digest: summarize what changed, how the business is doing, and the top 3 actions to take next week. Keep it concise and plain-language.',
          context,
        }),
      });
      if (!response.ok) throw new Error(`AI service returned ${response.status}`);
      const data = await response.json();
      if (!data.answer) throw new Error('Empty response');
      setAiSummary(data.answer);
    } catch (e) {
      console.error('AI summary failed:', e);
      setAiError('Could not reach the AI service. Please try again in a moment.');
    } finally {
      clearTimeout(timer);
      setAiLoading(false);
    }
  }

  if (loading) return <Spinner />;
  if (error || !model) return <ErrorState message={error ?? 'No business found.'} onRetry={reload} />;

  const { health, alerts, week } = model;
  const topActions = alerts.slice(0, 3);
  const last7Sales = week.last7;
  const salesChange = week.changePct;

  if (transactions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 text-center">
        <h1 className="font-black uppercase text-2xl md:text-4xl tracking-tighter mb-4">Weekly Digest</h1>
        <p className="text-sm font-medium text-gray-600">Log some sales and expenses first, then come back for insights.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Poster headline */}
      <div className="border-b-4 border-black pb-6">
        <span className="font-bold uppercase text-xs tracking-widest text-primary-red mb-3 block">
          Weekly Digest
        </span>
        <h1 className="font-black uppercase text-3xl sm:text-4xl lg:text-6xl tracking-tighter leading-[0.9]">
          {salesChange === null ? 'Your Week' : salesChange >= 0 ? 'Sales Are Up' : 'Sales Are Down'}<br />
          {salesChange === null ? 'So Far' : `${Math.abs(Math.round(salesChange))}% This Week`}
        </h1>
      </div>

      {/* AI Summary */}
      <div className="bg-primary-blue text-white border-2 md:border-4 border-black shadow-hard-4 p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5" strokeWidth={2.5} />
          <h2 className="font-bold uppercase text-sm tracking-widest">AI Summary</h2>
        </div>
        {aiSummary ? (
          <p className="text-sm md:text-base font-medium leading-relaxed">{aiSummary}</p>
        ) : aiLoading ? (
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 rounded-full bg-primary-yellow animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium mb-4 opacity-90">
              Get a plain-language summary of your week from AI.
            </p>
            {aiError && <p className="text-sm font-bold mb-3 bg-white text-primary-red border-2 border-black p-2">{aiError}</p>}
            <button
              onClick={fetchAISummary}
              className="bg-primary-yellow text-black border-2 border-black px-4 py-2 font-bold uppercase text-xs tracking-wider shadow-hard-4 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {aiError ? 'Try Again' : 'Generate Summary'}
            </button>
          </div>
        )}
      </div>

      {/* Top 3 action cards */}
      <section>
        <h2 className="font-bold uppercase text-sm tracking-widest mb-4">Top 3 Actions This Week</h2>
        {topActions.length > 0 ? (
          <div className="space-y-3">
            {topActions.map((action, i) => {
              const isCritical = action.severity === 'critical';
              const Icon = isCritical ? AlertTriangle : action.kind.includes('stock') ? Package : TrendingUp;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-4 border-2 md:border-4 border-black shadow-hard-4 p-4 md:p-5 ${
                    isCritical ? 'bg-primary-red text-white' : action.severity === 'warning' ? 'bg-primary-yellow' : 'bg-white'
                  }`}
                >
                  <div className={`h-10 w-10 flex-shrink-0 border-2 border-black flex items-center justify-center ${
                    isCritical ? 'bg-white' : 'bg-primary-blue'
                  }`}>
                    <Icon className={`h-5 w-5 ${isCritical ? 'text-primary-red' : 'text-white'}`} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm mb-1">{action.reason}</p>
                    <p className={`text-xs font-medium ${isCritical ? 'text-white/80' : 'text-gray-600'}`}>
                      → {action.suggested_action}
                    </p>
                  </div>
                  <ArrowRight className={`h-5 w-5 flex-shrink-0 ${isCritical ? 'text-white' : 'text-black'}`} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 md:border-4 border-black shadow-hard-4 p-5 text-center">
            <p className="text-sm font-medium text-gray-600">No urgent actions. Your business looks healthy!</p>
          </div>
        )}
      </section>

      {/* Week stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border-2 md:border-4 border-black shadow-hard-4 p-4 md:p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Sales This Week</div>
          <div className="font-black text-2xl tracking-tighter">₹{Math.round(last7Sales).toLocaleString('en-IN')}</div>
          <div className={`text-xs font-bold mt-1 ${salesChange === null ? 'text-gray-500' : salesChange >= 0 ? 'text-primary-blue' : 'text-primary-red'}`}>
            {salesChange === null ? 'No data for last week yet' : `${salesChange >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(salesChange))}% vs last week`}
          </div>
        </div>
        <div className="bg-white border-2 md:border-4 border-black shadow-hard-4 p-4 md:p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Health Score</div>
          <div className="font-black text-2xl tracking-tighter" style={{
            color: health.score >= 70 ? '#1040C0' : health.score >= 40 ? '#F0C020' : '#D02020',
          }}>
            {health.score}/100
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">{health.reasons.length} factors</div>
        </div>
      </div>
    </div>
  );
}

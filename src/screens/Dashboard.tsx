import { TrendingDown, TrendingUp, Wallet, AlertTriangle, Info, Package, ArrowRight, Circle, Square } from 'lucide-react';
import { useBusinessData } from '@/hooks/useBusinessData';
import { Spinner, ErrorState } from '@/components/ScreenState';
import type { AppScreen } from '@/components/AppShell';
import { useMemo } from 'react';
import { buildModel } from '@/lib/model';

export function Dashboard({ onNavigate }: { onNavigate?: (s: AppScreen) => void }) {
  const { business, transactions, items, bills, loading, error, reload } = useBusinessData();

  const model = useMemo(
    () => (business && !loading && !error ? buildModel(business, transactions, items, bills) : null),
    [business, transactions, items, bills, loading, error]
  );

  if (loading) return <Spinner tall />;
  if (error || !model) return <ErrorState message={error ?? 'No business found.'} onRetry={reload} />;

  const { balance: currentBalance, cash, health, alerts: alertSuggestions, todaySales, forecast } = model;
  const { projections, runwayDays, riskDate } = cash;
  const hasData = transactions.length > 0;
  const healthColor = !hasData
    ? '#121212'
    : health.score >= 70 ? '#1040C0' : health.score >= 40 ? '#F0C020' : '#D02020';

  return (
    <div className="pb-6">
      {/* Stat band — yellow */}
      <section className="bg-primary-yellow border-b-4 border-black">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x-2 divide-black">
          {/* Cash balance */}
          <div className="p-4 md:p-6 flex flex-col items-center text-center">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white border-2 md:border-4 border-black flex items-center justify-center shadow-hard-4 mb-3">
              <Wallet className="h-7 w-7 md:h-9 md:w-9" strokeWidth={2.5} />
            </div>
            <span className="font-black text-xl md:text-2xl tracking-tighter">
              ₹{Math.round(currentBalance).toLocaleString('en-IN')}
            </span>
            <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest mt-1">Balance</span>
          </div>

          {/* Runway days */}
          <div className="p-4 md:p-6 flex flex-col items-center text-center">
            <div className="h-16 w-16 md:h-20 md:w-20 bg-white border-2 md:border-4 border-black flex items-center justify-center shadow-hard-4 mb-3 rotate-45">
              <span className="font-black text-lg md:text-xl tracking-tighter -rotate-45">
                {runwayDays ?? '∞'}
              </span>
            </div>
            <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest">Runway Days</span>
          </div>

          {/* Health score */}
          <div className="p-4 md:p-6 flex flex-col items-center text-center">
            <div
              className="h-16 w-16 md:h-20 md:w-20 rounded-full border-2 md:border-4 border-black flex items-center justify-center shadow-hard-4 mb-3"
              style={{ backgroundColor: healthColor }}
            >
              <span className="font-black text-lg md:text-xl tracking-tighter text-white">
                {hasData ? health.score : '—'}
              </span>
            </div>
            <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest">Health Score</span>
          </div>

          {/* Today's sales */}
          <div className="p-4 md:p-6 flex flex-col items-center text-center">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white border-2 md:border-4 border-black flex items-center justify-center shadow-hard-4 mb-3">
              <TrendingUp className="h-7 w-7 md:h-9 md:w-9 text-primary-blue" strokeWidth={2.5} />
            </div>
            <span className="font-black text-xl md:text-2xl tracking-tighter">
              ₹{Math.round(todaySales).toLocaleString('en-IN')}
            </span>
            <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest mt-1">Sales Today</span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Alert cards */}
        {alertSuggestions.length > 0 && (
          <section>
            <h2 className="font-bold uppercase text-sm tracking-widest mb-4">Alerts</h2>
            <div className="space-y-3">
              {alertSuggestions.slice(0, 5).map((alert, i) => {
                const isCritical = alert.severity === 'critical';
                const isWarning = alert.severity === 'warning';
                const bgClass = isCritical
                  ? 'bg-primary-red text-white'
                  : isWarning
                    ? 'bg-primary-yellow'
                    : 'bg-primary-blue text-white';
                const Icon = isCritical ? AlertTriangle : isWarning ? Info : Info;
                return (
                  <div
                    key={i}
                    className={`border-2 md:border-4 border-black shadow-hard-4 p-4 md:p-5 flex items-start gap-4 ${bgClass}`}
                  >
                    <Icon className="h-6 w-6 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <div className="flex-1">
                      <p className="font-bold text-sm md:text-base mb-1">{alert.reason}</p>
                      {alert.suggested_action && (
                        <p className={`text-xs md:text-sm font-medium ${isWarning ? 'text-black/70' : 'text-white/80'}`}>
                          → {alert.suggested_action}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* No data state */}
        {transactions.length === 0 && (
          <section className="bg-white border-2 md:border-4 border-black shadow-hard-4 p-6 md:p-8 text-center">
            <Circle className="h-12 w-12 mx-auto mb-4" fill="#F0C020" stroke="#121212" strokeWidth={2} />
            <h3 className="font-bold uppercase text-lg tracking-tight mb-2">Learning Your Shop</h3>
            <p className="text-sm font-medium text-gray-600 mb-4">
              Log your first sale or expense to start seeing forecasts, alerts, and your health score.
            </p>
            <button
              onClick={() => onNavigate?.('quick-log')}
              className="inline-flex items-center gap-2 font-bold uppercase text-sm tracking-wider text-primary-red hover:underline"
            >
              Log Your First Entry <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        )}

        {/* Health score breakdown */}
        {health.reasons.length > 0 && (
          <section className="bg-white border-2 md:border-4 border-black shadow-hard-4 p-5 md:p-6">
            <h2 className="font-bold uppercase text-sm tracking-widest mb-4">Health Score Breakdown</h2>
            <div className="space-y-2">
              {health.reasons.map((reason, i) => (
                <div key={i} className="flex items-center justify-between border-b border-black/10 pb-2">
                  <span className="text-sm font-medium">{reason.label}</span>
                  <span className="font-bold text-sm text-primary-red">-{reason.points} pts</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold uppercase text-sm tracking-wider">Current Score</span>
                <span className="font-black text-lg" style={{ color: healthColor }}>{hasData ? `${health.score}/100` : '—'}</span>
              </div>
            </div>
          </section>
        )}

        {/* Forecast panel */}
        {forecast.forecast.length > 0 && (
          <section className="bg-primary-blue text-white border-2 md:border-4 border-black shadow-hard-4 p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-6 w-6" strokeWidth={2.5} />
              <h2 className="font-bold uppercase text-sm tracking-widest">7-Day Sales Forecast</h2>
              <span className="ml-auto font-bold uppercase text-[10px] tracking-widest bg-white text-primary-blue px-2 py-1 border-2 border-black">
                {forecast.confidence}
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {forecast.forecast.map((val, i) => {
                const max = Math.max(...forecast.forecast, 1);
                const heightPct = (val / max) * 100;
                return (
                  <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                    <span className="text-[10px] font-bold">₹{val.toLocaleString('en-IN')}</span>
                    <div
                      className="w-full bg-primary-yellow border-2 border-black transition-all duration-300"
                      style={{ height: `${Math.max(heightPct * 0.65, 3)}%`, minHeight: '4px' }}
                    />
                    <span className="text-[10px] font-bold uppercase">{forecast.labels[i]}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Cash projection */}
        {projections.length > 0 && (
          <section className="bg-white border-2 md:border-4 border-black shadow-hard-4 p-5 md:p-6">
            <h2 className="font-bold uppercase text-sm tracking-widest mb-4">30-Day Cash Projection</h2>
            {riskDate ? (
              <div className="flex items-center gap-3 mb-4 bg-primary-red/10 border-2 border-primary-red p-3">
                <AlertTriangle className="h-5 w-5 text-primary-red flex-shrink-0" />
                <span className="text-sm font-medium">
                  Balance may go negative around <strong>{riskDate}</strong> ({runwayDays} days).
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4 bg-primary-blue/10 border-2 border-primary-blue p-3">
                <Info className="h-5 w-5 text-primary-blue flex-shrink-0" />
                <span className="text-sm font-medium">No cash shortfall projected in the next 30 days.</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {[9, 19, 29].filter((i) => projections[i]).map((i) => ({ p: projections[i], day: i + 1 })).map(({ p, day }) => (
                <div key={day} className="text-center border-2 border-black p-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Day {day}
                  </div>
                  <div className={`font-black text-sm ${p.projectedBalance < 0 ? 'text-primary-red' : ''}`}>
                    ₹{p.projectedBalance.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {Math.round(p.probabilityNegative * 100)}% risk
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Low stock items */}
        {items.filter((i) => i.stock <= i.reorder_level && i.reorder_level > 0).length > 0 && (
          <section className="bg-white border-2 md:border-4 border-black shadow-hard-4 p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5" strokeWidth={2.5} />
              <h2 className="font-bold uppercase text-sm tracking-widest">Low Stock</h2>
            </div>
            <div className="space-y-2">
              {items.filter((i) => i.stock <= i.reorder_level && i.reorder_level > 0).map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-black/10 pb-2">
                  <div>
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {item.stock} {item.unit} left (reorder at {item.reorder_level})
                    </span>
                  </div>
                  <Square className="h-4 w-4" fill="#D02020" stroke="#D02020" strokeWidth={1} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

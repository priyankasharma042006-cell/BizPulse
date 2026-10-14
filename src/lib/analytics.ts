import type { Transaction, Item, Bill } from './supabase';
import { addDays, daysBetween, parseLocalDate, toDateStr, todayStr } from './dates';

export type DailyData = {
  date: string;
  sales: number;
  expenses: number;
};

export type CashProjection = {
  date: string;
  projectedBalance: number;
  probabilityNegative: number;
};

export type CashFlowResult = {
  projections: CashProjection[];
  runwayDays: number | null;
  riskDate: string | null;
};

export type HealthScore = {
  score: number;
  reasons: { label: string; points: number }[];
};

export type ForecastResult = {
  forecast: number[];
  confidence: 'low' | 'medium' | 'high';
  labels: string[];
};

export type AlertSuggestion = {
  kind: string;
  severity: 'critical' | 'warning' | 'info';
  reason: string;
  suggested_action: string;
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Groups transactions into daily sales/expense totals (only days that have entries). */
export function buildDailyData(transactions: Transaction[]): DailyData[] {
  const map = new Map<string, DailyData>();
  for (const t of transactions) {
    const existing = map.get(t.date) ?? { date: t.date, sales: 0, expenses: 0 };
    if (t.type === 'sale') existing.sales += Number(t.amount);
    else existing.expenses += Number(t.amount);
    map.set(t.date, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Every calendar day from the first entry up to today, with zeros for days that had no entries.
 * Averaging only over days that HAVE entries overstates daily sales, so all statistics use this.
 */
export function continuousDays(daily: DailyData[]): DailyData[] {
  if (daily.length === 0) return [];
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const start = parseLocalDate(daily[0].date);
  const today = parseLocalDate(todayStr());
  const lastEntry = parseLocalDate(daily[daily.length - 1].date);
  const end = lastEntry > today ? lastEntry : today;
  const out: DailyData[] = [];
  const n = daysBetween(start, end);
  for (let i = 0; i <= n; i++) {
    const date = toDateStr(addDays(start, i));
    out.push(byDate.get(date) ?? { date, sales: 0, expenses: 0 });
  }
  return out;
}

/** The last `n` calendar days ending today (zeros included). Independent of how many days have entries. */
export function lastNDays(daily: DailyData[], n: number, offset = 0): DailyData[] {
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const today = parseLocalDate(todayStr());
  const out: DailyData[] = [];
  for (let i = n - 1 + offset; i >= offset; i--) {
    const date = toDateStr(addDays(today, -i));
    out.push(byDate.get(date) ?? { date, sales: 0, expenses: 0 });
  }
  return out;
}

/** This week (last 7 days) vs the 7 days before. `changePct` is null when there is no prior week to compare. */
export function weekOverWeek(daily: DailyData[]) {
  const last7 = sum(lastNDays(daily, 7).map((d) => d.sales));
  const prev7 = sum(lastNDays(daily, 7, 7).map((d) => d.sales));
  const changePct = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : null;
  return { last7, prev7, changePct };
}

/** Cash on hand: opening balance + all sales − all expenses. */
export function currentBalance(openingBalance: number, transactions: Transaction[]): number {
  let bal = Number(openingBalance) || 0;
  for (const t of transactions) bal += t.type === 'sale' ? Number(t.amount) : -Number(t.amount);
  return bal;
}

/**
 * Day-of-week seasonality forecast with a bounded recent-trend multiplier.
 * Falls back to a plain average with <14 days of history.
 */
export function forecastDemand(dailyEntries: DailyData[], daysAhead = 7): ForecastResult {
  if (dailyEntries.length === 0) {
    return { forecast: [], confidence: 'low', labels: [] };
  }
  const daily = continuousDays(dailyEntries);
  const sales = daily.map((d) => d.sales);
  const labels: string[] = [];
  const forecast: number[] = [];
  const today = parseLocalDate(todayStr());

  if (daily.length < 14) {
    const avg = sum(sales) / sales.length;
    for (let i = 1; i <= daysAhead; i++) {
      labels.push(addDays(today, i).toLocaleDateString('en', { weekday: 'short' }));
      forecast.push(Math.round(avg));
    }
    return { forecast, confidence: 'low', labels };
  }

  const dowBuckets: number[][] = [[], [], [], [], [], [], []];
  for (const d of daily) dowBuckets[parseLocalDate(d.date).getDay()].push(d.sales);
  const overall = sum(sales) / sales.length;
  const dowMeans = dowBuckets.map((arr) => (arr.length > 0 ? sum(arr) / arr.length : overall));

  const recent7 = sum(sales.slice(-7)) / 7;
  const prev7 = sum(sales.slice(-14, -7)) / 7;
  // Clamp so one odd week can't produce a wild forecast.
  const trend = prev7 > 0 ? Math.min(1.5, Math.max(0.5, recent7 / prev7)) : 1;

  for (let i = 1; i <= daysAhead; i++) {
    const d = addDays(today, i);
    labels.push(d.toLocaleDateString('en', { weekday: 'short' }));
    forecast.push(Math.max(0, Math.round(dowMeans[d.getDay()] * trend)));
  }
  return { forecast, confidence: daily.length >= 56 ? 'high' : 'medium', labels };
}

function randn(): number {
  // Box–Muller
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Monte Carlo cash-flow projection (1000 independent paths).
 * `startingBalance` must be the CURRENT balance (see currentBalance), not the opening balance.
 */
export function projectCashFlow(
  startingBalance: number,
  dailyEntries: DailyData[],
  bills: Bill[],
  daysAhead = 30
): CashFlowResult {
  if (dailyEntries.length === 0) {
    return { projections: [], runwayDays: null, riskDate: null };
  }
  const daily = continuousDays(dailyEntries);
  const sales = daily.map((d) => d.sales);
  const expenses = daily.map((d) => d.expenses);
  const avgSales = sum(sales) / sales.length;
  const avgExpenses = sum(expenses) / expenses.length;
  const salesStd = Math.sqrt(sum(sales.map((v) => (v - avgSales) ** 2)) / sales.length);
  const expenseStd = Math.sqrt(sum(expenses.map((v) => (v - avgExpenses) ** 2)) / expenses.length);

  // Unpaid bills falling due inside the window, by day offset (1 = tomorrow). Overdue bills hit on day 1.
  const today = parseLocalDate(todayStr());
  const billByDay = new Map<number, number>();
  for (const bill of bills) {
    if (bill.status === 'paid') continue;
    const offset = Math.max(1, daysBetween(today, parseLocalDate(bill.due_date)));
    if (offset <= daysAhead) billByDay.set(offset, (billByDay.get(offset) ?? 0) + Number(bill.amount));
  }

  const runs = 1000;
  const balances = new Float64Array(runs).fill(startingBalance); // each run carries its OWN path
  const projections: CashProjection[] = [];
  let runwayDays: number | null = null;
  let riskDate: string | null = null;

  for (let day = 1; day <= daysAhead; day++) {
    const billAmount = billByDay.get(day) ?? 0;
    let negative = 0;
    let total = 0;
    for (let r = 0; r < runs; r++) {
      const daySales = Math.max(0, avgSales + randn() * salesStd);
      const dayExpenses = Math.max(0, avgExpenses + randn() * expenseStd);
      balances[r] += daySales - dayExpenses - billAmount;
      total += balances[r];
      if (balances[r] < 0) negative++;
    }
    const avgBalance = total / runs;
    const dateStr = toDateStr(addDays(today, day));
    projections.push({
      date: dateStr,
      projectedBalance: Math.round(avgBalance),
      probabilityNegative: negative / runs,
    });
    if (runwayDays === null && avgBalance < 0) {
      runwayDays = day;
      riskDate = dateStr;
    }
  }
  return { projections, runwayDays, riskDate };
}

/** Business health score (0-100) with explainable deductions. */
export function computeHealthScore(
  balance: number,
  daily: DailyData[],
  items: Item[],
  bills: Bill[]
): HealthScore {
  const reasons: { label: string; points: number }[] = [];
  if (daily.length === 0) return { score: 100, reasons };
  let score = 100;

  const week = lastNDays(daily, 7);
  const weekSales = sum(week.map((d) => d.sales));
  const weekExpenses = sum(week.map((d) => d.expenses));

  // Liquidity (30): days of expenses the balance covers
  const dailyExpenses = weekExpenses / 7;
  const runwayDays = dailyExpenses > 0 ? balance / dailyExpenses : 999;
  if (runwayDays < 7) {
    const deduction = Math.round((1 - Math.max(0, runwayDays) / 7) * 30);
    score -= deduction;
    reasons.push({ label: 'Low cash runway', points: deduction });
  }

  // Margin (25)
  const margin = weekSales > 0 ? (weekSales - weekExpenses) / weekSales : 0;
  if (margin < 0.1) {
    const deduction = Math.round(((0.1 - Math.max(margin, 0)) / 0.1) * 25);
    score -= deduction;
    reasons.push({ label: 'Thin profit margin', points: deduction });
  }

  // Stock (15)
  const lowStock = items.filter((i) => i.reorder_level > 0 && i.stock <= i.reorder_level);
  if (items.length > 0 && lowStock.length > 0) {
    const deduction = Math.round((lowStock.length / items.length) * 15);
    score -= deduction;
    reasons.push({ label: `${lowStock.length} items need reorder`, points: deduction });
  }

  // Overdue bills (20)
  const today = todayStr();
  const overdue = bills.filter((b) => b.status === 'pending' && b.due_date < today);
  if (overdue.length > 0) {
    const deduction = Math.min(20, overdue.length * 5);
    score -= deduction;
    reasons.push({ label: `${overdue.length} overdue bills`, points: deduction });
  }

  // Consistency (10): days with sales in the last 14 calendar days
  const activeDays = lastNDays(daily, 14).filter((d) => d.sales > 0).length;
  if (activeDays < 10) {
    const deduction = Math.round((1 - activeDays / 10) * 10);
    score -= deduction;
    reasons.push({ label: 'Irregular logging', points: deduction });
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

/** Alert suggestions from the data. Pass a precomputed `cash` result to avoid re-running the simulation. */
export function generateAlerts(
  balance: number,
  daily: DailyData[],
  items: Item[],
  bills: Bill[],
  cash?: CashFlowResult
): AlertSuggestion[] {
  const alerts: AlertSuggestion[] = [];

  const { runwayDays, riskDate } = cash ?? projectCashFlow(balance, daily, bills, 30);
  if (runwayDays !== null) {
    alerts.push({
      kind: 'cash_risk',
      severity: runwayDays <= 14 ? 'critical' : 'warning',
      reason: `Your balance may go negative in ${runwayDays} days (around ${riskDate}).`,
      suggested_action:
        runwayDays <= 14
          ? 'Collect receivables, delay non-essential expenses, or arrange short-term credit now.'
          : 'Review upcoming bills and consider collecting receivables early.',
    });
  } else if (balance < 0) {
    alerts.push({
      kind: 'cash_risk',
      severity: 'critical',
      reason: 'Your balance is already negative.',
      suggested_action: 'Collect receivables and hold non-essential spending until cash recovers.',
    });
  }

  const lowStock = items.filter((i) => i.reorder_level > 0 && i.stock <= i.reorder_level);
  for (const item of lowStock.slice(0, 3)) {
    alerts.push({
      kind: 'low_stock',
      severity: 'warning',
      reason: `${item.name} is at or below reorder level (${item.stock} ${item.unit} left).`,
      suggested_action: `Order more ${item.name} before you run out.`,
    });
  }

  const today = todayStr();
  const overdue = bills.filter((b) => b.status === 'pending' && b.due_date < today);
  for (const bill of overdue.slice(0, 2)) {
    alerts.push({
      kind: 'overdue_bill',
      severity: 'critical',
      reason: `${bill.payee} bill of ${bill.amount} was due on ${bill.due_date} and is overdue.`,
      suggested_action: `Pay ${bill.payee} or negotiate a new due date.`,
    });
  }

  const { last7, prev7, changePct } = weekOverWeek(daily);
  if (prev7 > 0 && changePct !== null && last7 < prev7 * 0.6) {
    alerts.push({
      kind: 'sales_drop',
      severity: 'warning',
      reason: `Sales dropped ${Math.round(-changePct)}% compared to last week.`,
      suggested_action: 'Check for external factors or entry errors. Consider a promotion.',
    });
  }

  // Most urgent first, so "Top 3" really is the top 3.
  const rank = { critical: 0, warning: 1, info: 2 } as const;
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/**
 * Reorder suggestion from THIS item's own recent sales (quantity per day), not revenue.
 */
export function suggestReorder(
  item: Item,
  transactions: Transaction[],
  leadTimeDays = 3
): { shouldReorder: boolean; quantity: number; reason: string } {
  if (item.reorder_level <= 0) {
    return { shouldReorder: false, quantity: 0, reason: 'No reorder level set.' };
  }
  const shouldReorder = item.stock <= item.reorder_level;

  const since = toDateStr(addDays(parseLocalDate(todayStr()), -13));
  const soldQty = transactions
    .filter((t) => t.type === 'sale' && t.item_id === item.id && t.date >= since)
    .reduce((a, t) => a + (Number(t.qty) || 1), 0);
  const perDay = soldQty / 14;

  let target: number;
  let basis: string;
  if (perDay > 0) {
    target = perDay * leadTimeDays + perDay * 1.5; // lead-time demand + safety stock
    basis = `at ~${perDay.toFixed(1)} ${item.unit}/day`;
  } else {
    target = item.reorder_level * 2; // no recent sales data for this item
    basis = 'no recent sales logged for this item';
  }
  const quantity = Math.max(0, Math.ceil(target - item.stock));
  return {
    shouldReorder,
    quantity,
    reason: quantity > 0
      ? `Order about ${quantity} ${item.unit} (${basis}).`
      : 'Stock is adequate for now.',
  };
}

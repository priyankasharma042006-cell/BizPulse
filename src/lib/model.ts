import type { Business, Transaction, Item, Bill } from './supabase';
import {
  buildDailyData,
  computeHealthScore,
  currentBalance,
  forecastDemand,
  generateAlerts,
  projectCashFlow,
  weekOverWeek,
} from './analytics';
import { todayStr } from './dates';

/** Everything the Dashboard / Digest screens derive from raw rows, computed once. */
export function buildModel(business: Business, transactions: Transaction[], items: Item[], bills: Bill[]) {
  const daily = buildDailyData(transactions);
  const balance = currentBalance(business.opening_balance, transactions);
  const cash = projectCashFlow(balance, daily, bills, 30);
  const health = computeHealthScore(balance, daily, items, bills);
  const alerts = generateAlerts(balance, daily, items, bills, cash);
  const forecast = forecastDemand(daily, 7);
  const week = weekOverWeek(daily);
  const today = todayStr();
  const todayData = daily.find((d) => d.date === today);
  return {
    daily,
    balance,
    cash,
    health,
    alerts,
    forecast,
    week,
    todaySales: todayData?.sales ?? 0,
    todayExpenses: todayData?.expenses ?? 0,
  };
}

export type BusinessModel = ReturnType<typeof buildModel>;

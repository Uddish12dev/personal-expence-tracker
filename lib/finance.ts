import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  getDate,
  getDaysInMonth,
} from "date-fns";
import type { Transaction, TxnKind } from "./types";

export function monthKey(d: Date): string {
  return format(d, "yyyy-MM");
}

/** First day of the month as YYYY-MM-DD — used as the budgets.month value. */
export function monthStartISO(d: Date): string {
  return format(startOfMonth(d), "yyyy-MM-dd");
}

export function monthRange(d: Date): { from: string; to: string } {
  return {
    from: format(startOfMonth(d), "yyyy-MM-dd"),
    to: format(endOfMonth(d), "yyyy-MM-dd"),
  };
}

/** Parse a ?month=YYYY-MM param; falls back to the current month. */
export function parseMonthParam(value: string | undefined): Date {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const d = parseISO(`${value}-01`);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function sumByKind(txns: Transaction[], kind: TxnKind): number {
  return txns
    .filter((t) => t.kind === kind)
    .reduce((acc, t) => acc + Number(t.amount), 0);
}

export interface CategoryTotal {
  categoryId: string | null;
  name: string;
  color: string;
  total: number;
}

export function totalsByCategory(txns: Transaction[], kind: TxnKind): CategoryTotal[] {
  const map = new Map<string, CategoryTotal>();
  for (const t of txns) {
    if (t.kind !== kind) continue;
    const key = t.category_id ?? "uncategorized";
    const existing = map.get(key);
    const total = (existing?.total ?? 0) + Number(t.amount);
    map.set(key, {
      categoryId: t.category_id,
      name: existing?.name ?? t.categories?.name ?? "Uncategorized",
      color: existing?.color ?? t.categories?.color ?? "#94a3b8",
      total,
    });
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface MonthPoint {
  month: string; // "Sep" style label
  monthKey: string;
  income: number;
  expense: number;
}

/** Income vs expense totals for the last `count` months, oldest first. */
export function monthlySeries(txns: Transaction[], count = 6, now = new Date()): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    const range = monthRange(d);
    const inMonth = txns.filter(
      (t) => t.occurred_on >= range.from && t.occurred_on <= range.to
    );
    points.push({
      month: format(d, "MMM"),
      monthKey: monthKey(d),
      income: sumByKind(inMonth, "income"),
      expense: sumByKind(inMonth, "expense"),
    });
  }
  return points;
}

export interface DailyPoint {
  day: number;
  label: string;
  spent: number;
  cumulative: number;
}

/** Daily and cumulative spend within the given month. */
export function dailySpend(txns: Transaction[], month: Date): DailyPoint[] {
  const range = monthRange(month);
  const days = getDaysInMonth(month);
  const perDay = new Array<number>(days + 1).fill(0);
  for (const t of txns) {
    if (t.kind !== "expense") continue;
    if (t.occurred_on < range.from || t.occurred_on > range.to) continue;
    perDay[getDate(parseISO(t.occurred_on))] += Number(t.amount);
  }
  let cumulative = 0;
  const points: DailyPoint[] = [];
  for (let d = 1; d <= days; d++) {
    cumulative += perDay[d];
    points.push({ day: d, label: `${d}`, spent: perDay[d], cumulative });
  }
  return points;
}

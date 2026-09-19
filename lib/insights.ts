import { format } from "date-fns";
import type { Budget, Category, Transaction } from "./types";
import {
  monthRange,
  sumByKind,
  totalsByCategory,
} from "./finance";
import { formatCurrency } from "./utils";

export interface Insight {
  tone: "good" | "warn" | "info";
  title: string;
  body: string;
}

/**
 * Rules-based suggestions on how to spend money given the user's balance and
 * needs — the "suggests" part of the product. No ML, just transparent rules.
 */
export function buildInsights(opts: {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  currency: string;
  now?: Date;
}): Insight[] {
  const now = opts.now ?? new Date();
  const cur = monthRange(now);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = monthRange(prevDate);

  const inCur = opts.transactions.filter(
    (t) => t.occurred_on >= cur.from && t.occurred_on <= cur.to
  );
  const inPrev = opts.transactions.filter(
    (t) => t.occurred_on >= prev.from && t.occurred_on <= prev.to
  );

  const income = sumByKind(inCur, "income");
  const expense = sumByKind(inCur, "expense");
  const prevExpense = sumByKind(inPrev, "expense");
  const prevIncome = sumByKind(inPrev, "income");

  const insights: Insight[] = [];
  const money = (n: number) => formatCurrency(n, opts.currency);
  const monthName = format(now, "MMMM");

  if (opts.transactions.length === 0) {
    insights.push({
      tone: "info",
      title: "Start tracking",
      body: "Add your first income and expense transactions to unlock personalized spending insights.",
    });
    return insights;
  }

  // Savings rate
  if (income > 0) {
    const rate = (income - expense) / income;
    if (rate >= 0.2) {
      insights.push({
        tone: "good",
        title: `Healthy savings rate: ${(rate * 100).toFixed(0)}%`,
        body: `You kept ${money(income - expense)} of ${money(income)} in ${monthName}. You're on track — aim to stay above 20%.`,
      });
    } else if (rate >= 0) {
      insights.push({
        tone: "warn",
        title: `Low savings rate: ${(rate * 100).toFixed(0)}%`,
        body: `Only ${money(income - expense)} left from ${money(income)} this month. Try trimming your top category below.`,
      });
    } else {
      insights.push({
        tone: "warn",
        title: "Spending exceeds income",
        body: `You've spent ${money(expense)} against ${money(income)} income in ${monthName}. Review discretionary categories first.`,
      });
    }
  }

  // Month-over-month trend
  if (prevExpense > 0) {
    const delta = (expense - prevExpense) / prevExpense;
    if (delta > 0.15) {
      insights.push({
        tone: "warn",
        title: `Spending up ${(delta * 100).toFixed(0)}% vs last month`,
        body: `${money(expense)} vs ${money(prevExpense)} in ${format(prevDate, "MMMM")}. Check whether the increase is one-off or a pattern.`,
      });
    } else if (delta < -0.15) {
      insights.push({
        tone: "good",
        title: `Spending down ${(-delta * 100).toFixed(0)}% vs last month`,
        body: `Nice — ${money(expense)} vs ${money(prevExpense)} last month. Keep the streak going.`,
      });
    }
  } else if (prevIncome === 0 && prevExpense === 0) {
    insights.push({
      tone: "info",
      title: "No data for last month",
      body: "Insights get sharper once you have two or more months of history.",
    });
  }

  // Top category concentration
  const top = totalsByCategory(inCur, "expense")[0];
  if (top && expense > 0 && top.total / expense > 0.4) {
    insights.push({
      tone: "info",
      title: `${top.name} is ${((top.total / expense) * 100).toFixed(0)}% of spending`,
      body: `${money(top.total)} in ${monthName}. If that's not essential (e.g. rent), it's the best place to cut.`,
    });
  }

  // Budget overruns for the current month
  const monthBudgets = opts.budgets.filter((b) => b.month === cur.from);
  const spentByCat = new Map(
    totalsByCategory(inCur, "expense").map((c) => [c.categoryId, c.total])
  );
  for (const b of monthBudgets) {
    const spent = spentByCat.get(b.category_id) ?? 0;
    const cat = opts.categories.find((c) => c.id === b.category_id);
    if (spent > Number(b.amount)) {
      insights.push({
        tone: "warn",
        title: `Over budget: ${cat?.name ?? "category"}`,
        body: `${money(spent)} spent vs ${money(Number(b.amount))} budgeted — ${money(spent - Number(b.amount))} over.`,
      });
    }
  }

  // Needs vs wants heuristic: essentials are Rent/Utilities/Groceries/Health/Transport
  const essentials = new Set(["Rent", "Utilities", "Groceries", "Health", "Transport"]);
  const essentialSpend = totalsByCategory(inCur, "expense")
    .filter((c) => essentials.has(c.name))
    .reduce((a, c) => a + c.total, 0);
  if (income > 0 && essentialSpend / income > 0.5) {
    insights.push({
      tone: "warn",
      title: "Essentials eat >50% of income",
      body: `${money(essentialSpend)} on needs this month. The 50/30/20 rule suggests keeping needs near half of income.`,
    });
  }

  return insights.slice(0, 5);
}

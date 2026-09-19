import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  monthRange,
  sumByKind,
  totalsByCategory,
  monthlySeries,
  dailySpend,
} from "@/lib/finance";
import { buildInsights } from "@/lib/insights";
import { formatCurrency } from "@/lib/utils";
import type { Budget, Category, Transaction } from "@/lib/types";
import {
  SpendingDonut,
  IncomeExpenseBars,
  DailySpendArea,
} from "@/components/charts/DashboardCharts";
import { subMonths, format } from "date-fns";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const cur = monthRange(now);
  // Fetch 6 months of transactions for the trend chart — single query.
  const sixMonthsAgo = monthRange(subMonths(now, 5)).from;

  const [{ data: txns }, { data: cats }, { data: budgets }, { data: profile }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*, categories(id,name,color,kind)")
        .eq("user_id", user!.id)
        .gte("occurred_on", sixMonthsAgo)
        .order("occurred_on", { ascending: false }),
      supabase.from("categories").select("*").eq("user_id", user!.id),
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user!.id)
        .eq("month", cur.from),
      supabase
        .from("profiles")
        .select("full_name, currency")
        .eq("user_id", user!.id)
        .single(),
    ]);

  const transactions = (txns ?? []) as Transaction[];
  const categories = (cats ?? []) as Category[];
  const monthBudgets = (budgets ?? []) as Budget[];
  const currency = profile?.currency ?? "USD";
  const name = profile?.full_name?.split(" ")[0] ?? "there";

  const inMonth = transactions.filter(
    (t) => t.occurred_on >= cur.from && t.occurred_on <= cur.to
  );
  const income = sumByKind(inMonth, "income");
  const expense = sumByKind(inMonth, "expense");
  const net = income - expense;
  const savingsRate = income > 0 ? Math.max(0, (net / income) * 100) : 0;

  const categoryTotals = totalsByCategory(inMonth, "expense");
  const series = monthlySeries(transactions, 6, now);
  const daily = dailySpend(transactions, now);
  const spentByCat = new Map(categoryTotals.map((c) => [c.categoryId, c.total]));
  const insights = buildInsights({
    transactions,
    budgets: monthBudgets,
    categories,
    currency,
  });
  const recent = transactions.slice(0, 6);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Hey {name} — here&apos;s {format(now, "MMMM")} so far.
        </h1>
        <p className="text-sm text-ink-500">
          Your money at a glance: balance, budgets, and suggestions.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Income" value={formatCurrency(income, currency)} tone="mint" />
        <Stat label="Expenses" value={formatCurrency(expense, currency)} tone="rose" />
        <Stat
          label="Net balance"
          value={formatCurrency(net, currency)}
          tone={net >= 0 ? "mint" : "rose"}
        />
        <Stat label="Savings rate" value={`${savingsRate.toFixed(0)}%`} tone="ink" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold">Spending by category</h2>
          <SpendingDonut data={categoryTotals} currency={currency} />
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">Income vs expenses — last 6 months</h2>
          <IncomeExpenseBars data={series} currency={currency} />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">
          Cumulative spend — {format(now, "MMMM")}
        </h2>
        <DailySpendArea data={daily} currency={currency} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget progress */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Budget progress</h2>
            <Link href="/budgets" className="text-sm font-medium text-mint-600 hover:underline">
              Manage →
            </Link>
          </div>
          {monthBudgets.length === 0 ? (
            <p className="text-sm text-ink-400">
              No budgets for this month.{" "}
              <Link href="/budgets" className="text-mint-600 hover:underline">
                Set one up
              </Link>{" "}
              to keep categories in check.
            </p>
          ) : (
            <ul className="space-y-4">
              {monthBudgets.map((b) => {
                const cat = categories.find((c) => c.id === b.category_id);
                const spent = spentByCat.get(b.category_id) ?? 0;
                const limit = Number(b.amount);
                const pct = Math.min(100, (spent / limit) * 100);
                const over = spent > limit;
                return (
                  <li key={b.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{cat?.name ?? "Category"}</span>
                      <span className={over ? "font-semibold text-rose-600" : "text-ink-500"}>
                        {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: over ? "#f43f5e" : (cat?.color ?? "#10b981"),
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Insights */}
        <div className="card">
          <h2 className="mb-4 font-semibold">Insights &amp; suggestions</h2>
          <ul className="space-y-3">
            {insights.map((i, idx) => (
              <li
                key={idx}
                className={
                  i.tone === "warn"
                    ? "rounded-xl border border-rose-500/20 bg-rose-500/5 p-3"
                    : i.tone === "good"
                      ? "rounded-xl border border-mint-500/20 bg-mint-500/5 p-3"
                      : "rounded-xl border border-ink-200 bg-ink-50 p-3"
                }
              >
                <p className="text-sm font-semibold">{i.title}</p>
                <p className="mt-0.5 text-sm text-ink-500">{i.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card !p-0">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="font-semibold">Recent transactions</h2>
          <Link href="/transactions" className="text-sm font-medium text-mint-600 hover:underline">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-6 text-sm text-ink-400">
            Nothing yet —{" "}
            <Link href="/transactions" className="text-mint-600 hover:underline">
              add your first transaction
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-ink-100">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: t.categories?.color ?? "#94a3b8" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">
                    {t.categories?.name ?? "Uncategorized"}
                    {t.note && <span className="ml-2 font-normal text-ink-400">· {t.note}</span>}
                  </p>
                  <p className="text-xs text-ink-400">{t.occurred_on}</p>
                </div>
                <span
                  className={
                    t.kind === "income"
                      ? "text-sm font-semibold text-mint-600"
                      : "text-sm font-semibold text-rose-600"
                  }
                >
                  {t.kind === "income" ? "+" : "−"}
                  {formatCurrency(Number(t.amount), currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "mint" | "rose" | "ink" }) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p
        className={
          tone === "mint"
            ? "mt-1 font-display text-2xl font-bold text-mint-600"
            : tone === "rose"
              ? "mt-1 font-display text-2xl font-bold text-rose-600"
              : "mt-1 font-display text-2xl font-bold text-ink-900"
        }
      >
        {value}
      </p>
    </div>
  );
}

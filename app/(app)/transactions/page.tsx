import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { monthRange, parseMonthParam } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";
import { TransactionManager } from "./TransactionManager";
import type { Category, Transaction } from "@/lib/types";

export const metadata = { title: "Transactions" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; kind?: string; error?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonthParam(params.month);
  const range = monthRange(month);
  const kindFilter = params.kind === "income" || params.kind === "expense" ? params.kind : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Pages render in parallel with the layout — guard here, the layout's
  // redirect doesn't stop this page from executing.
  if (!user) redirect("/login");

  const [{ data: txns }, { data: cats }, { data: profile }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(id,name,color,kind)")
      .eq("user_id", user!.id)
      .gte("occurred_on", range.from)
      .lte("occurred_on", range.to)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user!.id)
      .order("name"),
    supabase.from("profiles").select("currency").eq("id", user!.id).single(),
  ]);

  const all = (txns ?? []) as Transaction[];
  const filtered =
    kindFilter === "all" ? all : all.filter((t) => t.kind === kindFilter);
  const currency = profile?.currency ?? "USD";

  const monthStr = range.from.slice(0, 7);
  const q = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ month: monthStr, ...(kindFilter !== "all" ? { kind: kindFilter } : {}), ...extra });
    return `/transactions?${p.toString()}`;
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-ink-500">
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"} ·{" "}
            {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link className="btn-ghost !px-3 !py-1.5 text-sm" href={q({ month: shift(monthStr, -1) })}>
            ← Prev
          </Link>
          <Link className="btn-ghost !px-3 !py-1.5 text-sm" href={q({ month: shift(monthStr, 1) })}>
            Next →
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "income", "expense"] as const).map((k) => (
          <Link
            key={k}
            href={`/transactions?month=${monthStr}${k === "all" ? "" : `&kind=${k}`}`}
            className={
              kindFilter === k
                ? "rounded-full bg-gradient-mint px-4 py-1.5 text-sm font-semibold text-white"
                : "rounded-full bg-white px-4 py-1.5 text-sm font-medium text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
            }
          >
            {k === "all" ? "All" : k === "income" ? "Income" : "Expenses"}
          </Link>
        ))}
      </div>

      {params.error && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
          {params.error}
        </p>
      )}

      <TransactionManager
        transactions={filtered}
        categories={(cats ?? []) as Category[]}
        currency={currency}
        returnTo={`/transactions?month=${monthStr}${kindFilter === "all" ? "" : `&kind=${kindFilter}`}`}
      />

      {filtered.length > 0 && (
        <p className="text-sm text-ink-500">
          Net this month:{" "}
          <span className="font-semibold text-ink-800">
            {formatCurrency(
              filtered.reduce(
                (a, t) => a + (t.kind === "income" ? Number(t.amount) : -Number(t.amount)),
                0
              ),
              currency
            )}
          </span>
        </p>
      )}
    </div>
  );
}

function shift(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

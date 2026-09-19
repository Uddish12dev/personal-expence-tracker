import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { monthRange, monthStartISO, parseMonthParam, totalsByCategory } from "@/lib/finance";
import type { Budget, Category, Transaction } from "@/lib/types";
import { BudgetManager } from "./BudgetManager";

export const metadata = { title: "Budgets" };

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonthParam(params.month);
  const range = monthRange(month);
  const monthISO = monthStartISO(month);
  const monthStr = monthISO.slice(0, 7);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: budgets }, { data: cats }, { data: txns }, { data: profile }] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user!.id)
        .eq("month", monthISO),
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", user!.id)
        .eq("kind", "expense")
        .order("name"),
      supabase
        .from("transactions")
        .select("*, categories(id,name,color,kind)")
        .eq("user_id", user!.id)
        .gte("occurred_on", range.from)
        .lte("occurred_on", range.to),
      supabase.from("profiles").select("currency").eq("id", user!.id).single(),
    ]);

  const spent = new Map(
    totalsByCategory((txns ?? []) as Transaction[], "expense").map((c) => [
      c.categoryId,
      c.total,
    ])
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-ink-500">
            Monthly spending limits per category —{" "}
            {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link className="btn-ghost !px-3 !py-1.5 text-sm" href={`/budgets?month=${shift(monthStr, -1)}`}>
            ← Prev
          </Link>
          <Link className="btn-ghost !px-3 !py-1.5 text-sm" href={`/budgets?month=${shift(monthStr, 1)}`}>
            Next →
          </Link>
        </div>
      </div>

      {params.error && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
          {params.error}
        </p>
      )}

      <BudgetManager
        budgets={(budgets ?? []) as Budget[]}
        categories={(cats ?? []) as Category[]}
        spentByCategory={spent}
        month={monthISO}
        currency={profile?.currency ?? "USD"}
      />
    </div>
  );
}

function shift(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

"use client";

import { deleteBudget, upsertBudget } from "./actions";
import type { Budget, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  budgets: Budget[];
  categories: Category[];
  spentByCategory: Map<string | null, number>;
  month: string; // YYYY-MM-01
  currency: string;
}

export function BudgetManager({ budgets, categories, spentByCategory, month, currency }: Props) {
  const budgetByCat = new Map(budgets.map((b) => [b.category_id, b]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => {
        const budget = budgetByCat.get(cat.id);
        const spent = spentByCategory.get(cat.id) ?? 0;
        const limit = budget ? Number(budget.amount) : 0;
        const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
        const over = limit > 0 && spent > limit;

        return (
          <div key={cat.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
              {budget && (
                <form action={deleteBudget}>
                  <input type="hidden" name="id" value={budget.id} />
                  <input type="hidden" name="month" value={month} />
                  <button type="submit" className="text-xs font-medium text-ink-400 hover:text-rose-500">
                    Remove
                  </button>
                </form>
              )}
            </div>

            {budget ? (
              <>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: over ? "#f43f5e" : cat.color,
                    }}
                  />
                </div>
                <p className="text-sm text-ink-500">
                  <span className={over ? "font-semibold text-rose-600" : "font-semibold text-ink-800"}>
                    {formatCurrency(spent, currency)}
                  </span>{" "}
                  of {formatCurrency(limit, currency)}
                  {over && ` — ${formatCurrency(spent - limit, currency)} over`}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-400">
                No budget set. {spent > 0 && <>Spent so far: {formatCurrency(spent, currency)}.</>}
              </p>
            )}

            <form action={upsertBudget} className="flex gap-2">
              <input type="hidden" name="category_id" value={cat.id} />
              <input type="hidden" name="month" value={month} />
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder={budget ? String(Number(budget.amount)) : "Set limit"}
                defaultValue={budget ? Number(budget.amount) : undefined}
                key={budget?.id ?? "none"}
                className="input !py-2 text-sm"
              />
              <button type="submit" className="btn-ghost !px-4 !py-2 text-sm">
                {budget ? "Update" : "Set"}
              </button>
            </form>
          </div>
        );
      })}
    </div>
  );
}

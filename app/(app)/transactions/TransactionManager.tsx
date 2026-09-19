"use client";

import { useMemo, useState } from "react";
import { addTransaction, updateTransaction, deleteTransaction } from "./actions";
import type { Category, Transaction, TxnKind } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  returnTo: string;
}

export function TransactionManager({ transactions, categories, currency, returnTo }: Props) {
  const [kind, setKind] = useState<TxnKind>("expense");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const activeKind = editing ? editing.kind : kind;
  const visibleCats = useMemo(
    () => categories.filter((c) => c.kind === activeKind),
    [categories, activeKind]
  );

  function startEdit(t: Transaction) {
    setEditing(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const formAction = editing ? updateTransaction : addTransaction;

  return (
    <div className="space-y-6">
      {/* ---------- Add / edit form ---------- */}
      <div className="card">
        <h2 className="mb-4 font-semibold">
          {editing ? "Edit transaction" : "Add a transaction"}
        </h2>
        <form
          action={formAction}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
          onSubmit={() => setEditing(null)}
        >
          <input type="hidden" name="returnTo" value={returnTo} />
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-ink-500">Type</label>
            <div className="flex overflow-hidden rounded-xl ring-1 ring-ink-200">
              {(["expense", "income"] as const).map((k) => (
                <label
                  key={k}
                  className={cn(
                    "flex-1 cursor-pointer px-3 py-2.5 text-center text-sm font-semibold capitalize transition",
                    activeKind === k
                      ? k === "expense"
                        ? "bg-rose-500 text-white"
                        : "bg-mint-500 text-white"
                      : "bg-white text-ink-500 hover:bg-ink-50"
                  )}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={k}
                    checked={activeKind === k}
                    onChange={() => {
                      setKind(k);
                      if (editing) setEditing({ ...editing, kind: k });
                    }}
                    className="sr-only"
                  />
                  {k}
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-ink-500">Amount</label>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={editing ? Number(editing.amount) : undefined}
              key={`amount-${editing?.id ?? "new"}`}
              className="input"
              placeholder="0.00"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-ink-500">Category</label>
            <select
              name="category_id"
              className="input"
              defaultValue={editing?.category_id ?? ""}
              key={`cat-${editing?.id ?? "new"}-${activeKind}`}
            >
              <option value="">Uncategorized</option>
              {visibleCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-ink-500">
              Or new category
            </label>
            <input
              name="new_category"
              type="text"
              className="input"
              placeholder="Optional"
              key={`newcat-${editing?.id ?? "new"}`}
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-ink-500">Date</label>
            <input
              name="occurred_on"
              type="date"
              required
              defaultValue={editing?.occurred_on ?? new Date().toISOString().slice(0, 10)}
              key={`date-${editing?.id ?? "new"}`}
              className="input"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-ink-500">Note</label>
            <input
              name="note"
              type="text"
              className="input"
              placeholder="Optional"
              defaultValue={editing?.note ?? ""}
              key={`note-${editing?.id ?? "new"}`}
            />
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
            <button type="submit" className="btn-primary">
              {editing ? "Save changes" : "Add transaction"}
            </button>
            {editing && (
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ---------- List ---------- */}
      <div className="card !p-0">
        {transactions.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-500">
            No transactions for this period yet — add your first one above.
          </p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: t.categories?.color ?? "#94a3b8" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">
                    {t.categories?.name ?? "Uncategorized"}
                    {t.note && (
                      <span className="ml-2 font-normal text-ink-400">· {t.note}</span>
                    )}
                  </p>
                  <p className="text-xs text-ink-400">{t.occurred_on}</p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    t.kind === "income" ? "text-mint-600" : "text-rose-600"
                  )}
                >
                  {t.kind === "income" ? "+" : "−"}
                  {formatCurrency(Number(t.amount), currency)}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-ink-500 hover:bg-ink-100"
                >
                  Edit
                </button>
                <form action={deleteTransaction}>
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-2 py-1 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

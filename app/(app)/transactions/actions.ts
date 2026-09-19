"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function back(returnTo: FormDataEntryValue | null, error?: string): string {
  const base = typeof returnTo === "string" && returnTo.startsWith("/transactions")
    ? returnTo
    : "/transactions";
  if (!error) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}error=${encodeURIComponent(error)}`;
}

async function ensureCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  kind: "income" | "expense",
  categoryId: string,
  newName: string
): Promise<string | null> {
  if (newName.trim()) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        { user_id: userId, name: newName.trim(), kind },
        { onConflict: "user_id,name,kind" }
      )
      .select("id")
      .single();
    if (error) return null;
    return data.id;
  }
  return categoryId || null;
}

export async function addTransaction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const returnTo = formData.get("returnTo");
  if (!user) redirect("/login");

  const kind = String(formData.get("kind") ?? "");
  const amount = Number(formData.get("amount"));
  const occurredOn = String(formData.get("occurred_on") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const newCategory = String(formData.get("new_category") ?? "");
  let categoryId = String(formData.get("category_id") ?? "");

  if (kind !== "income" && kind !== "expense") redirect(back(returnTo, "invalid-kind"));
  if (!amount || amount <= 0) redirect(back(returnTo, "invalid-amount"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) redirect(back(returnTo, "invalid-date"));

  categoryId = (await ensureCategory(supabase, user.id, kind, categoryId, newCategory)) ?? "";

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    kind,
    amount,
    occurred_on: occurredOn,
    note,
    category_id: categoryId || null,
  });
  if (error) redirect(back(returnTo, error.message));

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  redirect(back(returnTo));
}

export async function updateTransaction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const returnTo = formData.get("returnTo");
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const amount = Number(formData.get("amount"));
  const occurredOn = String(formData.get("occurred_on") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const newCategory = String(formData.get("new_category") ?? "");
  let categoryId = String(formData.get("category_id") ?? "");

  if (!id) redirect(back(returnTo, "missing-id"));
  if (kind !== "income" && kind !== "expense") redirect(back(returnTo, "invalid-kind"));
  if (!amount || amount <= 0) redirect(back(returnTo, "invalid-amount"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) redirect(back(returnTo, "invalid-date"));

  categoryId = (await ensureCategory(supabase, user.id, kind, categoryId, newCategory)) ?? "";

  const { error } = await supabase
    .from("transactions")
    .update({
      kind,
      amount,
      occurred_on: occurredOn,
      note,
      category_id: categoryId || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) redirect(back(returnTo, error.message));

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  redirect(back(returnTo));
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const returnTo = formData.get("returnTo");
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  redirect(back(returnTo));
}

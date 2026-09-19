"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function back(month: FormDataEntryValue | null, error?: string): string {
  const m = typeof month === "string" && /^\d{4}-\d{2}-\d{2}$/.test(month)
    ? month.slice(0, 7)
    : new Date().toISOString().slice(0, 7);
  const base = `/budgets?month=${m}`;
  return error ? `${base}&error=${encodeURIComponent(error)}` : base;
}

export async function upsertBudget(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const month = formData.get("month"); // YYYY-MM-01
  if (!user) redirect("/login");

  const categoryId = String(formData.get("category_id") ?? "");
  const amount = Number(formData.get("amount"));
  if (!categoryId) redirect(back(month, "missing-category"));
  if (!amount || amount <= 0) redirect(back(month, "Amount must be greater than zero."));

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      month: String(month),
      amount,
    },
    { onConflict: "user_id,category_id,month" }
  );
  if (error) redirect(back(month, error.message));

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  redirect(back(month));
}

export async function deleteBudget(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const month = formData.get("month");
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  redirect(back(month));
}

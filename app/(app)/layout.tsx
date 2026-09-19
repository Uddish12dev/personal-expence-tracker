import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name?.split(" ")[0] ?? user.email ?? "there";

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-40 border-b border-ink-200/60 bg-white/80 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-mint text-sm font-bold text-white">
              F
            </span>
            <span>
              Fin<span className="text-gradient">Sight</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium text-ink-600">
            <Link href="/dashboard" className="rounded-full px-3 py-2 hover:bg-ink-100">
              Dashboard
            </Link>
            <Link href="/transactions" className="rounded-full px-3 py-2 hover:bg-ink-100">
              Transactions
            </Link>
            <Link href="/budgets" className="rounded-full px-3 py-2 hover:bg-ink-100">
              Budgets
            </Link>
            <span className="ml-2 hidden rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-600 sm:inline">
              {name}
            </span>
            <form action={signOut}>
              <button type="submit" className="ml-1 rounded-full px-3 py-2 text-sm text-ink-500 hover:bg-ink-100">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="container-app py-8">{children}</main>
    </div>
  );
}

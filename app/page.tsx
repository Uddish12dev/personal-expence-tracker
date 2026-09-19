import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-radial">
      <header className="container-app flex h-16 items-center justify-between">
        <span className="font-display text-lg font-bold">
          Fin<span className="text-gradient">Sight</span>
        </span>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost !px-4 !py-2 text-sm">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary !px-4 !py-2 text-sm">
            Sign up
          </Link>
        </nav>
      </header>

      <main className="container-app flex flex-1 flex-col items-center justify-center py-20 text-center">
        <span className="tag mb-6 animate-fade-in">Personal Finance Tracker</span>
        <h1 className="max-w-3xl animate-fade-up font-display text-5xl font-bold leading-tight sm:text-6xl">
          Know where your money goes —{" "}
          <span className="text-gradient">and where it should go.</span>
        </h1>
        <p className="mt-6 max-w-xl animate-fade-up text-lg text-ink-500">
          Track income and expenses, visualize spending with charts, set monthly
          budgets, and get smart suggestions based on your balance and needs.
        </p>
        <div className="mt-10 flex animate-fade-up gap-4">
          <Link href="/signup" className="btn-primary">
            Start tracking free
          </Link>
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          {[
            {
              title: "Track everything",
              body: "Log income and expenses with categories, dates, and notes in seconds.",
            },
            {
              title: "See the picture",
              body: "Charts for spending by category, income vs expenses, and daily cash flow.",
            },
            {
              title: "Spend smarter",
              body: "Budgets and rule-based insights that suggest how to spend within your means.",
            },
          ].map((f) => (
            <div key={f.title} className="card text-left">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-500">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="container-app py-6 text-center text-sm text-ink-400">
        Built with Next.js, Supabase, and Recharts. Deployed on Vercel.
      </footer>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-radial px-4">
      <Link href="/" className="mb-8 font-display text-2xl font-bold">
        Fin<span className="text-gradient">Sight</span>
      </Link>
      <div className="card w-full max-w-md">{children}</div>
      <p className="mt-6 text-sm text-ink-500">
        Personal finance tracker — track, budget, and get insights.
      </p>
    </div>
  );
}

import Link from "next/link";
import { signInWithEmail } from "../actions";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="text-xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-500">Log in to your FinSight account.</p>

      {error && (
        <p className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
          {error === "missing-fields"
            ? "Please fill in all fields."
            : error === "auth-callback-failed"
              ? "Authentication failed. Please try again."
              : error}
        </p>
      )}

      <form action={signInWithEmail} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-700">
            Email
          </label>
          <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-700">
            Password
          </label>
          <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
        </div>
        <button type="submit" className="btn-primary w-full">
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-mint-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

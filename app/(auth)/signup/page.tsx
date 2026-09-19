import Link from "next/link";
import { signUpWithEmail } from "../actions";

export const metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="text-xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-ink-500">Start tracking your money in under a minute.</p>

      {error && (
        <p className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
          {error === "missing-fields"
            ? "Please fill in all fields."
            : error === "password-too-short"
              ? "Password must be at least 8 characters."
              : error}
        </p>
      )}

      <form action={signUpWithEmail} className="mt-6 space-y-4">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-ink-700">
            Full name
          </label>
          <input id="full_name" name="full_name" type="text" className="input" placeholder="Ada Lovelace" />
        </div>
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
          <input id="password" name="password" type="password" required minLength={8} className="input" placeholder="At least 8 characters" />
        </div>
        <button type="submit" className="btn-primary w-full">
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-mint-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

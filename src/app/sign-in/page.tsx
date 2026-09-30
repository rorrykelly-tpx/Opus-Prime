import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { getCurrentUser, signInOptions } from "@/server/auth";

import { signInAction } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/pathways");

  return (
    <main id="main">
      <section className="plain">
        <div className="wrap">
          <h1>Sign in</h1>
          {env.AUTH_PROVIDER === "dev" && (
            <p className="muted">
              Company sign-in isn&apos;t set up yet, so choose a test account. Each one keeps its
              own progress.
            </p>
          )}
          <ul className="signin-options">
            {signInOptions().map((option) => (
              <li key={option.id}>
                <form action={signInAction}>
                  <input type="hidden" name="option" value={option.id} />
                  <button className="btn" type="submit">
                    Sign in as {option.label}
                  </button>
                  {option.detail && <span className="muted small">{option.detail}</span>}
                </form>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

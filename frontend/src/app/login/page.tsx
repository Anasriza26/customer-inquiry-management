"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
};

type AuthResponse = {
  user: User;
};

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    apiRequest<AuthResponse>("/auth/me")
      .then((data) => {
        if (active) {
          setUser(data.user);
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return;

        // A 401 response is expected when there is no active session.
        if (requestError instanceof ApiError && requestError.status === 401) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to check your sign-in session.",
        );
      })
      .finally(() => {
        if (active) {
          setCheckingSession(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      setUser(data.user);
      setPassword("");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Sign-in failed. Please check your details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError("");
    setSigningOut(true);

    try {
      await apiRequest<void>("/auth/logout", {
        method: "POST",
      });

      setUser(null);
      setEmail("");
      setPassword("");
      setShowPassword(false);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f4f7f4] text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl sm:h-96 sm:w-96"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-amber-100/70 blur-3xl sm:h-96 sm:w-96"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,70,53,0.28)] lg:min-h-155 lg:grid-cols-2">
          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-lg shadow-emerald-900/15">
                  <svg
                    aria-hidden="true"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M4 19.5V5.8A2.8 2.8 0 0 1 6.8 3H20v15.2H7.1A3.1 3.1 0 0 0 4 21.3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M8 7h8M8 10.5h6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-bold tracking-wide text-emerald-900">
                    COFFEE NINJA
                  </p>
                  <p className="text-xs text-slate-500">
                    Customer Support Workspace
                  </p>
                </div>
              </div>

              {checkingSession ? (
                <div
                  className="flex min-h-72 flex-col items-center justify-center gap-4 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <span className="loading loading-spinner loading-lg text-emerald-700" />
                  <div>
                    <h1 className="text-lg font-semibold text-slate-800">
                      Checking your session
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                      Please wait a moment.
                    </p>
                  </div>
                </div>
              ) : user ? (
                <div>
                  <div className="mb-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Signed in
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                      Welcome back, {user.name.split(" ")[0]}.
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Your account is ready. The inquiry workspace will be
                      connected in the next chapter.
                    </p>
                  </div>

                  {error && (
                    <div
                      className="alert alert-error mb-5 text-sm"
                      role="alert"
                    >
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Account details
                    </p>

                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-xs text-slate-500">Full name</p>
                        <p className="mt-1 wrap-break-words font-medium text-slate-900">
                          {user.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Email address</p>
                        <p className="mt-1 break-all font-medium text-slate-900">
                          {user.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Access role</p>
                        <span className="badge badge-success mt-1 capitalize">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-outline mt-6 w-full border-slate-300 text-slate-700 hover:border-emerald-800 hover:bg-emerald-800 hover:text-white"
                    type="button"
                    onClick={handleLogout}
                    disabled={signingOut}
                  >
                    {signingOut ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        Signing out...
                      </>
                    ) : (
                      "Sign out"
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-7">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Staff portal
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                      Sign in to your workspace
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Manage customer inquiries and keep every request moving
                      toward resolution.
                    </p>
                  </div>

                  {error && (
                    <div
                      className="alert alert-error mb-5 text-sm"
                      role="alert"
                    >
                      <span>{error}</span>
                    </div>
                  )}

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <label className="form-control w-full">
                      <span className="label mb-1">
                        <span className="label-text font-semibold text-slate-700">
                          Email address
                        </span>
                      </span>
                      <input
                        className="input input-bordered h-12 w-full rounded-xl border-slate-200 bg-white text-base outline-none transition focus:border-emerald-700 focus:outline-2 focus:outline-emerald-700/20"
                        type="email"
                        name="email"
                        autoComplete="username"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-label="Email address"
                        required
                      />
                    </label>

                    <label className="form-control w-full">
                      <span className="label mb-1">
                        <span className="label-text font-semibold text-slate-700">
                          Password
                        </span>
                      </span>

                      <span className="relative block">
                        <input
                          className="input input-bordered h-12 w-full rounded-xl border-slate-200 bg-white pr-20 text-base outline-none transition focus:border-emerald-700 focus:outline-2 focus:outline-emerald-700/20"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          aria-label="Password"
                          required
                        />

                        <button
                          className="absolute inset-y-0 right-3 my-auto rounded-md px-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </span>
                    </label>

                    <button
                      className="btn h-12 min-h-12 w-full rounded-xl border-0 bg-emerald-800 text-base font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-900"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="loading loading-spinner loading-sm" />
                          Signing in...
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-xs leading-5 text-slate-500">
                    Need access? Please contact your system administrator.
                  </p>
                </>
              )}
            </div>
          </section>

          <aside className="relative hidden overflow-hidden bg-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-emerald-700/30 blur-3xl"
            />

            <div className="relative">
              <span className="badge border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                CUSTOMER CARE, MADE CLEAR
              </span>

              <h2 className="mt-8 max-w-md text-4xl font-bold leading-tight tracking-tight">
                Every inquiry deserves a clear next step.
              </h2>

              <p className="mt-5 max-w-md text-base leading-7 text-emerald-100/75">
                Keep customer requests organized, visible, and moving from first
                contact to resolution.
              </p>
            </div>

            <div className="relative space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/15 text-amber-200">
                  01
                </span>
                <div>
                  <p className="font-semibold">Capture the request</p>
                  <p className="mt-1 text-sm text-emerald-100/65">
                    Keep the details in one reliable place.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/15 text-amber-200">
                  02
                </span>
                <div>
                  <p className="font-semibold">Track the progress</p>
                  <p className="mt-1 text-sm text-emerald-100/65">
                    Know what is new, active, or resolved.
                  </p>
                </div>
              </div>

              <p className="pt-3 text-xs text-emerald-100/50">
                A focused workspace for staff and administrators.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

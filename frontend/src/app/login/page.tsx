"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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

type ToastMessage = {
  type: "error" | "success";
  message: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        await apiRequest<AuthResponse>("/auth/me");

        if (active) {
          router.replace("/");
        }
      } catch (requestError: unknown) {
        if (!active) return;

        if (
          !(requestError instanceof ApiError && requestError.status === 401)
        ) {
          setToast({
            type: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "Unable to check your sign-in session.",
          });
        }

        setCheckingSession(false);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(null);
    setSubmitting(true);

    try {
      await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      setPassword("");
      router.replace("/");
    } catch (requestError: unknown) {
      setToast({
        type: "error",
        message:
          requestError instanceof Error
            ? requestError.message
            : "Sign-in failed. Please check your details and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const toastClass =
    toast?.type === "success" ? "alert-success" : "alert-error";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#071411] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-emerald-800/20 blur-3xl sm:h-96 sm:w-96"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-emerald-600/10 blur-3xl sm:h-96 sm:w-96"
      />

      {toast && (
        <div className="toast toast-top toast-center z-50 w-[calc(100%-2rem)] max-w-md">
          <div
            className={`alert ${toastClass} shadow-lg`}
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="relative mx-auto w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#0d1d18] shadow-2xl shadow-black/30 lg:min-h-155 lg:grid-cols-2">
          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-sm font-bold text-white shadow-lg shadow-emerald-950/40">
                  CI
                </div>

                <div>
                  <p className="text-sm font-bold tracking-wide text-emerald-100">
                    CUSTOMER INQUIRIES
                  </p>
                  <p className="text-xs text-slate-400">Support workspace</p>
                </div>
              </div>

              {checkingSession ? (
                <div
                  className="flex min-h-72 flex-col items-center justify-center gap-4 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <span className="loading loading-spinner loading-lg text-emerald-400" />
                  <div>
                    <h1 className="text-lg font-semibold text-slate-100">
                      Checking your session
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                      Please wait a moment.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-7">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
                      Staff and Admin
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      Sign in to your workspace
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Manage customer inquiries and help every request move
                      toward resolution.
                    </p>
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <label className="form-control w-full">
                      <span className="label mb-1">
                        <span className="label-text font-semibold text-slate-200">
                          Email address
                        </span>
                      </span>
                      <input
                        className="input input-bordered h-12 w-full border-white/10 bg-[#091712] text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-2 focus:outline-emerald-500/20"
                        type="email"
                        name="email"
                        autoComplete="username"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </label>

                    <label className="form-control w-full">
                      <span className="label mb-1">
                        <span className="label-text font-semibold text-slate-200">
                          Password
                        </span>
                      </span>

                      <span className="relative block">
                        <input
                          className="input input-bordered h-12 w-full border-white/10 bg-[#091712] pr-20 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-2 focus:outline-emerald-500/20"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                        />

                        <button
                          className="absolute inset-y-0 right-3 my-auto rounded-md px-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-emerald-400"
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
                      className="btn h-12 min-h-12 w-full border-0 bg-emerald-700 text-base font-semibold text-white transition hover:bg-emerald-600"
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

          <aside className="relative hidden overflow-hidden border-l border-white/10 bg-[#0a1713] p-10 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-emerald-300/10"
            />
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-emerald-300/10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-emerald-700/15 blur-3xl"
            />

            <div className="relative">
              <span className="badge border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                CUSTOMER CARE, MADE CLEAR
              </span>

              <h2 className="mt-8 max-w-md text-4xl font-bold leading-tight tracking-tight">
                Every inquiry deserves a clear next step.
              </h2>

              <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
                Keep customer requests organized, visible, and moving from first
                contact to resolution.
              </p>
            </div>

            <div className="relative space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  01
                </span>
                <div>
                  <p className="font-semibold">Capture the request</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Keep the details in one reliable place.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  02
                </span>
                <div>
                  <p className="font-semibold">Track the progress</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Know what is new, active, or resolved.
                  </p>
                </div>
              </div>

              <p className="pt-3 text-xs text-slate-500">
                A focused workspace for staff and administrators.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

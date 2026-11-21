"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import WorkspaceHeader from "@/components/workspace-header";

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
  type: "success" | "info" | "error";
  message: string;
};

type SessionState = "loading" | "authenticated" | "guest" | "error";

type DashboardLink = {
  href: string;
  title: string;
  description: string;
  buttonLabel: string;
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      setSessionState("loading");

      try {
        const data = await apiRequest<AuthResponse>("/auth/me");

        if (!active) return;

        setUser(data.user);
        setSessionState("authenticated");
        setToast({
          type: "success",
          message: `Welcome back, ${data.user.name.split(" ")[0]}.`,
        });
      } catch (requestError: unknown) {
        if (!active) return;

        if (requestError instanceof ApiError && requestError.status === 401) {
          setUser(null);
          setSessionState("guest");
          setToast({
            type: "info",
            message: "Sign in to open your support workspace.",
          });
        } else {
          setUser(null);
          setSessionState("error");
          setToast({
            type: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "Unable to check your session.",
          });
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [retryCount]);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  const dashboardLinks: DashboardLink[] =
    user?.role === "admin"
      ? [
          {
            href: "/inquiries",
            title: "View inquiries",
            description:
              "Search customer requests and review their current status.",
            buttonLabel: "Open inquiries",
          },
          {
            href: "/inquiries/new",
            title: "Create an inquiry",
            description:
              "Record a new customer request in the support workspace.",
            buttonLabel: "Create inquiry",
          },
          {
            href: "/admin/staff",
            title: "Manage staff",
            description:
              "Create staff accounts and manage their access status.",
            buttonLabel: "Manage staff accounts",
          },
        ]
      : [
          {
            href: "/inquiries",
            title: "View inquiries",
            description:
              "Find and follow up on the inquiries you are allowed to access.",
            buttonLabel: "Open my inquiries",
          },
          {
            href: "/inquiries/new",
            title: "Create an inquiry",
            description:
              "Record a new customer request in the support workspace.",
            buttonLabel: "Create inquiry",
          },
        ];

  const toastClass =
    toast?.type === "success"
      ? "alert-success"
      : toast?.type === "error"
        ? "alert-error"
        : "alert-info";

  return (
    <main className="min-h-dvh bg-base-200">
      <WorkspaceHeader />

      {toast && (
        <div className="toast toast-top toast-center z-50 w-[calc(100%-2rem)] max-w-md">
          <div
            className={`alert ${toastClass} flex items-start justify-between gap-3 shadow-lg`}
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
          >
            <span>{toast.message}</span>
            <button
              className="btn btn-ghost btn-xs"
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-8 rounded-3xl bg-emerald-950 px-5 py-8 text-white shadow-sm sm:px-8 sm:py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Customer support workspace
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Customer Inquiry Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100/80 sm:text-base">
            Keep customer requests organized, follow their progress, and help
            every inquiry move toward resolution.
          </p>

          {user && sessionState === "authenticated" && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-emerald-100">
                Signed in as {user.name}
              </span>
              <span className="badge badge-warning capitalize">
                {user.role}
              </span>
            </div>
          )}
        </section>

        {sessionState === "loading" && (
          <section
            className="flex min-h-48 items-center justify-center gap-3 rounded-2xl bg-base-100"
            role="status"
            aria-live="polite"
          >
            <span className="loading loading-spinner loading-md text-primary" />
            <span>Checking your account...</span>
          </section>
        )}

        {sessionState === "error" && (
          <section
            className="alert alert-error flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <span>We could not check your account. Please try again.</span>
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Try again
            </button>
          </section>
        )}

        {sessionState === "guest" && (
          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-5 sm:p-8">
              <span className="badge badge-primary w-fit">Staff and Admin</span>

              <h2 className="card-title mt-2 text-2xl">Sign in to continue</h2>

              <p className="max-w-2xl text-sm leading-6 text-base-content/70">
                Staff and Admin use the same secure sign-in page. After signing
                in, you will see the workspace pages available to your role.
              </p>

              <Link
                className="btn btn-primary mt-3 w-full sm:w-fit"
                href="/login"
              >
                Go to sign in
              </Link>
            </div>
          </section>
        )}

        {sessionState === "authenticated" && user && (
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold sm:text-2xl">Your workspace</h2>
              <p className="mt-1 text-sm text-base-content/70">
                Choose an area to continue.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dashboardLinks.map((item) => (
                <article
                  key={item.href}
                  className="card border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md"
                >
                  <div className="card-body">
                    <h3 className="card-title">{item.title}</h3>
                    <p className="text-sm leading-6 text-base-content/70">
                      {item.description}
                    </p>
                    <div className="card-actions mt-3">
                      <Link
                        className="btn btn-primary btn-sm w-full sm:w-auto"
                        href={item.href}
                      >
                        {item.buttonLabel}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

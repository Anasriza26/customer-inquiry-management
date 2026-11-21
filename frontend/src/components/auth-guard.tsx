"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";

type UserRole = "admin" | "staff";

type AuthResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
};

type AuthGuardProps = {
  children: ReactNode;
  requiredRole?: UserRole;
};

type GuardState = "checking" | "allowed" | "redirecting" | "error";

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>("checking");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      setState("checking");
      setError("");

      try {
        const data = await apiRequest<AuthResponse>("/auth/me");

        if (!active) return;

        if (requiredRole && data.user.role !== requiredRole) {
          setState("redirecting");
          router.replace("/");
          return;
        }

        setState("allowed");
      } catch (requestError: unknown) {
        if (!active) return;

        if (requestError instanceof ApiError && requestError.status === 401) {
          setState("redirecting");
          router.replace("/login");
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to verify your access.",
        );
        setState("error");
      }
    }

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [requiredRole, retryCount, router]);

  if (state === "allowed") {
    return <>{children}</>;
  }

  if (state === "error") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-base-200 p-4">
        <section className="card w-full max-w-lg border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <h1 className="card-title">Could not verify access</h1>
            <p className="text-sm leading-6 text-base-content/70">{error}</p>
            <button
              className="btn btn-primary mt-2 w-full sm:w-fit"
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Try again
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-base-200 p-4">
      <div className="flex items-center gap-3" role="status" aria-live="polite">
        <span className="loading loading-spinner loading-md text-primary" />
        <span>
          {state === "redirecting"
            ? "Redirecting..."
            : "Checking your access..."}
        </span>
      </div>
    </main>
  );
}

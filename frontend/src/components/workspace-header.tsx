"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
};

type AuthResponse = {
  user: User;
};

type NavigationItem = {
  href: string;
  label: string;
};

function isNavigationItemActive(href: string, pathname: string) {
  if (href === "/inquiries") {
    return (
      pathname === "/inquiries" ||
      (pathname.startsWith("/inquiries/") && pathname !== "/inquiries/new")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function WorkspaceHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

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

        if (requestError instanceof ApiError && requestError.status === 401) {
          setUser(null);
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to check your session.",
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

  async function handleSignOut() {
    setError("");
    setSigningOut(true);

    try {
      await apiRequest<void>("/auth/logout", {
        method: "POST",
      });

      router.replace("/login");
      router.refresh();
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

  const navigationItems: NavigationItem[] = [
    { href: "/inquiries", label: "Inquiries" },
    { href: "/inquiries/new", label: "New inquiry" },
  ];

  if (user?.role === "admin") {
    navigationItems.push({
      href: "/admin/staff",
      label: "Staff accounts",
    });
  }

  return (
    <header className="border-b border-base-300 bg-base-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="flex min-w-0 items-center gap-3"
            href="/inquiries"
            aria-label="Customer Inquiry Management home"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-sm font-bold text-white">
              CI
            </span>

            <span className="min-w-0">
              <span className="block truncate font-bold text-base-content">
                Customer Inquiries
              </span>
              <span className="block text-xs text-base-content/60">
                Support workspace
              </span>
            </span>
          </Link>

          <div className="flex min-h-8 items-center justify-between gap-3 sm:justify-end">
            {checkingSession ? (
              <span className="flex items-center gap-2 text-sm text-base-content/70">
                <span className="loading loading-spinner loading-xs" />
                Checking session...
              </span>
            ) : user ? (
              <>
                <span className="min-w-0 text-right">
                  <span className="block max-w-48 truncate text-sm font-semibold">
                    {user.name}
                  </span>
                  <span className="badge badge-ghost badge-sm capitalize">
                    {user.role}
                  </span>
                </span>

                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </>
            ) : (
              <Link className="btn btn-primary btn-sm" href="/login">
                Sign in
              </Link>
            )}
          </div>
        </div>

        {user && (
          <nav
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            aria-label="Main navigation"
          >
            {navigationItems.map((item) => {
              const active = isNavigationItemActive(item.href, pathname);

              return (
                <Link
                  key={item.href}
                  className={`btn btn-sm shrink-0 ${
                    active ? "btn-primary" : "btn-ghost"
                  }`}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </header>
  );
}

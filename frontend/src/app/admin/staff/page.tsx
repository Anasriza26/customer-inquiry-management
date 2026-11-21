"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import WorkspaceHeader from "@/components/workspace-header";
import StaffCreateForm from "./staff-create-form";
import StaffDirectory from "./staff-directory";
import type { NewStaffInput, Staff, User } from "./staff-types";

type AuthResponse = {
  user: User;
};

type StaffListResponse = {
  staff: Staff[];
};

type StaffResponse = {
  staff: Staff;
};

export default function AdminStaffPage() {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingStaffId, setSavingStaffId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setCheckingAccess(true);
      setError("");

      try {
        const authData = await apiRequest<AuthResponse>("/auth/me");

        if (!active) return;

        setUser(authData.user);

        if (authData.user.role !== "admin") {
          return;
        }

        setLoadingStaff(true);

        const staffData = await apiRequest<StaffListResponse>("/admin/staff");

        if (active) {
          setStaff(staffData.staff);
        }
      } catch (requestError: unknown) {
        if (!active) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load staff accounts.",
        );
      } finally {
        if (active) {
          setCheckingAccess(false);
          setLoadingStaff(false);
        }
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, []);

  async function handleCreateStaff(input: NewStaffInput) {
    setError("");
    setNotice("");
    setCreating(true);

    try {
      const data = await apiRequest<StaffResponse>("/admin/staff", {
        method: "POST",
        body: JSON.stringify(input),
      });

      setStaff((current) => [data.staff, ...current]);
      setNotice(`Staff account for ${data.staff.name} was created.`);
      return true;
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the staff account.",
      );
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateStaff(
    staffId: number,
    changes: { name: string; email: string },
  ) {
    setError("");
    setNotice("");

    if (!changes.name || !changes.email) {
      setError("Name and email are required.");
      return false;
    }

    setSavingStaffId(staffId);

    try {
      const data = await apiRequest<StaffResponse>(`/admin/staff/${staffId}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });

      setStaff((current) =>
        current.map((member) => (member.id === staffId ? data.staff : member)),
      );

      setNotice(`Staff account for ${data.staff.name} was updated.`);
      return true;
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update the staff account.",
      );
      return false;
    } finally {
      setSavingStaffId(null);
    }
  }

  async function handleToggleActive(member: Staff) {
    const nextActiveState = !member.is_active;

    if (
      member.is_active &&
      !window.confirm(`Deactivate the account for ${member.name}?`)
    ) {
      return;
    }

    setError("");
    setNotice("");
    setSavingStaffId(member.id);

    try {
      const data = await apiRequest<StaffResponse>(
        `/admin/staff/${member.id}/active`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: nextActiveState }),
        },
      );

      setStaff((current) =>
        current.map((item) => (item.id === member.id ? data.staff : item)),
      );

      setNotice(
        nextActiveState
          ? `${data.staff.name}'s account is active.`
          : `${data.staff.name}'s account was deactivated.`,
      );
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update the staff account status.",
      );
    } finally {
      setSavingStaffId(null);
    }
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-base-200 p-4">
        <div className="flex items-center gap-3" role="status">
          <span className="loading loading-spinner loading-md text-primary" />
          <span>Checking admin access...</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-base-200 p-4">
        <section className="alert alert-error w-full max-w-lg" role="alert">
          <span>{error || "Please sign in to continue."}</span>
          <Link className="link font-semibold" href="/login">
            Go to sign in
          </Link>
        </section>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-base-200 p-4">
        <section className="card w-full max-w-lg border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <h1 className="card-title">Admin access required</h1>
            <p className="text-base-content/70">
              Your account cannot manage staff accounts.
            </p>
            <Link className="btn btn-primary mt-3" href="/inquiries">
              Back to inquiries
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-base-200 px-4 py-6 sm:px-6 sm:py-10">
      <WorkspaceHeader />

      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Staff accounts
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/70 sm:text-base">
              Create staff access and manage current staff accounts.
            </p>
          </div>

          <Link className="btn btn-ghost w-full sm:w-auto" href="/inquiries">
            Back to inquiries
          </Link>
        </header>

        {error && (
          <div className="alert alert-error mb-5" role="alert">
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="alert alert-success mb-5" role="status">
            <span>{notice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <StaffCreateForm creating={creating} onCreate={handleCreateStaff} />

          {loadingStaff ? (
            <section className="card border border-base-300 bg-base-100 shadow-sm">
              <div
                className="flex min-h-48 items-center justify-center gap-3"
                role="status"
                aria-live="polite"
              >
                <span className="loading loading-spinner loading-md text-primary" />
                <span>Loading staff...</span>
              </div>
            </section>
          ) : (
            <StaffDirectory
              staff={staff}
              savingStaffId={savingStaffId}
              onUpdate={handleUpdateStaff}
              onToggleActive={handleToggleActive}
            />
          )}
        </div>
      </div>
    </main>
  );
}

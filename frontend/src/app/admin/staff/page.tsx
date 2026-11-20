"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
};

type Staff = {
  id: number;
  name: string;
  email: string;
  role: "staff";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AuthResponse = {
  user: User;
};

type StaffListResponse = {
  staff: Staff[];
};

type CreateStaffResponse = {
  staff: Staff;
};

export default function AdminStaffPage() {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingStaffId, setSavingStaffId] = useState<number | null>(null);

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

  async function handleCreateStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setCreating(true);

    try {
      const data = await apiRequest<CreateStaffResponse>("/admin/staff", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      setStaff((current) => [data.staff, ...current]);
      setName("");
      setEmail("");
      setPassword("");
      setNotice(`Staff account for ${data.staff.name} was created.`);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the staff account.",
      );
    } finally {
      setCreating(false);
    }
  }

  function startEditing(member: Staff) {
    setEditingStaffId(member.id);
    setEditName(member.name);
    setEditEmail(member.email);
    setError("");
    setNotice("");
  }

  function cancelEditing() {
    setEditingStaffId(null);
    setEditName("");
    setEditEmail("");
  }

  async function handleUpdateStaff(
    event: FormEvent<HTMLFormElement>,
    staffId: number,
  ) {
    event.preventDefault();
    setError("");
    setNotice("");

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();

    if (!trimmedName || !trimmedEmail) {
      setError("Name and email are required.");
      return;
    }

    setSavingStaffId(staffId);

    try {
      const data = await apiRequest<{ staff: Staff }>(
        `/admin/staff/${staffId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
          }),
        },
      );

      setStaff((current) =>
        current.map((member) => (member.id === staffId ? data.staff : member)),
      );

      setNotice(`Staff account for ${data.staff.name} was updated.`);
      cancelEditing();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update the staff account.",
      );
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
      const data = await apiRequest<{ staff: Staff }>(
        `/admin/staff/${member.id}/active`,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: nextActiveState,
          }),
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
              Create staff access and view the current staff accounts.
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
          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-5 sm:p-6">
              <div>
                <h2 className="card-title text-xl">Add a staff member</h2>
                <p className="mt-1 text-sm leading-6 text-base-content/70">
                  The password must contain at least 12 characters.
                </p>
              </div>

              <form className="mt-3 space-y-4" onSubmit={handleCreateStaff}>
                <label className="form-control w-full">
                  <span className="label">
                    <span className="label-text font-medium">Full name</span>
                  </span>
                  <input
                    className="input input-bordered w-full"
                    type="text"
                    name="name"
                    autoComplete="name"
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <span className="label">
                    <span className="label-text font-medium">Email</span>
                  </span>
                  <input
                    className="input input-bordered w-full"
                    type="email"
                    name="email"
                    autoComplete="email"
                    maxLength={255}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <span className="label">
                    <span className="label-text font-medium">
                      Initial password
                    </span>
                  </span>
                  <input
                    className="input input-bordered w-full"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={72}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>

                <button
                  className="btn btn-primary w-full"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Creating account...
                    </>
                  ) : (
                    "Create staff account"
                  )}
                </button>
              </form>
            </div>
          </section>

          <section className="card min-w-0 border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="card-title text-xl">Staff directory</h2>
                  <p className="mt-1 text-sm text-base-content/70">
                    {staff.length} staff account{staff.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {loadingStaff ? (
                <div className="flex min-h-40 items-center justify-center gap-3">
                  <span className="loading loading-spinner loading-md text-primary" />
                  <span>Loading staff...</span>
                </div>
              ) : staff.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-base-300 px-4 py-10 text-center">
                  <h3 className="font-semibold">No staff accounts yet</h3>
                  <p className="mt-2 text-sm text-base-content/70">
                    Create the first staff account using the form.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {staff.map((member) => (
                    <li
                      className="rounded-2xl border border-base-300 p-4"
                      key={member.id}
                    >
                      {editingStaffId === member.id ? (
                        <form
                          className="space-y-4"
                          onSubmit={(event) =>
                            handleUpdateStaff(event, member.id)
                          }
                        >
                          <label className="form-control w-full">
                            <span className="label">
                              <span className="label-text font-medium">
                                Full name
                              </span>
                            </span>
                            <input
                              className="input input-bordered w-full"
                              type="text"
                              autoComplete="name"
                              maxLength={120}
                              value={editName}
                              onChange={(event) =>
                                setEditName(event.target.value)
                              }
                              required
                            />
                          </label>

                          <label className="form-control w-full">
                            <span className="label">
                              <span className="label-text font-medium">
                                Email
                              </span>
                            </span>
                            <input
                              className="input input-bordered w-full"
                              type="email"
                              autoComplete="email"
                              maxLength={255}
                              value={editEmail}
                              onChange={(event) =>
                                setEditEmail(event.target.value)
                              }
                              required
                            />
                          </label>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              className="btn btn-primary btn-sm"
                              type="submit"
                              disabled={savingStaffId === member.id}
                            >
                              {savingStaffId === member.id
                                ? "Saving..."
                                : "Save changes"}
                            </button>

                            <button
                              className="btn btn-ghost btn-sm"
                              type="button"
                              onClick={cancelEditing}
                              disabled={savingStaffId === member.id}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="wrap-break-words font-semibold">
                              {member.name}
                            </p>
                            <p className="mt-1 break-all text-sm text-base-content/70">
                              {member.email}
                            </p>
                            <span
                              className={`badge mt-2 ${
                                member.is_active
                                  ? "badge-success"
                                  : "badge-ghost"
                              }`}
                            >
                              {member.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              className="btn btn-outline btn-sm"
                              type="button"
                              onClick={() => startEditing(member)}
                              disabled={savingStaffId !== null}
                            >
                              Edit
                            </button>

                            <button
                              className={`btn btn-sm ${
                                member.is_active
                                  ? "btn-error btn-outline"
                                  : "btn-success"
                              }`}
                              type="button"
                              onClick={() => handleToggleActive(member)}
                              disabled={savingStaffId === member.id}
                            >
                              {savingStaffId === member.id
                                ? "Saving..."
                                : member.is_active
                                  ? "Deactivate"
                                  : "Reactivate"}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

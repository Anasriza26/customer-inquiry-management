"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import WorkspaceHeader from "@/components/workspace-header";
import AuthGuard from "@/components/auth-guard";

type Inquiry = {
  id: number;
  customer_name: string;
  customer_contact: string;
  subject: string;
  description: string;
  status: "New" | "In Progress" | "Resolved";
  created_by: number;
  created_at: string;
  updated_at: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
};

type InquiryResponse = {
  inquiry: Inquiry;
};

type AuthResponse = {
  user: User;
};

type InquiryDetailsClientProps = {
  inquiryId: string;
};

type InquiryForm = {
  customerName: string;
  customerContact: string;
  subject: string;
  description: string;
};

type Toast = {
  type: "success" | "error";
  message: string;
};

const nextStatus: Record<Inquiry["status"], Inquiry["status"] | null> = {
  New: "In Progress",
  "In Progress": "Resolved",
  Resolved: "In Progress",
};

function statusBadgeClass(status: Inquiry["status"]) {
  switch (status) {
    case "New":
      return "badge-info";
    case "In Progress":
      return "badge-warning";
    case "Resolved":
      return "badge-success";
  }
}

function toInquiryForm(inquiry: Inquiry): InquiryForm {
  return {
    customerName: inquiry.customer_name,
    customerContact: inquiry.customer_contact,
    subject: inquiry.subject,
    description: inquiry.description,
  };
}

export default function InquiryDetailsClient({
  inquiryId,
}: InquiryDetailsClientProps) {
  const router = useRouter();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<InquiryForm>({
    customerName: "",
    customerContact: "",
    subject: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setLoading(true);
      setPageError("");

      try {
        const [inquiryData, authData] = await Promise.all([
          apiRequest<InquiryResponse>(
            `/inquiries/${encodeURIComponent(inquiryId)}`,
          ),
          apiRequest<AuthResponse>("/auth/me"),
        ]);

        if (!active) return;

        setInquiry(inquiryData.inquiry);
        setCurrentUser(authData.user);
        setEditForm(toInquiryForm(inquiryData.inquiry));
      } catch (requestError: unknown) {
        if (!active) return;

        if (requestError instanceof ApiError && requestError.status === 401) {
          setPageError("Your session has ended. Please sign in again.");
        } else if (
          requestError instanceof ApiError &&
          requestError.status === 404
        ) {
          setPageError("This inquiry was not found or you cannot access it.");
        } else {
          setPageError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load this inquiry.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, [inquiryId]);

  const canManageInquiry = Boolean(
    inquiry &&
    currentUser &&
    (currentUser.role === "admin" || currentUser.id === inquiry.created_by),
  );

  function showToast(type: Toast["type"], message: string) {
    setToast({ type, message });
  }

  function startEditing() {
    if (!inquiry) return;

    setEditForm(toInquiryForm(inquiry));
    setEditing(true);
    setToast(null);
  }

  function cancelEditing() {
    if (inquiry) {
      setEditForm(toInquiryForm(inquiry));
    }

    setEditing(false);
  }

  function updateEditField(field: keyof InquiryForm, value: string) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!inquiry) return;

    setToast(null);
    setSavingDetails(true);

    try {
      const data = await apiRequest<InquiryResponse>(
        `/inquiries/${inquiry.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            customerName: editForm.customerName.trim(),
            customerContact: editForm.customerContact.trim(),
            subject: editForm.subject.trim(),
            description: editForm.description.trim(),
          }),
        },
      );

      setInquiry(data.inquiry);
      setEditForm(toInquiryForm(data.inquiry));
      setEditing(false);
      showToast("success", "Inquiry details updated successfully.");
    } catch (requestError: unknown) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this inquiry.",
      );
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleDeleteInquiry() {
    if (!inquiry) return;

    const confirmed = window.confirm(
      `Permanently delete inquiry #${inquiry.id} — "${inquiry.subject}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setToast(null);
    setDeleting(true);

    try {
      await apiRequest<void>(`/inquiries/${inquiry.id}`, {
        method: "DELETE",
      });

      router.replace("/inquiries");
      router.refresh();
    } catch (requestError: unknown) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this inquiry.",
      );
      setDeleting(false);
    }
  }

  async function reloadInquiry() {
    const data = await apiRequest<InquiryResponse>(
      `/inquiries/${encodeURIComponent(inquiryId)}`,
    );

    setInquiry(data.inquiry);
    setEditForm(toInquiryForm(data.inquiry));
  }

  async function handleStatusChange() {
    if (!inquiry || !canManageInquiry) return;

    const newStatus = nextStatus[inquiry.status];

    if (!newStatus) return;

    setSavingStatus(true);
    setToast(null);

    try {
      const data = await apiRequest<InquiryResponse>(
        `/inquiries/${inquiry.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: newStatus,
            expectedStatus: inquiry.status,
          }),
        },
      );

      setInquiry(data.inquiry);
      showToast("success", `Status changed to ${data.inquiry.status}.`);
    } catch (requestError: unknown) {
      if (requestError instanceof ApiError && requestError.status === 409) {
        try {
          await reloadInquiry();
          showToast(
            "error",
            "This inquiry changed. The latest details have been loaded.",
          );
        } catch {
          showToast(
            "error",
            "The inquiry changed, but its latest details could not be loaded. Refresh and try again.",
          );
        }
      } else {
        showToast(
          "error",
          requestError instanceof Error
            ? requestError.message
            : "Unable to update the inquiry status.",
        );
      }
    } finally {
      setSavingStatus(false);
    }
  }

  const toastClass =
    toast?.type === "success" ? "alert-success" : "alert-error";

  return (
    <AuthGuard>
      <main className="min-h-dvh bg-base-200 px-4 py-6 sm:px-6 sm:py-10">
        <WorkspaceHeader />

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

        <div className="mx-auto w-full max-w-3xl">
          <Link className="btn btn-ghost btn-sm -ml-3 mb-5" href="/inquiries">
            ← Back to inquiries
          </Link>

          {loading ? (
            <div
              className="flex min-h-56 items-center justify-center gap-3 rounded-2xl bg-base-100"
              role="status"
              aria-live="polite"
            >
              <span className="loading loading-spinner loading-md text-primary" />
              <span>Loading inquiry...</span>
            </div>
          ) : !inquiry ? (
            <div className="alert alert-error" role="alert">
              <span>{pageError || "Unable to display this inquiry."}</span>
              {pageError.includes("sign in") && (
                <Link className="link font-semibold" href="/login">
                  Go to sign in
                </Link>
              )}
            </div>
          ) : (
            <article className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body p-5 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                      Inquiry #{inquiry.id}
                    </p>
                    <h1 className="mt-2 wrap-break-words text-2xl font-bold tracking-tight sm:text-3xl">
                      {inquiry.subject}
                    </h1>
                  </div>

                  <span
                    className={`badge badge-lg ${statusBadgeClass(inquiry.status)}`}
                  >
                    {inquiry.status}
                  </span>
                </div>

                {pageError && (
                  <div className="alert alert-error mt-5" role="alert">
                    <span>{pageError}</span>
                  </div>
                )}

                {editing ? (
                  <form className="mt-6 space-y-4" onSubmit={handleSaveInquiry}>
                    <label className="form-control w-full">
                      <span className="label">
                        <span className="label-text font-medium">
                          Customer name
                        </span>
                      </span>
                      <input
                        className="input input-bordered w-full"
                        type="text"
                        maxLength={120}
                        value={editForm.customerName}
                        onChange={(event) =>
                          updateEditField("customerName", event.target.value)
                        }
                        required
                      />
                    </label>

                    <label className="form-control w-full">
                      <span className="label">
                        <span className="label-text font-medium">
                          Contact details
                        </span>
                      </span>
                      <input
                        className="input input-bordered w-full"
                        type="text"
                        minLength={3}
                        maxLength={255}
                        value={editForm.customerContact}
                        onChange={(event) =>
                          updateEditField("customerContact", event.target.value)
                        }
                        required
                      />
                    </label>

                    <label className="form-control w-full">
                      <span className="label">
                        <span className="label-text font-medium">Subject</span>
                      </span>
                      <input
                        className="input input-bordered w-full"
                        type="text"
                        maxLength={200}
                        value={editForm.subject}
                        onChange={(event) =>
                          updateEditField("subject", event.target.value)
                        }
                        required
                      />
                    </label>

                    <label className="form-control w-full">
                      <span className="label">
                        <span className="label-text font-medium">
                          Description
                        </span>
                      </span>
                      <textarea
                        className="textarea textarea-bordered min-h-36 w-full"
                        minLength={1}
                        maxLength={5000}
                        value={editForm.description}
                        onChange={(event) =>
                          updateEditField("description", event.target.value)
                        }
                        required
                      />
                      <span className="label">
                        <span className="label-text-alt text-base-content/60">
                          {editForm.description.length}/5000 characters
                        </span>
                      </span>
                    </label>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={cancelEditing}
                        disabled={savingDetails}
                      >
                        Cancel
                      </button>

                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={savingDetails}
                      >
                        {savingDetails ? (
                          <>
                            <span className="loading loading-spinner loading-sm" />
                            Saving changes...
                          </>
                        ) : (
                          "Save changes"
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <section className="mt-6 grid grid-cols-1 gap-4 rounded-2xl bg-base-200/70 p-4 sm:grid-cols-2 sm:p-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                          Customer
                        </p>
                        <p className="mt-1 wrap-break-words font-medium">
                          {inquiry.customer_name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                          Contact
                        </p>
                        <p className="mt-1 break-all font-medium">
                          {inquiry.customer_contact}
                        </p>
                      </div>
                    </section>

                    <section className="mt-6">
                      <h2 className="text-sm font-semibold text-base-content/60">
                        Description
                      </h2>
                      <p className="mt-2 whitespace-pre-wrap wrap-break-words text-sm leading-7 sm:text-base">
                        {inquiry.description}
                      </p>
                    </section>

                    <div className="mt-6 grid grid-cols-1 gap-3 border-t border-base-200 pt-5 text-xs text-base-content/60 sm:grid-cols-2">
                      <p>
                        Created: {new Date(inquiry.created_at).toLocaleString()}
                      </p>
                      <p>
                        Last updated:{" "}
                        {new Date(inquiry.updated_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-base-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-base-content/70">
                        Current status: <strong>{inquiry.status}</strong>
                      </p>

                      {canManageInquiry && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            className="btn btn-primary w-full sm:w-auto"
                            type="button"
                            onClick={handleStatusChange}
                            disabled={savingStatus || savingDetails || deleting}
                          >
                            {savingStatus ? (
                              <>
                                <span className="loading loading-spinner loading-sm" />
                                Updating...
                              </>
                            ) : inquiry.status === "Resolved" ? (
                              "Reopen as In Progress"
                            ) : inquiry.status === "New" ? (
                              "Move to In Progress"
                            ) : (
                              "Mark as Resolved"
                            )}
                          </button>

                          <button
                            className="btn btn-outline w-full sm:w-auto"
                            type="button"
                            onClick={startEditing}
                            disabled={savingStatus || savingDetails || deleting}
                          >
                            Edit inquiry
                          </button>

                          <button
                            className="btn btn-error btn-outline w-full sm:w-auto"
                            type="button"
                            onClick={handleDeleteInquiry}
                            disabled={savingStatus || savingDetails || deleting}
                          >
                            {deleting ? (
                              <>
                                <span className="loading loading-spinner loading-sm" />
                                Deleting...
                              </>
                            ) : (
                              "Delete inquiry"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </article>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}

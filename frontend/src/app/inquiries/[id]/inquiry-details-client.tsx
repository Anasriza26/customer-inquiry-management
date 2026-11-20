"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";

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

type InquiryResponse = {
  inquiry: Inquiry;
};

type InquiryDetailsClientProps = {
  inquiryId: string;
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

export default function InquiryDetailsClient({
  inquiryId,
}: InquiryDetailsClientProps) {
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInquiry() {
      setLoading(true);
      setError("");

      try {
        const data = await apiRequest<InquiryResponse>(
          `/inquiries/${encodeURIComponent(inquiryId)}`,
        );

        if (active) {
          setInquiry(data.inquiry);
        }
      } catch (requestError: unknown) {
        if (!active) return;

        if (requestError instanceof ApiError && requestError.status === 401) {
          setError("Your session has ended. Please sign in again.");
        } else if (
          requestError instanceof ApiError &&
          requestError.status === 404
        ) {
          setError("This inquiry was not found or you cannot access it.");
        } else {
          setError(
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

    void loadInquiry();

    return () => {
      active = false;
    };
  }, [inquiryId]);

  async function reloadInquiry() {
    const data = await apiRequest<InquiryResponse>(
      `/inquiries/${encodeURIComponent(inquiryId)}`,
    );

    setInquiry(data.inquiry);
  }

  async function handleStatusChange() {
    if (!inquiry) return;

    const newStatus = nextStatus[inquiry.status];

    if (!newStatus) return;

    setSavingStatus(true);
    setError("");
    setNotice("");

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
      setNotice(`Status changed to ${data.inquiry.status}.`);
    } catch (requestError: unknown) {
      if (requestError instanceof ApiError && requestError.status === 409) {
        try {
          await reloadInquiry();
          setError(
            "This inquiry changed since it was opened. The latest details have been loaded.",
          );
        } catch {
          setError(
            "This inquiry changed, but the latest details could not be loaded. Refresh the page and try again.",
          );
        }
      } else if (
        requestError instanceof ApiError &&
        requestError.status === 401
      ) {
        setError("Your session has ended. Please sign in again.");
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to update the inquiry status.",
        );
      }
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <main className="min-h-dvh bg-base-200 px-4 py-6 sm:px-6 sm:py-10">
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
            <span>{error || "Unable to display this inquiry."}</span>
            {error.includes("sign in") && (
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

              {error && (
                <div className="alert alert-error mt-5" role="alert">
                  <span>{error}</span>
                </div>
              )}

              {notice && (
                <div className="alert alert-success mt-5" role="status">
                  <span>{notice}</span>
                </div>
              )}

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
                <p>Created: {new Date(inquiry.created_at).toLocaleString()}</p>
                <p>
                  Last updated: {new Date(inquiry.updated_at).toLocaleString()}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-base-content/70">
                  Current status: <strong>{inquiry.status}</strong>
                </p>

                <button
                  className="btn btn-primary w-full sm:w-auto"
                  type="button"
                  onClick={handleStatusChange}
                  disabled={savingStatus}
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
              </div>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}

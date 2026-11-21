"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import AuthGuard from "@/components/auth-guard";
import WorkspaceHeader from "@/components/workspace-header";
import InquiryCard from "./inquiry-card";

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

type InquiryListResponse = {
  inquiries: Inquiry[];
};

const statuses = ["New", "In Progress", "Resolved"] as const;

function InquiriesPageContent() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInquiries() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("q", search.trim());
      }

      if (status) {
        params.set("status", status);
      }

      const query = params.toString();
      const path = query ? `/inquiries?${query}` : "/inquiries";

      try {
        const data = await apiRequest<InquiryListResponse>(path);

        if (active) {
          setInquiries(data.inquiries);
        }
      } catch (requestError: unknown) {
        if (!active) return;

        if (requestError instanceof ApiError && requestError.status === 401) {
          setError("Your session has ended. Please sign in again.");
        } else {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load inquiries.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInquiries();

    return () => {
      active = false;
    };
  }, [search, status]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
  }

  return (
    <main className="min-h-dvh bg-base-200 px-4 py-6 sm:px-6 sm:py-10">
      <WorkspaceHeader />

      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 sm:mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Customer support
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
            Inquiries
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/70 sm:text-base">
            Find customer requests and see their current progress.
          </p>
        </header>

        <section className="card mb-6 border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-6">
            <form
              className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto_auto]"
              onSubmit={handleSearch}
            >
              <label className="form-control">
                <span className="label-text mb-2 font-medium">
                  Search inquiries
                </span>
                <input
                  className="input input-bordered w-full"
                  type="search"
                  placeholder="Customer, subject, or contact"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-2 font-medium">
                  Filter by status
                </span>
                <select
                  className="select select-bordered w-full"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="">All statuses</option>
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <button className="btn btn-primary self-end" type="submit">
                Search
              </button>

              <button
                className="btn btn-ghost self-end"
                type="button"
                onClick={clearFilters}
              >
                Clear
              </button>
            </form>
          </div>
        </section>

        {error && (
          <div className="alert alert-error mb-6" role="alert">
            <span>{error}</span>
          </div>
        )}

        <section aria-live="polite" aria-busy={loading}>
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl bg-base-100">
              <span className="loading loading-spinner loading-md text-primary" />
              <span>Loading inquiries...</span>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-5 py-12 text-center">
              <h2 className="text-lg font-semibold">No inquiries found</h2>
              <p className="mt-2 text-sm text-base-content/70">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {inquiries.map((inquiry) => (
                <InquiryCard
                  key={inquiry.id}
                  id={inquiry.id}
                  subject={inquiry.subject}
                  customerName={inquiry.customer_name}
                  customerContact={inquiry.customer_contact}
                  description={inquiry.description}
                  status={inquiry.status}
                  updatedAt={inquiry.updated_at}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function InquiriesPage() {
  return (
    <AuthGuard>
      <InquiriesPageContent />
    </AuthGuard>
  );
}

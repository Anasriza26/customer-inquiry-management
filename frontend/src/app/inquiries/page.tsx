"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import Link from "next/link";

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

export default function InquiriesPage() {
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
                <article
                  key={inquiry.id}
                  className="card border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md"
                >
                  <div className="card-body gap-4 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                          Inquiry #{inquiry.id}
                        </p>
                        <h2 className="mt-1 wrap-break-words text-lg font-bold">
                          {inquiry.subject}
                        </h2>
                      </div>
                      <span
                        className={`badge ${statusBadgeClass(inquiry.status)}`}
                      >
                        {inquiry.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="wrap-break-words font-medium">
                        {inquiry.customer_name}
                      </p>
                      <p className="break-all text-base-content/70">
                        {inquiry.customer_contact}
                      </p>
                    </div>

                    <p className="line-clamp-3 text-sm leading-6 text-base-content/70">
                      {inquiry.description}
                    </p>

                    <p className="border-t border-base-200 pt-3 text-xs text-base-content/50">
                      Updated {new Date(inquiry.updated_at).toLocaleString()}
                    </p>
                    <Link
                      className="btn btn-outline btn-sm mt-2 w-full sm:w-auto"
                      href={`/inquiries/${inquiry.id}`}
                    >
                      View inquiry
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

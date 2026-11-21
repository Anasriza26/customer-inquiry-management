"use client";

import Link from "next/link";

type InquiryCardProps = {
  id: number;
  subject: string;
  customerName: string;
  customerContact: string;
  description: string;
  status: "New" | "In Progress" | "Resolved";
  updatedAt: string;
};

function statusBadgeClass(status: InquiryCardProps["status"]) {
  switch (status) {
    case "New":
      return "badge-info";
    case "In Progress":
      return "badge-warning";
    case "Resolved":
      return "badge-success";
  }
}

export default function InquiryCard({
  id,
  subject,
  customerName,
  customerContact,
  description,
  status,
  updatedAt,
}: InquiryCardProps) {
  return (
    <article className="card border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md">
      <div className="card-body gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Inquiry #{id}
            </p>
            <h2 className="mt-1 wrap-break-words text-lg font-bold">
              {subject}
            </h2>
          </div>

          <span className={`badge ${statusBadgeClass(status)}`}>{status}</span>
        </div>

        <div className="space-y-1 text-sm">
          <p className="wrap-break-words font-medium">{customerName}</p>
          <p className="break-all text-base-content/70">{customerContact}</p>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-base-content/70">
          {description}
        </p>

        <p className="border-t border-base-200 pt-3 text-xs text-base-content/50">
          Updated {new Date(updatedAt).toLocaleString()}
        </p>

        <Link
          className="btn btn-outline btn-sm mt-2 w-full sm:w-auto"
          href={`/inquiries/${id}`}
        >
          View inquiry
        </Link>
      </div>
    </article>
  );
}

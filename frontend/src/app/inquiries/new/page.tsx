"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import WorkspaceHeader from "@/components/workspace-header";

type CreatedInquiry = {
  id: number;
  subject: string;
  status: "New" | "In Progress" | "Resolved";
};

type CreateInquiryResponse = {
  inquiry: CreatedInquiry;
};

const initialForm = {
  customerName: "",
  customerContact: "",
  subject: "",
  description: "",
};

export default function NewInquiryPage() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdInquiry, setCreatedInquiry] = useState<CreatedInquiry | null>(
    null,
  );

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreatedInquiry(null);
    setSaving(true);

    try {
      const data = await apiRequest<CreateInquiryResponse>("/inquiries", {
        method: "POST",
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerContact: form.customerContact.trim(),
          subject: form.subject.trim(),
          description: form.description.trim(),
        }),
      });

      setCreatedInquiry(data.inquiry);
      setForm(initialForm);
    } catch (requestError: unknown) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setError("Your session has ended. Please sign in again.");
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to save this inquiry. Please try again.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-dvh bg-base-200 px-4 py-6 sm:px-6 sm:py-10">
      <WorkspaceHeader />
      <div className="mx-auto w-full max-w-3xl">
        <Link className="btn btn-ghost btn-sm -ml-3 mb-5" href="/inquiries">
          ← Back to inquiries
        </Link>

        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-5 sm:p-8">
            <div className="mb-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
                Customer support
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Record a new inquiry
              </h1>
              <p className="mt-2 text-sm leading-6 text-base-content/70">
                Add the customer details and a short summary of their request.
              </p>
            </div>

            {error && (
              <div className="alert alert-error mt-4" role="alert">
                <span>{error}</span>
                {error.includes("sign in") && (
                  <Link className="link font-semibold" href="/login">
                    Go to sign in
                  </Link>
                )}
              </div>
            )}

            {createdInquiry && (
              <div className="alert alert-success mt-4" role="status">
                <div>
                  <p className="font-semibold">Inquiry saved successfully.</p>
                  <p className="text-sm">
                    Inquiry #{createdInquiry.id} · {createdInquiry.subject} ·{" "}
                    {createdInquiry.status}
                  </p>
                </div>
              </div>
            )}

            <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
              <fieldset disabled={saving} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="form-control">
                    <span className="label">
                      <span className="label-text font-medium">
                        Customer name
                      </span>
                    </span>
                    <input
                      className="input input-bordered w-full"
                      type="text"
                      name="customerName"
                      autoComplete="name"
                      maxLength={120}
                      placeholder="Enter customer name"
                      value={form.customerName}
                      onChange={(event) =>
                        updateField("customerName", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="form-control">
                    <span className="label">
                      <span className="label-text font-medium">
                        Contact details
                      </span>
                    </span>
                    <input
                      className="input input-bordered w-full"
                      type="text"
                      name="customerContact"
                      autoComplete="email"
                      minLength={3}
                      maxLength={255}
                      placeholder="Email address or phone number"
                      value={form.customerContact}
                      onChange={(event) =>
                        updateField("customerContact", event.target.value)
                      }
                      required
                    />
                  </label>
                </div>

                <label className="form-control">
                  <span className="label">
                    <span className="label-text font-medium">Subject</span>
                  </span>
                  <input
                    className="input input-bordered w-full"
                    type="text"
                    name="subject"
                    maxLength={200}
                    placeholder="Briefly describe the request"
                    value={form.subject}
                    onChange={(event) =>
                      updateField("subject", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="form-control">
                  <span className="label">
                    <span className="label-text font-medium">Description</span>
                  </span>
                  <textarea
                    className="textarea textarea-bordered min-h-36 w-full"
                    name="description"
                    minLength={1}
                    maxLength={5000}
                    placeholder="Add the key details of the customer’s inquiry"
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    required
                  />
                  <span className="label">
                    <span className="label-text-alt text-base-content/60">
                      {form.description.length}/5000 characters
                    </span>
                  </span>
                </label>
              </fieldset>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link className="btn btn-ghost" href="/inquiries">
                  Cancel
                </Link>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Saving inquiry...
                    </>
                  ) : (
                    "Save inquiry"
                  )}
                </button>
              </div>
            </form>

            {createdInquiry && (
              <div className="mt-2">
                <Link
                  className="btn btn-outline w-full sm:w-auto"
                  href="/inquiries"
                >
                  Return to inquiry list
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

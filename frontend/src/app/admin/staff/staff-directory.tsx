"use client";

import { useState, type FormEvent } from "react";
import type { Staff } from "./staff-types";

type StaffDirectoryProps = {
  staff: Staff[];
  savingStaffId: number | null;
  onUpdate: (
    staffId: number,
    changes: { name: string; email: string },
  ) => Promise<boolean>;
  onToggleActive: (member: Staff) => Promise<void>;
};

type StaffRowProps = {
  member: Staff;
  saving: boolean;
  onUpdate: StaffDirectoryProps["onUpdate"];
  onToggleActive: StaffDirectoryProps["onToggleActive"];
};

function StaffRow({ member, saving, onUpdate, onToggleActive }: StaffRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const updated = await onUpdate(member.id, {
      name: name.trim(),
      email: email.trim(),
    });

    if (updated) {
      setEditing(false);
    }
  }

  function cancelEditing() {
    setName(member.name);
    setEmail(member.email);
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="rounded-2xl border border-base-300 p-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="form-control w-full">
            <span className="label">
              <span className="label-text font-medium">Full name</span>
            </span>
            <input
              className="input input-bordered w-full"
              type="text"
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
              autoComplete="email"
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="btn btn-primary btn-sm"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>

            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={cancelEditing}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-base-300 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="wrap-break-words font-semibold">{member.name}</p>
          <p className="mt-1 break-all text-sm text-base-content/70">
            {member.email}
          </p>
          <span
            className={`badge mt-2 ${
              member.is_active ? "badge-success" : "badge-ghost"
            }`}
          >
            {member.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => setEditing(true)}
            disabled={saving}
          >
            Edit
          </button>

          <button
            className={`btn btn-sm ${
              member.is_active ? "btn-error btn-outline" : "btn-success"
            }`}
            type="button"
            onClick={() => onToggleActive(member)}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : member.is_active
                ? "Deactivate"
                : "Reactivate"}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function StaffDirectory({
  staff,
  savingStaffId,
  onUpdate,
  onToggleActive,
}: StaffDirectoryProps) {
  return (
    <section className="card min-w-0 border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body p-5 sm:p-6">
        <div>
          <h2 className="card-title text-xl">Staff directory</h2>
          <p className="mt-1 text-sm text-base-content/70">
            {staff.length} staff account{staff.length === 1 ? "" : "s"}
          </p>
        </div>

        {staff.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-base-300 px-4 py-10 text-center">
            <h3 className="font-semibold">No staff accounts yet</h3>
            <p className="mt-2 text-sm text-base-content/70">
              Create the first staff account using the form.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {staff.map((member) => (
              <StaffRow
                key={member.id}
                member={member}
                saving={savingStaffId === member.id}
                onUpdate={onUpdate}
                onToggleActive={onToggleActive}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

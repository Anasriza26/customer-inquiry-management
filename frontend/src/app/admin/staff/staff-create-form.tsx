"use client";

import { useState, type FormEvent } from "react";
import type { NewStaffInput } from "./staff-types";

type StaffCreateFormProps = {
  creating: boolean;
  onCreate: (input: NewStaffInput) => Promise<boolean>;
};

export default function StaffCreateForm({
  creating,
  onCreate,
}: StaffCreateFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const created = await onCreate({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    if (created) {
      setName("");
      setEmail("");
      setPassword("");
    }
  }

  return (
    <section className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body p-5 sm:p-6">
        <div>
          <h2 className="card-title text-xl">Add a staff member</h2>
          <p className="mt-1 text-sm leading-6 text-base-content/70">
            The password must contain at least 12 characters.
          </p>
        </div>

        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
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
              <span className="label-text font-medium">Initial password</span>
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
  );
}

// @vitest-environment jsdom

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import InquiryCard from "../src/app/inquiries/inquiry-card";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("InquiryCard", () => {
  it("shows inquiry details, status, and the detail-page link", () => {
    render(
      <InquiryCard
        id={42}
        subject="Coffee machine issue"
        customerName="Test Customer"
        customerContact="test@example.com"
        description="The machine is not working."
        status="In Progress"
        updatedAt="2026-11-22T10:00:00.000Z"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Coffee machine issue" }),
    ).toBeTruthy();

    expect(screen.getByText("Test Customer")).toBeTruthy();
    expect(screen.getByText("In Progress")).toBeTruthy();

    const detailLink = screen.getByRole("link", { name: "View inquiry" });
    expect(detailLink.getAttribute("href")).toBe("/inquiries/42");
  });
});

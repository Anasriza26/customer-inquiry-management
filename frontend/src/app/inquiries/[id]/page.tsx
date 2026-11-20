import { Suspense } from "react";
import InquiryDetailsClient from "./inquiry-details-client";

type InquiryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function InquiryLoading() {
  return (
    <main className="min-h-dvh bg-base-200 px-4 py-6 sm:px-6 sm:py-10">
      <div
        className="mx-auto flex min-h-56 w-full max-w-3xl items-center justify-center gap-3 rounded-2xl bg-base-100"
        role="status"
        aria-live="polite"
      >
        <span className="loading loading-spinner loading-md text-primary" />
        <span>Loading inquiry...</span>
      </div>
    </main>
  );
}

async function InquiryRouteContent({ params }: InquiryPageProps) {
  const { id } = await params;

  return <InquiryDetailsClient inquiryId={id} />;
}

export default function InquiryPage({ params }: InquiryPageProps) {
  return (
    <Suspense fallback={<InquiryLoading />}>
      <InquiryRouteContent params={params} />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AcceptInvitationCard } from "@/features/projects/components/accept-invitation-card";

function InvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <AcceptInvitationCard token={token} />
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto h-72 animate-pulse rounded-xl border border-border/60 bg-card/40 my-auto" />
      }
    >
      <InvitationContent />
    </Suspense>
  );
}

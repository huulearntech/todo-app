import * as React from "react";
import type { Metadata } from "next";
import { FullSpaceLayout } from "@/components/layout/full-space-layout";
import InboxHeader from "@/components/inbox/inbox-header";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Inbox page for the application",
};

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <FullSpaceLayout header={<InboxHeader />}>
      {children}
    </FullSpaceLayout>
  );
}
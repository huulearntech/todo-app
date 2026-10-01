import * as React from "react";
import Header from "@/components/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Inbox page for the application",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 h-full max-h-full overflow-hidden">
      <Header />
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
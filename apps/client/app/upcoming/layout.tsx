import type { Metadata } from "next";
import { FullSpaceLayout } from "@/components/layout/full-space-layout";

export const metadata: Metadata = {
  title: "Upcoming",
  description: "View upcoming tasks and calendar schedules.",
};

export default function UpcomingLayout({ children }: { children: React.ReactNode }) {
  return (
    <FullSpaceLayout>
      {children}
    </FullSpaceLayout>
  );
}
import type { Metadata } from "next";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export const metadata: Metadata = {
  title: "Productivity",
  description: "Boost your productivity with your task completion insights.",
};

export default function ProductivityLayout({ children }: { children: React.ReactNode }) {
  return (
    <StandardPageLayout>
      {children}
    </StandardPageLayout>
  );
}
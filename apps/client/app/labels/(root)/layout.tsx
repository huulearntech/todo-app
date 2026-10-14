import type { Metadata } from "next";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export const metadata: Metadata = {
  title: "Labels",
  description: "Manage your task labels.",
};

export default function LabelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <StandardPageLayout>
      {children}
    </StandardPageLayout>
  );
}
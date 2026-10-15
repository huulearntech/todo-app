import type { Metadata } from "next";
import LabelHeader from "@/features/labels/components/label-header";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export default function LabelsDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <StandardPageLayout header={<LabelHeader />}>
      {children}
    </StandardPageLayout>
  );
}

export const metadata: Metadata = {
  title: "Label Details",
  description: "View tasks associated with this label.",
};
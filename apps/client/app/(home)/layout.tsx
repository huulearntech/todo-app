import type { Metadata } from "next";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export const metadata: Metadata = {
  description: "A simple todo app built with Next.js and NestJS.",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <StandardPageLayout>
      {children}
    </StandardPageLayout>
  );
}

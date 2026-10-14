import * as React from "react";
import type { Metadata } from "next";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Manage your personal profile, avatar, and account preferences.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StandardPageLayout>{children}</StandardPageLayout>;
}
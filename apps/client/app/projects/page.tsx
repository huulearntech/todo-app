import type { Metadata } from "next";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { requireUser } from "@/lib/server/auth";
import { ProjectsPageContent } from "@/features/projects/components/projects-page-content";

export const metadata: Metadata = {
  title: "Projects",
  description: "Manage and organize your project boards and tasks.",
};

export default async function ProjectsPage() {
  const user = await requireUser("/projects");

  return (
    <StandardPageLayout>
      <ProjectsPageContent defaultProjectId={user.defaultProjectId} />
    </StandardPageLayout>
  );
}
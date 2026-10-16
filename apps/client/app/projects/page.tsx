import type { Metadata } from "next";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { requireUser } from "@/lib/server/auth";
import { ProjectsContent } from "@/features/projects/components/projects-content";

export const metadata: Metadata = {
  title: "Projects",
  description: "Manage and organize your project boards and tasks.",
};

export default async function ProjectsPage() {
  const user = await requireUser("/projects");

  return (
    <StandardPageLayout>
      <ProjectsContent defaultProjectId={user.defaultProjectId} />
    </StandardPageLayout>
  );
}
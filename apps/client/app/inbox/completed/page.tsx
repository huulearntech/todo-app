import ProjectCompletedTasks from "@/features/projects/components/project-completed-tasks";
import { requireUser } from "@/lib/server/auth";

export default async function InboxCompletedPage() {
  const user = await requireUser("/inbox/completed");

  return (
    <ProjectCompletedTasks
      projectId={user.defaultProjectId}
      backHref="/inbox"
      backLabel="Back to Inbox"
    />
  );
}

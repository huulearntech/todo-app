import { UpcomingEventCalendar } from "@/features/upcoming/components/upcoming-event-calendar";
import { requireUser } from "@/lib/server/auth";

export default async function UpcomingPage() {
  const user = await requireUser("/upcoming");

  return <UpcomingEventCalendar projectId={user.defaultProjectId} />;
}
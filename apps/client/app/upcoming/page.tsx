"use client";

import { UpcomingEventCalendar } from "@/components/upcoming/upcoming-event-calendar";
import { useAuth } from "@/providers/AuthProvider";

export default function UpcomingPage() {
  const { user } = useAuth();

  if (!user) {
    return "You must be logged in to view this page.";
  }

  return (
    <UpcomingEventCalendar projectId={user.defaultProjectId}/>
  );
}
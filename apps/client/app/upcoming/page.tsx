"use client";

import { TempEventCalendar } from "./temp-event-calendar";
import { useAuth } from "@/providers/AuthProvider"; // TODO: this is temporary

export default function UpcomingPage() {
  const { user } = useAuth();

  if (!user) {
    return "You must be logged in to view this page.";
  }

  return (
    <TempEventCalendar projectId={user.defaultProjectId}/>
  );
}
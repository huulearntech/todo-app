"use client";

import DndKanban from "@/components/(home)/dnd-kanban";
import { useAuth } from "@/providers/AuthProvider";

export default function InboxPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex-1 min-h-0 min-w-0 h-full flex items-center justify-center p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/60" />
      </main>
    );
  }

  if (!user?.defaultProjectId) {
    return (
      <main className="flex-1 min-h-0 min-w-0 h-full flex items-center justify-center p-6 text-sm text-muted-foreground">
        Please sign in to view your inbox.
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-0 min-w-0 h-full flex flex-col overflow-hidden">
      <DndKanban projectId={user.defaultProjectId} />
    </main>
  );
}
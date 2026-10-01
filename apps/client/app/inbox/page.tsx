"use client";

import * as React from "react";
import DndKanban from "@/components/(home)/dnd-kanban";
import { useAuth } from "@/providers/AuthProvider";

export default function InboxPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="flex-1 min-h-0 min-w-0 h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            You must be logged in to view this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-0 min-w-0 h-full flex flex-col overflow-hidden">
      <DndKanban projectId={user.defaultProjectId} />
    </main>
  );
}
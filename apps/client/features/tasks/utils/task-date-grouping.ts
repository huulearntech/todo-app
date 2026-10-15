import type { CompletedOccurrenceResponseDto } from "@todo/shared";

/**
 * Returns a human-friendly relative/calendar bucket for a completion date.
 * Buckets: "Today", "Yesterday", "Earlier this week", "Last week", or "Month Year".
 */
export function getDateGroupKey(dateString?: string | null): string {
  if (!dateString) return "Earlier";
  const date = new Date(dateString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return "Earlier this week";
  if (diffDays < 14) return "Last week";

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Groups occurrences by completion date bucket in descending chronological order.
 */
export function groupOccurrencesByDate(
  occurrences: CompletedOccurrenceResponseDto[]
): Record<string, CompletedOccurrenceResponseDto[]> {
  const groups: Record<string, CompletedOccurrenceResponseDto[]> = {};

  // Sort by completedAt descending
  const sorted = [...occurrences].sort((a, b) => {
    const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return timeB - timeA;
  });

  for (const occ of sorted) {
    const groupKey = getDateGroupKey(occ.completedAt);
    (groups[groupKey] ??= []).push(occ);
  }

  return groups;
}

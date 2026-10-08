"use client";

import { useEffect, useState } from "react";

export function useShowCompleted(viewKey: string) {
  const storageKey = `show-completed:${viewKey}`;
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setShowCompleted(stored === "true");
      }
    } catch {
      // Ignore localStorage errors (e.g. private mode)
    }
    setIsHydrated(true);
  }, [storageKey]);

  const updateShowCompleted = (value: boolean | ((prev: boolean) => boolean)) => {
    setShowCompleted((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  return [isHydrated ? showCompleted : false, updateShowCompleted] as const;
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { authService } from "@/services/auth.service";

export type VerificationStatus = "waiting" | "verified";

interface UseVerificationListenerOptions {
  userId: string | null;
  onVerified?: () => void;
  enabled?: boolean;
}

export function useVerificationListener({
  userId,
  onVerified,
  enabled = true,
}: UseVerificationListenerOptions) {
  const [status, setStatus] = useState<VerificationStatus>("waiting");

  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  const handleVerified = useCallback(() => {
    setStatus("verified");
    onVerifiedRef.current?.();
  }, []);

  useEffect(() => {
    if (!userId || !enabled) return;

    setStatus("waiting");
    let isDisposed = false;

    const cleanup = () => {
      isDisposed = true;
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    const checkStatus = async () => {
      if (isDisposed) return;
      try {
        const statusRes = await authService.getVerificationStatus(userId);
        if (statusRes.isEmailVerified && !isDisposed) {
          cleanup();
          handleVerified();
        }
      } catch {
        // Ignore network errors during polling
      }
    };

    // Check immediately on mount, then poll every 2 seconds
    checkStatus();
    const pollInterval = setInterval(checkStatus, 2000);

    // Also check immediately when the tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cleanup();
    };
  }, [userId, enabled, handleVerified]);

  return { status };
}

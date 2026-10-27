"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Diagnostic logging
    console.error("Global application error caught by root boundary:", error);
  }, [error]);

  const handleHardReload = () => {
    window.location.href = "/";
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/20 bg-slate-900/90 p-6 sm:p-8 text-center shadow-xl space-y-5">
          <div className="size-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Critical Application Error
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected failure occurred in the core application shell. You can attempt to reload the session.
            </p>
            {error?.digest && (
              <p className="text-[10px] text-slate-500 font-mono">
                Error Reference: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 text-slate-900 hover:bg-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={handleHardReload}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Reload to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

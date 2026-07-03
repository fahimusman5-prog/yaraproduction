"use client";
import { useEffect } from "react";

export function PosError({ error, reset }: { error?: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (error) console.error("[pos:error-boundary]", { message: error.message, digest: error.digest, stack: error.stack });
  }, [error]);

  return <div className="grid min-h-dvh place-items-center p-5"><div className="staff-panel max-w-md p-8 text-center"><h1 className="text-xl font-bold">POS is unavailable</h1><p className="mt-2 text-sm text-slate-500">The issue has been logged. Check the database connection, then try again.</p><button onClick={reset} className="staff-button staff-button-primary mt-5">Retry</button></div></div>;
}

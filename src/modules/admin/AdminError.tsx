"use client";
import { useEffect } from "react";

export function AdminError({ error, reset }: { error?: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (error) console.error("[admin:error-boundary]", { message: error.message, digest: error.digest, stack: error.stack });
  }, [error]);

  return <div className="staff-panel mx-auto max-w-lg p-8 text-center"><h1 className="text-xl font-bold">We couldn’t load this admin page</h1><p className="mt-2 text-sm text-slate-500">The issue has been logged. Check the connection, permissions, or selected record, then try again.</p><button onClick={reset} className="staff-button staff-button-primary mt-5">Try again</button></div>;
}

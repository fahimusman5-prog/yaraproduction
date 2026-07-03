"use client";

import { AdminError } from "@/modules/admin/AdminError";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { return <AdminError error={error} reset={reset} />; }

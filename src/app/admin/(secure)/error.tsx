"use client";

import { AdminError } from "@/modules/admin/AdminError";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <AdminError reset={reset} />; }

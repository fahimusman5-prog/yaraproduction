"use client";

import { PosError } from "@/modules/pos/PosError";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { return <PosError error={error} reset={reset} />; }

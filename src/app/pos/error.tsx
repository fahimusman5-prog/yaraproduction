"use client";

import { PosError } from "@/modules/pos/PosError";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <PosError reset={reset} />; }

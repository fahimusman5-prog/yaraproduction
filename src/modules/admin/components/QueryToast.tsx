"use client";

import { CheckCircle2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function QueryToast() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);
  const saved = searchParams?.get("saved");
  if (!saved || !visible) return null;
  return <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-emerald-800 shadow-xl"><CheckCircle2 className="h-5 w-5" />Product {saved}.<button className="ml-2 grid min-h-11 min-w-11 place-items-center" onClick={() => setVisible(false)} aria-label="Dismiss notification"><X className="h-4 w-4" /></button></div>;
}

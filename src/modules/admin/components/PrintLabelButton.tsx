"use client";

import { Printer } from "lucide-react";
import { useState } from "react";

export function PrintLabelButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function generate() {
    if (loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/shipping-label`, { credentials: "same-origin" });
      if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.error || "Unable to generate label. Please try again."); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const disposition = response.headers.get("content-disposition");
      const filename = disposition?.match(/filename="([^"]+)"/)?.[1] || `YARA-Shipping-Label-${orderId}.pdf`;
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to generate label. Please try again."); }
    finally { setLoading(false); }
  }
  return <div className="flex flex-col items-end gap-2"><button type="button" onClick={generate} disabled={loading} className="staff-button staff-button-primary"><Printer className="h-4 w-4" aria-hidden="true" />{loading ? "Generating…" : "Print Label"}</button>{error && <p role="alert" className="max-w-xs text-right text-xs text-red-700">{error}</p>}</div>;
}

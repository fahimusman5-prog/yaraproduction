"use client";

import dynamic from "next/dynamic";

const StorefrontApp = dynamic(() => import("../../App"), {
  ssr: false,
  loading: () => <div className="grid min-h-dvh place-items-center bg-yara-ivory text-yara-wine">Loading YARA…</div>,
});

export function CustomerStorefront() {
  return <StorefrontApp />;
}

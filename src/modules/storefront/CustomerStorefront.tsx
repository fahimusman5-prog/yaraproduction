"use client";

import dynamic from "next/dynamic";

const loadingText: Record<string, string> = {
  en: "Loading YARA...",
  si: "YARA පූරණය වේ...",
  ta: "YARA ஏற்றப்படுகிறது...",
  ar: "جار تحميل YARA...",
};

function StorefrontLoading() {
  const locale = typeof window === "undefined" ? "en" : window.location.pathname.split("/")[1];
  return <div className="grid min-h-dvh place-items-center bg-yara-ivory text-yara-wine">{loadingText[locale] || loadingText.en}</div>;
}

const StorefrontApp = dynamic(() => import("../../App"), {
  ssr: false,
  loading: () => <StorefrontLoading />,
});

export function CustomerStorefront() {
  return <StorefrontApp />;
}

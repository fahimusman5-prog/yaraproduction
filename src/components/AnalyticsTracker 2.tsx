import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { analyticsConsent, setAnalyticsConsent, trackEvent } from "../lib/analytics";

export function AnalyticsTracker() {
  const location = useLocation();
  const [choiceMade, setChoiceMade] = useState(() => localStorage.getItem("yara-analytics-consent") !== null);
  useEffect(() => { trackEvent("page_view", { path: location.pathname }); }, [location.pathname, location.search]);
  if (choiceMade || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") return null;
  return <aside className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-2xl rounded-2xl border border-yara-rose bg-white p-4 shadow-soft sm:flex sm:items-center sm:gap-4" aria-label="Analytics consent"><p className="text-sm leading-6 text-yara-taupe">Allow privacy-conscious analytics to help YARA improve the storefront? No contact or address data is sent.</p><div className="mt-3 flex gap-2 sm:mt-0"><button type="button" onClick={() => { setAnalyticsConsent(false); setChoiceMade(true); }} className="btn-secondary">Decline</button><button type="button" onClick={() => { setAnalyticsConsent(true); setChoiceMade(true); trackEvent("page_view", { path: location.pathname }); }} className="btn-primary">Allow</button></div></aside>;
}

export { analyticsConsent };

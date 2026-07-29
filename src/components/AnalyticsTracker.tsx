import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  analyticsConsent,
  setAnalyticsConsent,
  trackEvent,
} from "../lib/analytics";

const analyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() ?? "";

function loadGoogleAnalytics() {
  if (
    !analyticsConsent() ||
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true" ||
    !/^G-[A-Z0-9]+$/i.test(analyticsId) ||
    document.querySelector(`script[data-yara-analytics="${analyticsId}"]`)
  )
    return;
  const dataLayer = ((
    window as typeof window & { dataLayer?: unknown[] }
  ).dataLayer ??= []);
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
  script.dataset.yaraAnalytics = analyticsId;
  document.head.appendChild(script);
  const gtag = (...args: unknown[]) => dataLayer.push(args);
  gtag("js", new Date());
  gtag("config", analyticsId, {
    send_page_view: false,
    allow_google_signals: false,
  });
}

export function AnalyticsTracker() {
  const location = useLocation();
  const [choiceMade, setChoiceMade] = useState(
    () => localStorage.getItem("yara-analytics-consent") !== null,
  );
  useEffect(() => {
    loadGoogleAnalytics();
    trackEvent("page_view", {
      path: location.pathname,
      query_present: Boolean(location.search),
    });
  }, [location.pathname, location.search]);
  if (
    choiceMade ||
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true"
  )
    return null;
  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-2xl rounded-2xl border border-yara-rose bg-white p-4 shadow-soft sm:flex sm:items-center sm:gap-4"
      aria-label="Analytics consent"
    >
      <p className="text-sm leading-6 text-yara-taupe">
        Allow privacy-conscious analytics to help YARA improve the storefront?
        No contact or address data is sent.
      </p>
      <div className="mt-3 flex gap-2 sm:mt-0">
        <button
          type="button"
          onClick={() => {
            setAnalyticsConsent(false);
            setChoiceMade(true);
          }}
          className="btn-secondary"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => {
            setAnalyticsConsent(true);
            setChoiceMade(true);
            loadGoogleAnalytics();
            trackEvent("page_view", { path: location.pathname });
          }}
          className="btn-primary"
        >
          Allow
        </button>
      </div>
    </aside>
  );
}

export { analyticsConsent };

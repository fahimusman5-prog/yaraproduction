"use client";

import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import { invalidNewsletterResponse, newsletterMessage, type NewsletterResponse } from "@/lib/newsletter";

export function NewsletterForm() {
  const { locale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<NewsletterResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = invalidNewsletterResponse(email);
    if (invalid) { setFeedback(invalid); return; }
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, locale, website: honeypotRef.current?.value ?? "" }) });
      const body = await result.json().catch(() => null) as NewsletterResponse | null;
      const next = body && typeof body.message === "string" ? body : newsletterMessage("error");
      setFeedback(next);
      if (next.success) setEmail("");
    } catch {
      setFeedback(newsletterMessage("error"));
    } finally { setSubmitting(false); }
  }

  const feedbackStyle = feedback?.success ? "text-emerald-800" : "text-yara-wine";
  return <form className="mt-5" onSubmit={submit} noValidate>
    <label htmlFor="newsletter-email" className="sr-only">{t("layout.emailAddress")}</label>
    <div className="glass-panel flex min-w-0 rounded-full p-1 focus-within:ring-2 focus-within:ring-yara-wine/35 focus-within:ring-offset-2 focus-within:ring-offset-[#fde8ee]">
      <input id="newsletter-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" placeholder="Enter your email address" aria-describedby="newsletter-feedback" aria-invalid={feedback?.status === "invalid_email" ? true : undefined} disabled={submitting} className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-yara-ink placeholder:text-yara-taupe/75 focus:outline-none disabled:opacity-70" />
      <input ref={honeypotRef} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0" />
      <button type="submit" disabled={submitting} className="glass-icon-primary h-11 w-11 shrink-0 disabled:cursor-wait" aria-label={submitting ? "Subscribing" : feedback?.success ? "Subscribed" : t("layout.joinNewsletter")} aria-busy={submitting}>
        {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : feedback?.success ? <Check className="h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
    <p id="newsletter-feedback" aria-live="polite" className={`min-h-6 px-4 pt-2 text-xs font-medium ${feedback ? feedbackStyle : "text-transparent"}`}>{feedback?.message ?? " "}</p>
  </form>;
}

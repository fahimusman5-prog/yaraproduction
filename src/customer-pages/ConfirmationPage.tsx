"use client";

import { FormEvent, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAuthConfirmUrl } from "../lib/site-url";
import { getSupabaseBrowserClient } from "../lib/supabase/browser";

const messages: Record<string, string> = {
  otp_expired: "The confirmation link has expired. Request a new one.",
  access_denied: "We couldn’t confirm this account.",
  invalid: "This confirmation link is invalid or has expired.",
};

export function ConfirmationPage() {
  const location = useLocation();
  const code = new URLSearchParams(location.search).get("code") ?? "invalid";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const expired = code === "otp_expired" || code === "invalid" || code === "access_denied";

  const resend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const client = getSupabaseBrowserClient();
    const emailRedirectTo = getAuthConfirmUrl();
    try {
      if (!client || !emailRedirectTo) throw new Error("unavailable");
      const { error } = await client.auth.resend({ type: "signup", email: email.trim().toLowerCase(), options: { emailRedirectTo } });
      if (error && /rate_limit|too many|over_.*limit/i.test(`${error.code ?? ""} ${error.message}`)) {
        setMessage("Too many confirmation emails were requested. Please wait and try again.");
      } else {
        setMessage("If an account exists and still needs confirmation, a new email has been sent.");
      }
    } catch {
      setMessage("If an account exists and still needs confirmation, a new email has been sent.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-shell py-14 sm:py-24">
      <div className="mx-auto max-w-xl rounded-[2.4rem] bg-white p-7 text-center shadow-soft sm:p-12">
        <p className="eyebrow">YARA account security</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{expired ? "This confirmation link is invalid or has expired." : "Your email has been confirmed."}</h1>
        <p className="mt-5 text-sm font-light leading-7 text-yara-taupe">{messages[code] ?? "Your email has been confirmed. You can continue to your account."}</p>
        {message && <p role="status" className="mt-6 rounded-2xl bg-yara-rose/50 p-4 text-sm leading-6 text-yara-wine">{message}</p>}
        {expired && (
          <form onSubmit={resend} className="mt-8 space-y-3 text-left">
            <label className="block"><span className="field-label">Email address</span><input className="field" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <button className="btn-primary w-full" type="submit" disabled={busy}>{busy ? "Sending…" : "Send a new confirmation email"}</button>
          </form>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="btn-primary" to={expired ? "/login" : "/account"}>{expired ? "Return to Sign In" : "Go to My Account"}</Link>
          <Link className="btn-secondary" to={expired ? "/login" : "/shop"}>{expired ? "Sign In" : "Continue Shopping"}</Link>
        </div>
      </div>
    </div>
  );
}

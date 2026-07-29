import { LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getSupabaseBrowserClient } from "../lib/supabase/browser";

export function ResetPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");
    if (password !== confirmation) { setMessage({ error: true, text: "Passwords do not match." }); return; }
    const client = getSupabaseBrowserClient();
    if (!client) { setMessage({ error: true, text: "Account services are temporarily unavailable." }); return; }
    setBusy(true); setMessage(null);
    const { error } = await client.auth.updateUser({ password });
    setBusy(false);
    setMessage(error ? { error: true, text: "This reset link is invalid or expired. Request a new link and try again." } : { error: false, text: "Your password has been updated. You can now access your account." });
  };
  return <div className="page-shell py-14 sm:py-24"><div className="mx-auto max-w-lg rounded-[2.4rem] bg-white p-7 shadow-soft sm:p-12"><LockKeyhole className="h-7 w-7 text-yara-wine" /><h1 className="mt-5 text-4xl">Choose a new password</h1><p className="mt-4 text-sm leading-7 text-yara-taupe">Use at least eight characters and keep your password private.</p>{message && <p role="status" className={`mt-6 rounded-2xl p-4 text-sm ${message.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{message.text}</p>}<form onSubmit={submit} className="mt-8 space-y-5"><label className="block"><span className="field-label">New password</span><input name="password" type="password" minLength={8} required autoComplete="new-password" className="field" /></label><label className="block"><span className="field-label">Confirm new password</span><input name="confirmation" type="password" minLength={8} required autoComplete="new-password" className="field" /></label><button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70">{busy ? "Updating…" : "Update password"}</button></form><Link to="/login" className="mt-6 inline-block text-sm font-semibold text-yara-wine">Return to sign in</Link></div></div>;
}

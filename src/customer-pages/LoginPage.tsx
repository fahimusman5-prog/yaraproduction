import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSupabaseBrowserClient } from "../lib/supabase/browser";
import { useI18n } from "../i18n";

type Mode = "login" | "register" | "forgot";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const { locale, t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const client = getSupabaseBrowserClient();
    if (!client) {
      setMessage({ kind: "error", text: "Account services are temporarily unavailable." });
      return;
    }
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    const fullName = String(data.get("fullName") ?? "").trim();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "forgot") {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/${locale}/reset-password` });
        if (error) throw error;
        setMessage({ kind: "success", text: "If an account exists for that email, password-reset instructions have been sent." });
        return;
      }
      if (mode === "register") {
        const { data: result, error } = await client.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/${locale}/account` } });
        if (error) throw error;
        if (result.session) navigate("/account", { replace: true });
        else setMessage({ kind: "success", text: "Check your email to verify your YARA account." });
        return;
      }
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/account", { replace: true });
    } catch {
      setMessage({ kind: "error", text: mode === "login" ? "We could not sign you in. Check your email and password." : mode === "register" ? "We could not create the account. The email may already be registered or the password may not meet security requirements." : "We could not send reset instructions. Please try again shortly." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-shell py-14 sm:py-24">
      <div className="mx-auto max-w-xl rounded-[2.4rem] bg-white p-7 shadow-soft sm:p-12">
        <p className="eyebrow">{t("login.circle")}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{mode === "login" ? t("login.welcome") : mode === "register" ? "Create your account" : "Reset your password"}</h1>
        <p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{mode === "forgot" ? "Enter your account email and we’ll send secure reset instructions." : "Manage your details and review your YARA orders securely."}</p>
        {message && <p role="status" className={`mt-6 rounded-2xl p-4 text-sm leading-6 ${message.kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message.text}</p>}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {mode === "register" && <label className="block"><span className="field-label">Full name</span><span className="relative block"><UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yara-taupe" /><input name="fullName" required minLength={2} maxLength={200} autoComplete="name" className="field pl-11" /></span></label>}
          <label className="block"><span className="field-label">{t("layout.emailAddress")}</span><span className="relative block"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yara-taupe" /><input name="email" type="email" required autoComplete="email" inputMode="email" placeholder={t("checkout.emailPlaceholder")} className="field pl-11" /></span></label>
          {mode !== "forgot" && <label className="block"><span className="field-label">{t("login.password")}</span><span className="relative block"><LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yara-taupe" /><input name="password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete={mode === "register" ? "new-password" : "current-password"} className="field pl-11 pr-14" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="glass-icon absolute inset-y-0 right-1 my-auto h-11 w-11" aria-label={showPassword ? t("login.hide") : t("login.show")}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:cursor-wait disabled:opacity-70">{busy ? "Please wait…" : mode === "login" ? t("login.signIn") : mode === "register" ? "Create account" : "Send reset link"} <ArrowRight className="h-4 w-4" /></button>
        </form>
        <div className="mt-7 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
          {mode !== "login" && <button type="button" onClick={() => { setMode("login"); setMessage(null); }} className="font-semibold text-yara-wine">Sign in</button>}
          {mode !== "register" && <button type="button" onClick={() => { setMode("register"); setMessage(null); }} className="font-semibold text-yara-wine">Create account</button>}
          {mode !== "forgot" && <button type="button" onClick={() => { setMode("forgot"); setMessage(null); }} className="font-semibold text-yara-wine">Forgot password?</button>}
        </div>
        <p className="mt-7 text-center text-xs leading-5 text-yara-taupe">By creating an account, you agree to YARA’s <Link to="/terms-and-conditions" className="font-semibold text-yara-wine underline">Terms and Conditions</Link> and <Link to="/privacy-policy" className="font-semibold text-yara-wine underline">Privacy Policy</Link>.</p>
      </div>
    </div>
  );
}

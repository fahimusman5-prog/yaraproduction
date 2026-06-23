"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Supabase is not configured. Add the required environment variables first."); setLoading(false); return; }
    const data = new FormData(event.currentTarget);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: String(data.get("email")), password: String(data.get("password")) });
    if (authError || !authData.user) { setError(authError?.message ?? "Unable to sign in."); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).single();
    if (!profile || !["admin", "staff"].includes(profile.role)) { await supabase.auth.signOut(); setError("This account does not have staff access."); setLoading(false); return; }
    const requested = new URLSearchParams(window.location.search).get("next");
    const destination = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/admin";
    router.replace(destination); router.refresh();
  };

  return <div className="staff-root grid min-h-dvh lg:grid-cols-[1.05fr_.95fr]"><section className="hidden bg-[#21191d] p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="text-2xl font-bold tracking-[.24em]">YARA</div><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-rose-300">Private workspace</p><h1 className="mt-5 text-5xl font-bold leading-tight">Run every order, product, and sale from one calm place.</h1><p className="mt-5 text-base leading-7 text-white/65">Secure operations for YARA administrators and retail staff.</p></div><p className="text-xs text-white/40">YARA Productions · Staff access only</p></section><main className="grid place-items-center p-5 sm:p-10"><div className="w-full max-w-md"><div className="mb-8 lg:hidden"><p className="text-xl font-bold tracking-[.2em]">YARA</p></div><p className="text-xs font-bold uppercase tracking-[.15em] text-yara-wine">Staff sign in</p><h2 className="mt-3 text-3xl font-bold">Welcome back</h2><p className="mt-3 text-sm leading-6 text-slate-500">Use your Supabase staff account to continue.</p><form onSubmit={submit} className="staff-panel mt-8 space-y-5 p-6 sm:p-8">{error && <div role="alert" className="staff-error">{error}</div>}<label><span className="staff-label">Email address</span><span className="relative block"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="staff-input pl-10" type="email" name="email" required autoComplete="email" /></span></label><label><span className="staff-label">Password</span><span className="relative block"><LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="staff-input px-10" type={showPassword ? "text" : "password"} name="password" required autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-1 top-1/2 grid min-h-11 min-w-11 -translate-y-1/2 place-items-center" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label><button disabled={loading} className="staff-button staff-button-primary w-full" type="submit">{loading && <LoaderCircle className="h-4 w-4 animate-spin" />}{loading ? "Signing in…" : "Sign in"}</button></form></div></main></div>;
}

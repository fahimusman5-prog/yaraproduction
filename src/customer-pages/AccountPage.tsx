import { LoaderCircle, LogOut, Package, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSupabaseBrowserClient } from "../lib/supabase/browser";

type Order = { id: string; order_number: string; order_status: string; payment_status: string; total_amount: number; currency: string; created_at: string };

export function AccountPage() {
  const [state, setState] = useState<{ loading: boolean; email: string; name: string; orders: Order[]; error: string }>({ loading: true, email: "", name: "", orders: [], error: "" });
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const client = getSupabaseBrowserClient();
      if (!client) { if (active) setState((value) => ({ ...value, loading: false, error: "Account services are temporarily unavailable." })); return; }
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { navigate("/login", { replace: true }); return; }
      const [profile, orders] = await Promise.all([
        client.from("profiles").select("full_name,email").eq("id", auth.user.id).maybeSingle(),
        client.from("orders").select("id,order_number,order_status,payment_status,total_amount,currency,created_at").eq("customer_user_id", auth.user.id).order("created_at", { ascending: false }).limit(50),
      ]);
      if (!active) return;
      setState({ loading: false, email: String(profile.data?.email ?? auth.user.email ?? ""), name: String(profile.data?.full_name ?? auth.user.user_metadata?.full_name ?? ""), orders: (orders.data ?? []) as Order[], error: profile.error || orders.error ? "Some account information could not be loaded." : "" });
    };
    void load();
    return () => { active = false; };
  }, [navigate]);

  const signOut = async () => {
    await getSupabaseBrowserClient()?.auth.signOut();
    navigate("/", { replace: true });
  };

  if (state.loading) return <div className="page-shell grid min-h-[50vh] place-items-center" aria-busy="true"><LoaderCircle className="h-8 w-8 animate-spin text-yara-wine" /><span className="sr-only">Loading account</span></div>;
  return <div className="page-shell py-12 sm:py-20"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Your YARA account</p><h1 className="mt-3 text-4xl sm:text-5xl">Welcome{state.name ? `, ${state.name}` : ""}</h1><p className="mt-3 text-sm text-yara-taupe">{state.email}</p></div><button type="button" onClick={signOut} className="btn-secondary"><LogOut className="h-4 w-4" />Sign out</button></div>{state.error && <p role="alert" className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{state.error}</p>}<div className="mt-10 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]"><section className="surface-card p-6 sm:p-8"><UserRound className="h-6 w-6 text-yara-wine" /><h2 className="mt-4 text-2xl">Profile</h2><p className="mt-4 text-sm leading-7 text-yara-taupe">Your verified account details are used to connect eligible orders and keep your information private.</p><Link to="/contact" className="btn-secondary mt-6">Request profile help</Link></section><section className="surface-card p-6 sm:p-8"><Package className="h-6 w-6 text-yara-wine" /><h2 className="mt-4 text-2xl">Order history</h2>{state.orders.length ? <div className="mt-5 grid gap-3">{state.orders.map((order) => <article key={order.id} className="rounded-2xl border border-yara-rose p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs font-bold text-yara-wine">{order.order_number}</p><p className="mt-1 text-xs text-yara-taupe">{new Date(order.created_at).toLocaleDateString()}</p></div><p className="font-serif text-xl">{new Intl.NumberFormat(undefined, { style: "currency", currency: order.currency }).format(order.total_amount)}</p></div><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-yara-rose px-3 py-1 capitalize">{order.order_status.replaceAll("_", " ")}</span><span className="rounded-full bg-yara-blush px-3 py-1 capitalize">{order.payment_status.replaceAll("_", " ")}</span></div></article>)}</div> : <div className="mt-6 rounded-2xl bg-yara-blush p-5 text-sm text-yara-taupe"><p>No account-linked orders yet.</p><Link to="/shop" className="mt-3 inline-block font-semibold text-yara-wine">Browse products</Link></div>}</section></div></div>;
}

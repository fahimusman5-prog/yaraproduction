import { LoaderCircle, LogOut, MapPin, Package, Pencil, Plus, Star, Trash2, UserRound, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSupabaseBrowserClient } from "../lib/supabase/browser";

type Order = { id: string; order_number: string; order_status: string; payment_status: string; total_amount: number; subtotal_amount: number; shipping_fee: number; discount_amount: number; currency: string; created_at: string };
type Address = { id: string; label: string; recipient_name: string; phone: string; address: string; address_line_2: string; city: string; district_area: string; building_details: string; landmark: string; postal_code: string; country: "sri-lanka" | "uae"; is_default: boolean };
type AccountState = { loading: boolean; userId: string; email: string; name: string; orders: Order[]; addresses: Address[]; error: string };
const emptyState: AccountState = { loading: true, userId: "", email: "", name: "", orders: [], addresses: [], error: "" };

export function AccountPage() {
  const [state, setState] = useState<AccountState>(emptyState);
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    const client = getSupabaseBrowserClient();
    if (!client) { setState((value) => ({ ...value, loading: false, error: "Account services are temporarily unavailable." })); return; }
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) { navigate("/login", { replace: true }); return; }
    const [profile, orders, addresses] = await Promise.all([
      client.from("profiles").select("full_name,email").eq("id", auth.user.id).maybeSingle(),
      client.from("orders").select("id,order_number,order_status,payment_status,total_amount,subtotal_amount,shipping_fee,discount_amount,currency,created_at").eq("customer_user_id", auth.user.id).order("created_at", { ascending: false }).limit(50),
      client.from("customer_addresses").select("*").eq("user_id", auth.user.id).order("is_default", { ascending: false }).order("updated_at", { ascending: false }),
    ]);
    setState({ loading: false, userId: auth.user.id, email: String(profile.data?.email ?? auth.user.email ?? ""), name: String(profile.data?.full_name ?? auth.user.user_metadata?.full_name ?? ""), orders: (orders.data ?? []) as Order[], addresses: (addresses.data ?? []) as Address[], error: profile.error || orders.error || addresses.error ? "Some account information could not be loaded." : "" });
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await getSupabaseBrowserClient()?.auth.signOut();
    navigate("/", { replace: true });
  };

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client || !state.userId) return;
    const data = new FormData(event.currentTarget);
    const country = String(data.get("country")) as Address["country"];
    const payload = {
      user_id: state.userId,
      label: String(data.get("label") ?? "").trim(),
      recipient_name: String(data.get("recipient_name") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      address: String(data.get("address") ?? "").trim(),
      address_line_2: String(data.get("address_line_2") ?? "").trim(),
      city: String(data.get("city") ?? "").trim(),
      district_area: String(data.get("district_area") ?? "").trim(),
      building_details: String(data.get("building_details") ?? "").trim(),
      landmark: String(data.get("landmark") ?? "").trim(),
      postal_code: String(data.get("postal_code") ?? "").trim(),
      country,
    };
    setBusy(true); setMessage("");
    const result = editing !== "new" && editing
      ? await client.from("customer_addresses").update(payload).eq("id", editing.id).eq("user_id", state.userId)
      : await client.from("customer_addresses").insert(payload);
    if (result.error) setMessage("The address could not be saved. Check every required field.");
    else { setEditing(null); setMessage("Address saved."); await load(); }
    setBusy(false);
  };

  const setDefault = async (id: string) => {
    const client = getSupabaseBrowserClient(); if (!client) return;
    setBusy(true); setMessage("");
    const { error } = await client.rpc("set_default_customer_address", { p_address_id: id });
    setMessage(error ? "The default address could not be changed." : "Default address updated.");
    await load(); setBusy(false);
  };

  const removeAddress = async (id: string) => {
    if (!window.confirm("Delete this saved address? Historical orders will not change.")) return;
    const client = getSupabaseBrowserClient(); if (!client) return;
    setBusy(true); setMessage("");
    const { error } = await client.rpc("delete_customer_address", { p_address_id: id });
    setMessage(error ? "The address could not be deleted." : "Address deleted.");
    await load(); setBusy(false);
  };

  if (state.loading) return <div className="page-shell grid min-h-[50vh] place-items-center" aria-busy="true"><LoaderCircle className="h-8 w-8 animate-spin text-yara-wine" /><span className="sr-only">Loading account</span></div>;
  return <div className="page-shell py-12 sm:py-20">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Your YARA account</p><h1 className="mt-3 text-4xl sm:text-5xl">Welcome{state.name ? `, ${state.name}` : ""}</h1><p className="mt-3 text-sm text-yara-taupe">{state.email}</p></div><button type="button" onClick={signOut} className="btn-secondary"><LogOut className="h-4 w-4" />Sign out</button></div>
    {state.error && <p role="alert" className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{state.error}</p>}
    {message && <p role="status" className="mt-6 rounded-2xl bg-yara-blush p-4 text-sm text-yara-wine">{message}</p>}
    <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="surface-card p-6 sm:p-8"><UserRound className="h-6 w-6 text-yara-wine" /><h2 className="mt-4 text-2xl">Profile</h2><p className="mt-4 text-sm leading-7 text-yara-taupe">Your verified account connects eligible orders and saved delivery addresses while historical order records remain unchanged.</p><Link to="/contact" className="btn-secondary mt-6">Request profile help</Link></section>
      <section className="surface-card p-6 sm:p-8"><div className="flex items-center justify-between gap-4"><div><MapPin className="h-6 w-6 text-yara-wine" /><h2 className="mt-4 text-2xl">Saved addresses</h2></div><button type="button" onClick={() => setEditing("new")} className="btn-secondary"><Plus className="h-4 w-4" />Add</button></div>
        {state.addresses.length ? <div className="mt-5 grid gap-3">{state.addresses.map((address) => <article key={address.id} className="rounded-2xl border border-yara-rose p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{address.label}{address.is_default && <span className="ml-2 rounded-full bg-yara-rose px-2 py-1 text-[0.65rem] text-yara-wine">Default</span>}</p><p className="mt-2 text-sm leading-6 text-yara-taupe">{address.recipient_name}<br />{address.address}{address.address_line_2 ? `, ${address.address_line_2}` : ""}<br />{address.district_area ? `${address.district_area}, ` : ""}{address.city}{address.postal_code ? ` ${address.postal_code}` : ""}<br />{address.phone}</p></div><div className="flex gap-2"><button type="button" onClick={() => setEditing(address)} className="glass-icon h-11 w-11" aria-label={`Edit ${address.label}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => removeAddress(address.id)} className="glass-icon-destructive h-11 w-11" aria-label={`Delete ${address.label}`}><Trash2 className="h-4 w-4" /></button></div></div>{!address.is_default && <button type="button" disabled={busy} onClick={() => setDefault(address.id)} className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-yara-wine"><Star className="h-4 w-4" />Set as default</button>}</article>)}</div> : <p className="mt-5 rounded-2xl bg-yara-blush p-5 text-sm text-yara-taupe">No saved addresses yet.</p>}
      </section>
    </div>
    <section className="surface-card mt-6 p-6 sm:p-8"><Package className="h-6 w-6 text-yara-wine" /><h2 className="mt-4 text-2xl">Order history</h2>{state.orders.length ? <div className="mt-5 grid gap-3">{state.orders.map((order) => <article key={order.id} className="rounded-2xl border border-yara-rose p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs font-bold text-yara-wine">{order.order_number}</p><p className="mt-1 text-xs text-yara-taupe">{new Date(order.created_at).toLocaleDateString()}</p></div><p className="font-serif text-xl">{new Intl.NumberFormat(undefined, { style: "currency", currency: order.currency }).format(order.total_amount)}</p></div><div className="mt-3 grid gap-1 text-xs text-yara-taupe sm:grid-cols-3"><span>Subtotal: {money(order.subtotal_amount, order.currency)}</span><span>Delivery: {order.shipping_fee === 0 ? "Free" : money(order.shipping_fee, order.currency)}</span><span>Discount: {money(order.discount_amount, order.currency)}</span></div><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-yara-rose px-3 py-1 capitalize">{order.order_status.replaceAll("_", " ")}</span><span className="rounded-full bg-yara-blush px-3 py-1 capitalize">{order.payment_status.replaceAll("_", " ")}</span></div></article>)}</div> : <div className="mt-6 rounded-2xl bg-yara-blush p-5 text-sm text-yara-taupe"><p>No account-linked orders yet.</p><Link to="/shop" className="mt-3 inline-block font-semibold text-yara-wine">Browse products</Link></div>}</section>
    {editing && <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-yara-ink/50 p-3 sm:p-6"><form onSubmit={saveAddress} className="my-auto w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-soft sm:p-8"><div className="flex items-center justify-between"><h2 className="text-2xl">{editing === "new" ? "Add address" : "Edit address"}</h2><button type="button" onClick={() => setEditing(null)} className="glass-icon h-11 w-11" aria-label="Close address form"><X className="h-4 w-4" /></button></div><AddressFields address={editing === "new" ? undefined : editing} /><button disabled={busy} className="btn-primary mt-6 w-full" type="submit">{busy ? "Saving…" : "Save address"}</button></form></div>}
  </div>;
}

function AddressFields({ address }: { address?: Address }) {
  return <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <label><span className="field-label">Label</span><input className="field" name="label" required maxLength={60} defaultValue={address?.label ?? "Home"} /></label>
    <label><span className="field-label">Country</span><select className="field" name="country" required defaultValue={address?.country ?? "sri-lanka"}><option value="sri-lanka">Sri Lanka</option><option value="uae">UAE / Dubai</option></select></label>
    <label><span className="field-label">Full name</span><input className="field" name="recipient_name" required minLength={2} maxLength={200} defaultValue={address?.recipient_name} autoComplete="name" /></label>
    <label><span className="field-label">Phone</span><input className="field" name="phone" type="tel" required pattern="[+0-9 ()-]{6,50}" defaultValue={address?.phone} autoComplete="tel" /></label>
    <label className="sm:col-span-2"><span className="field-label">Address line 1</span><input className="field" name="address" required minLength={5} maxLength={500} defaultValue={address?.address} autoComplete="address-line1" /></label>
    <label className="sm:col-span-2"><span className="field-label">Address line 2</span><input className="field" name="address_line_2" maxLength={300} defaultValue={address?.address_line_2} autoComplete="address-line2" /></label>
    <label><span className="field-label">District / area</span><input className="field" name="district_area" maxLength={160} defaultValue={address?.district_area} autoComplete="address-level1" /></label>
    <label><span className="field-label">City / emirate</span><input className="field" name="city" required minLength={2} maxLength={160} defaultValue={address?.city} autoComplete="address-level2" /></label>
    <label><span className="field-label">Building / villa</span><input className="field" name="building_details" maxLength={200} defaultValue={address?.building_details} /></label>
    <label><span className="field-label">Landmark</span><input className="field" name="landmark" maxLength={200} defaultValue={address?.landmark} /></label>
    <label><span className="field-label">Postal code</span><input className="field" name="postal_code" maxLength={40} defaultValue={address?.postal_code} autoComplete="postal-code" /></label>
  </div>;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(value ?? 0));
}

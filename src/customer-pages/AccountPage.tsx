import {
  LoaderCircle,
  LogOut,
  MapPin,
  Package,
  Paperclip,
  Pencil,
  Plus,
  Star,
  Trash2,
  UserRound,
  X,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSupabaseBrowserClient } from "../lib/supabase/browser";
import { trackEvent } from "../lib/analytics";

type Order = {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  subtotal_amount: number;
  shipping_fee: number;
  payment_fee: number;
  discount_amount: number;
  currency: string;
  created_at: string;
  delivered_at: string | null;
  payment_method: string;
  country: string;
  region_code: string | null;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  courier_name: string;
  tracking_number: string;
  tracking_url: string;
  bank_transaction_reference?: string | null;
  order_items: Array<{
    id: string;
    quantity: number;
    returned_quantity: number;
    refunded_quantity: number;
    products: { name: string } | null;
  }>;
  return_requests: Array<{ id: string; status: string }>;
};
type Address = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  address_line_2: string;
  city: string;
  district_area: string;
  building_details: string;
  landmark: string;
  postal_code: string;
  country: "sri-lanka" | "uae";
  is_default: boolean;
};
type DeletionRequest = {
  id: string;
  status: string;
  cancellable_until: string;
};
type AccountState = {
  loading: boolean;
  userId: string;
  email: string;
  name: string;
  orders: Order[];
  addresses: Address[];
  deletionRequests: DeletionRequest[];
  error: string;
};
type OrderDetail = { order: Order; items: Array<{ id: string; quantity: number; unit_price: number; subtotal: number; products: { name: string; image_url: string | null } | null }>; events: Array<{ id: string; from_status: string | null; to_status: string; payment_status: string | null; created_at: string }>; bank: { account_holder_name: string | null; bank_name: string | null; branch_name: string | null; account_number: string | null; iban: string | null; swift_code: string | null; instructions: string | null } | null };
const emptyState: AccountState = {
  loading: true,
  userId: "",
  email: "",
  name: "",
  orders: [],
  addresses: [],
  deletionRequests: [],
  error: "",
};

export function AccountPage() {
  const [state, setState] = useState<AccountState>(emptyState);
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [returning, setReturning] = useState<Order | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [details, setDetails] = useState<Record<string, OrderDetail>>({});
  const [detailsBusy, setDetailsBusy] = useState<string | null>(null);
  const [claimBusy, setClaimBusy] = useState(false);
  const navigate = useNavigate();
  const confirmed = new URLSearchParams(window.location.search).get("confirmed") === "true";

  const load = async () => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setState((value) => ({
        ...value,
        loading: false,
        error: "Account services are temporarily unavailable.",
      }));
      return;
    }
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      navigate("/login", { replace: true });
      return;
    }
    const [profile, orders, addresses, deletionRequests] = await Promise.all([
      client
        .from("profiles")
        .select("full_name,email")
        .eq("id", auth.user.id)
        .maybeSingle(),
      client
        .from("orders")
        .select(
          "id,order_number,order_status,payment_status,total_amount,subtotal_amount,shipping_fee,payment_fee,discount_amount,currency,created_at,delivered_at,payment_method,country,region_code,customer_phone,shipping_address,shipping_city,shipping_postal_code,courier_name,tracking_number,tracking_url,bank_transaction_reference,order_items(id,quantity,returned_quantity,refunded_quantity,products(name,image_url)),return_requests(id,status)",
        )
        .eq("customer_user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      client
        .from("customer_addresses")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("is_default", { ascending: false })
        .order("updated_at", { ascending: false }),
      client
        .from("account_deletion_requests")
        .select("id,status,cancellable_until")
        .eq("user_id", auth.user.id)
        .in("status", ["pending", "processing"])
        .order("requested_at", { ascending: false }),
    ]);
    const loadError = profile.error || orders.error || addresses.error || deletionRequests.error;
    setState({
      loading: false,
      userId: auth.user.id,
      email: String(profile.data?.email ?? auth.user.email ?? ""),
      name: String(
        profile.data?.full_name ?? auth.user.user_metadata?.full_name ?? "",
      ),
      orders: (orders.data ?? []) as Order[],
      addresses: (addresses.data ?? []) as Address[],
      deletionRequests: (deletionRequests.data ?? []) as DeletionRequest[],
      error: loadError ? "We couldn’t load your orders. Please refresh and try again." : "",
    });
  };

  useEffect(() => {
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleOrder = async (orderId: string) => {
    if (details[orderId]) {
      setDetails((value) => { const next = { ...value }; delete next[orderId]; return next; });
      return;
    }
    setDetailsBusy(orderId);
    const response = await fetch(`/api/account/orders/${orderId}`, { cache: "no-store" });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.order) setMessage("We couldn’t load this order. Please try again.");
    else setDetails((value) => ({ ...value, [orderId]: body as OrderDetail }));
    setDetailsBusy(null);
  };

  const claimGuestOrders = async () => {
    setClaimBusy(true);
    setMessage("");
    const response = await fetch("/api/account/orders/claim", { method: "POST" });
    const body = await response.json().catch(() => null);
    setMessage(response.ok ? (body?.claimed ? `${body.claimed} eligible order${body.claimed === 1 ? "" : "s"} linked to your account.` : "No eligible guest orders were found.") : (body?.error ?? "We couldn’t link guest orders."));
    if (response.ok && body?.claimed) await load();
    setClaimBusy(false);
  };

  const statusLabel = (value: string, kind: "order" | "payment") => {
    const labels: Record<string, string> = { pending: "Awaiting Payment", pending_payment: "Awaiting Payment", awaiting_bank_transfer: "Awaiting Payment", awaiting_bank_verification: "Awaiting Payment", confirmed: "Confirmed", paid: "Paid", processing: "Processing", packed: "Packed", shipped: "Shipped", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded", payment_due_on_delivery: "Unpaid", unpaid: "Unpaid", failed: "Failed", partially_refunded: "Partially Refunded" };
    return labels[value] ?? (kind === "order" ? value.replaceAll("_", " ") : value.replaceAll("_", " "));
  };

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
    setBusy(true);
    setMessage("");
    const result =
      editing !== "new" && editing
        ? await client
            .from("customer_addresses")
            .update(payload)
            .eq("id", editing.id)
            .eq("user_id", state.userId)
        : await client.from("customer_addresses").insert(payload);
    if (result.error)
      setMessage("The address could not be saved. Check every required field.");
    else {
      if (editing === "new") trackEvent("address_created", { country });
      setEditing(null);
      setMessage("Address saved.");
      await load();
    }
    setBusy(false);
  };

  const setDefault = async (id: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setBusy(true);
    setMessage("");
    const { error } = await client.rpc("set_default_customer_address", {
      p_address_id: id,
    });
    setMessage(
      error
        ? "The default address could not be changed."
        : "Default address updated.",
    );
    await load();
    setBusy(false);
  };

  const removeAddress = async (id: string) => {
    if (
      !window.confirm(
        "Delete this saved address? Historical orders will not change.",
      )
    )
      return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setBusy(true);
    setMessage("");
    const { error } = await client.rpc("delete_customer_address", {
      p_address_id: id,
    });
    setMessage(
      error ? "The address could not be deleted." : "Address deleted.",
    );
    await load();
    setBusy(false);
  };

  const submitReturn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!returning) return;
    const data = new FormData(event.currentTarget);
    const items = returning.order_items
      .map((item) => ({
        orderItemId: item.id,
        quantity: Number(data.get(`quantity_${item.id}`) ?? 0),
        reason: String(data.get(`reason_${item.id}`) ?? "other"),
        note: String(data.get(`note_${item.id}`) ?? ""),
      }))
      .filter((item) => item.quantity > 0);
    if (!items.length) {
      setMessage("Select at least one item and quantity to return.");
      return;
    }
    setBusy(true);
    setMessage("");
    setUploadProgress(0);
    const body = new FormData();
    body.set(
      "metadata",
      JSON.stringify({
        orderId: returning.id,
        note: data.get("note"),
        items,
      }),
    );
    evidenceFiles.forEach((file) => body.append("evidence", file));
    const result = await new Promise<{
      ok: boolean;
      payload: { message?: string; error?: string };
    }>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/returns");
      xhr.upload.onprogress = (progress) => {
        if (progress.lengthComputable)
          setUploadProgress(
            Math.round((progress.loaded / progress.total) * 100),
          );
      };
      xhr.onload = () => {
        let payload: { message?: string; error?: string } = {};
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          payload = { error: "Return request failed." };
        }
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, payload });
      };
      xhr.onerror = () =>
        resolve({
          ok: false,
          payload: { error: "The upload connection failed." },
        });
      xhr.send(body);
    });
    setMessage(
      result.ok
        ? result.payload.message ?? "Return request submitted."
        : result.payload.error || "Return request failed.",
    );
    if (result.ok) {
      trackEvent("return_requested", { order_id: returning.id });
      setReturning(null);
      setEvidenceFiles([]);
      await load();
    }
    setBusy(false);
  };

  const selectEvidence = (files: FileList | null) => {
    if (!files) return;
    const next = [...files];
    const valid = next.every(
      (file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
        file.size <= 5 * 1024 * 1024,
    );
    if (!valid || evidenceFiles.length + next.length > 5) {
      setMessage(
        "Choose up to five JPG, PNG, or WebP images, each no larger than 5 MB.",
      );
      return;
    }
    setEvidenceFiles((current) => [...current, ...next]);
    setMessage("");
  };

  const requestDeletion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !window.confirm(
        "Request account deletion? This starts a seven-day cancellation window.",
      )
    )
      return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const reauth = await client.auth.signInWithPassword({
      email: state.email,
      password: String(data.get("currentPassword") ?? ""),
    });
    if (reauth.error) {
      setMessage("Your current password could not be verified.");
      setBusy(false);
      return;
    }
    const response = await fetch("/api/account/deletion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: data.get("reason") }),
    });
    const payload = await response.json();
    setMessage(
      response.ok
        ? payload.message
        : payload.error || "Deletion request failed.",
    );
    if (response.ok) trackEvent("account_deletion_requested");
    await load();
    setBusy(false);
    event.currentTarget.reset();
  };

  const cancelDeletion = async () => {
    const response = await fetch("/api/account/deletion", { method: "DELETE" });
    const payload = await response.json();
    setMessage(
      response.ok ? payload.message : payload.error || "Cancellation failed.",
    );
    await load();
  };

  if (state.loading)
    return (
      <div
        className="page-shell grid min-h-[50vh] place-items-center"
        aria-busy="true"
      >
        <LoaderCircle className="h-8 w-8 animate-spin text-yara-wine" />
        <span className="sr-only">Loading account</span>
      </div>
    );
  return (
    <div className="page-shell py-12 sm:py-20">
      {confirmed && <p role="status" className="mb-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">Your email has been confirmed.</p>}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Your YARA account</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">
            Welcome{state.name ? `, ${state.name}` : ""}
          </h1>
          <p className="mt-3 text-sm text-yara-taupe">{state.email}</p>
        </div>
        <button type="button" onClick={signOut} className="btn-secondary">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
      {state.error && (
        <p
          role="alert"
          className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          {state.error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mt-6 rounded-2xl bg-yara-blush p-4 text-sm text-yara-wine"
        >
          {message}
        </p>
      )}
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="surface-card p-6 sm:p-8">
          <UserRound className="h-6 w-6 text-yara-wine" />
          <h2 className="mt-4 text-2xl">Profile</h2>
          <p className="mt-4 text-sm leading-7 text-yara-taupe">
            Your verified account connects eligible orders and saved delivery
            addresses while historical order records remain unchanged.
          </p>
          <Link to="/contact" className="btn-secondary mt-6">
            Request profile help
          </Link>
        </section>
        <section className="surface-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <MapPin className="h-6 w-6 text-yara-wine" />
              <h2 className="mt-4 text-2xl">Saved addresses</h2>
            </div>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="btn-secondary"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {state.addresses.length ? (
            <div className="mt-5 grid gap-3">
              {state.addresses.map((address) => (
                <article
                  key={address.id}
                  className="rounded-2xl border border-yara-rose p-4"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {address.label}
                        {address.is_default && (
                          <span className="ml-2 rounded-full bg-yara-rose px-2 py-1 text-[0.65rem] text-yara-wine">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-yara-taupe">
                        {address.recipient_name}
                        <br />
                        {address.address}
                        {address.address_line_2
                          ? `, ${address.address_line_2}`
                          : ""}
                        <br />
                        {address.district_area
                          ? `${address.district_area}, `
                          : ""}
                        {address.city}
                        {address.postal_code ? ` ${address.postal_code}` : ""}
                        <br />
                        {address.phone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(address)}
                        className="glass-icon h-11 w-11"
                        aria-label={`Edit ${address.label}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAddress(address.id)}
                        className="glass-icon-destructive h-11 w-11"
                        aria-label={`Delete ${address.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {!address.is_default && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDefault(address.id)}
                      className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-yara-wine"
                    >
                      <Star className="h-4 w-4" />
                      Set as default
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-yara-blush p-5 text-sm text-yara-taupe">
              No saved addresses yet.
            </p>
          )}
        </section>
      </div>
      <section className="surface-card mt-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><Package className="h-6 w-6 text-yara-wine" /><h2 className="mt-4 text-2xl">Order history</h2><p className="mt-2 text-sm text-yara-taupe">Live order and payment information from YARA.</p></div><div className="flex gap-2"><button type="button" onClick={claimGuestOrders} disabled={claimBusy} className="btn-secondary"><RefreshCw className={`h-4 w-4 ${claimBusy ? "animate-spin" : ""}`} />{claimBusy ? "Checking…" : "Find guest orders"}</button><button type="button" onClick={() => void load()} className="glass-icon h-11 w-11" aria-label="Refresh orders"><RefreshCw className="h-4 w-4" /></button></div></div>
        {state.error ? <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900"><p>{state.error}</p><button type="button" onClick={() => void load()} className="mt-3 font-semibold underline">Try again</button></div> : state.orders.length ? (
          <div className="mt-5 grid gap-3">
            {state.orders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-yara-rose"
              >
                <div role="button" tabIndex={0} onClick={() => void toggleOrder(order.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") void toggleOrder(order.id); }} className="w-full cursor-pointer p-4 text-left sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-yara-wine">
                      {order.order_number}
                    </p>
                    <p className="mt-1 text-xs text-yara-taupe">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-serif text-xl">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: order.currency,
                    }).format(order.total_amount)}
                  </p>
                </div>
                <div className="mt-3 grid gap-1 text-xs text-yara-taupe sm:grid-cols-2 lg:grid-cols-4">
                  <span>
                    Subtotal: {money(order.subtotal_amount, order.currency)}
                  </span>
                  <span>
                    Delivery:{" "}
                    {order.shipping_fee === 0
                      ? "Free"
                      : money(order.shipping_fee, order.currency)}
                  </span>
                  <span>
                    Discount: {money(order.discount_amount, order.currency)}
                  </span>
                  {order.payment_fee > 0 && (
                    <span>
                      Payment fee: {money(order.payment_fee, order.currency)}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-yara-rose px-3 py-1">{statusLabel(order.order_status, "order")}</span><span className="rounded-full bg-yara-blush px-3 py-1">{statusLabel(order.payment_status, "payment")}</span><span className="ml-auto inline-flex items-center gap-1 font-semibold text-yara-wine">{detailsBusy === order.id ? "Loading…" : details[order.id] ? "Hide details" : "View details"}<ChevronDown className={`h-4 w-4 transition ${details[order.id] ? "rotate-180" : ""}`} /></span>
                  {order.return_requests?.[0] && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 capitalize text-amber-900">
                      Return:{" "}
                      {order.return_requests[0].status.replaceAll("_", " ")}
                    </span>
                  )}
                  {isReturnEligible(order) &&
                    !order.return_requests?.length && (
                      <button
                        type="button"
                        onClick={() => setReturning(order)}
                        className="ml-auto min-h-11 font-semibold text-yara-wine underline"
                      >
                        Request return
                      </button>
                    )}
                </div></div>
                {details[order.id] && <div className="border-t border-yara-rose bg-yara-ivory/50 p-4 text-sm sm:p-5"><div className="grid gap-3 text-xs text-yara-taupe sm:grid-cols-2 lg:grid-cols-4"><span>Subtotal: {money(order.subtotal_amount, order.currency)}</span><span>Delivery: {order.shipping_fee === 0 ? "Free" : money(order.shipping_fee, order.currency)}</span><span>Discount: {money(order.discount_amount, order.currency)}</span><span>Payment fee: {money(order.payment_fee, order.currency)}</span></div><div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div><h3 className="font-semibold text-yara-ink">Items</h3><div className="mt-3 grid gap-3">{details[order.id].items.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white p-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-yara-blush">{item.products?.image_url && <img src={item.products.image_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.products?.name ?? "Product"}</p><p className="text-xs text-yara-taupe">Qty {item.quantity} · {money(item.unit_price, order.currency)} each</p></div><p className="font-semibold">{money(item.subtotal, order.currency)}</p></div>)}</div></div><div><h3 className="font-semibold text-yara-ink">Delivery &amp; payment</h3><p className="mt-3 leading-6 text-yara-taupe">{order.shipping_address}, {order.shipping_city} {order.shipping_postal_code}</p><p className="mt-2 capitalize text-yara-taupe">{order.payment_method.replaceAll("_", " ")} · {order.currency}</p>{order.payment_method === "cash_on_delivery" && order.payment_status !== "paid" && <p className="mt-3 rounded-xl bg-yara-blush p-3 text-xs">Pay the full amount when your order is delivered.</p>}{order.payment_method === "bank_transfer" && order.payment_status !== "paid" && details[order.id].bank && <div className="mt-3 rounded-xl bg-yara-blush p-3 text-xs leading-5"><p className="font-semibold text-yara-ink">Bank transfer instructions</p><p className="mt-1">{details[order.id].bank?.bank_name}, {details[order.id].bank?.branch_name}<br />{details[order.id].bank?.account_holder_name}<br />Account: {details[order.id].bank?.account_number}<br />Pay exactly {money(order.total_amount, order.currency)} using {order.order_number} as the reference.</p>{order.bank_transaction_reference && <p className="mt-1">Transaction reference: {order.bank_transaction_reference}</p>}</div>}{order.payment_status === "paid" && order.payment_method === "bank_transfer" && <p className="mt-3 rounded-xl bg-green-50 p-3 text-xs text-green-900">Payment confirmed.</p>}</div></div><div className="mt-5"><h3 className="font-semibold text-yara-ink">Status timeline</h3><div className="mt-3 grid gap-2">{details[order.id].events.length ? details[order.id].events.map((event) => <div key={event.id} className="flex gap-3 text-xs"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-yara-wine" /><p><span className="font-semibold">{statusLabel(event.to_status, "order")}</span><span className="ml-2 text-yara-taupe">{new Date(event.created_at).toLocaleString()}</span></p></div>) : <div className="flex gap-3 text-xs"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-yara-wine" /><p><span className="font-semibold">Order placed</span><span className="ml-2 text-yara-taupe">{new Date(order.created_at).toLocaleString()}</span></p></div>}</div></div>{order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center font-semibold text-yara-wine underline">Track shipment</a>}</div>}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-yara-blush p-5 text-sm text-yara-taupe">
            <p>No account-linked orders yet.</p>
            <Link
              to="/shop"
              className="mt-3 inline-block font-semibold text-yara-wine"
            >
              Browse products
            </Link>
          </div>
        )}
      </section>
      <section className="surface-card mt-6 border border-red-100 p-6 sm:p-8">
        <h2 className="text-2xl">Account deletion</h2>
        <p className="mt-3 text-sm leading-6 text-yara-taupe">
          Profile details and saved addresses will be deleted. Orders and
          accounting records that must be retained will be anonymised so their
          financial totals remain intact. Processing revokes your account
          sessions.
        </p>
        {state.deletionRequests[0] ? (
          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            <p className="capitalize">
              Request status: {state.deletionRequests[0].status}
            </p>
            {state.deletionRequests[0].status === "pending" && (
              <>
                <p className="mt-2">
                  Cancellable until{" "}
                  {new Date(
                    state.deletionRequests[0].cancellable_until,
                  ).toLocaleString()}
                  .
                </p>
                <button
                  type="button"
                  onClick={cancelDeletion}
                  className="btn-secondary mt-4"
                >
                  Cancel deletion request
                </button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={requestDeletion} className="mt-5 grid gap-4">
            <label>
              <span className="field-label">Reason (optional)</span>
              <textarea
                name="reason"
                maxLength={1000}
                className="field min-h-20"
              />
            </label>
            <label>
              <span className="field-label">Current password</span>
              <input
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className="field"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="btn-secondary border-red-300 text-red-700"
            >
              Request account deletion
            </button>
          </form>
        )}
      </section>
      {editing && (
        <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-yara-ink/50 p-3 sm:p-6">
          <form
            onSubmit={saveAddress}
            className="my-auto w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-soft sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">
                {editing === "new" ? "Add address" : "Edit address"}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="glass-icon h-11 w-11"
                aria-label="Close address form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AddressFields address={editing === "new" ? undefined : editing} />
            <button
              disabled={busy}
              className="btn-primary mt-6 w-full"
              type="submit"
            >
              {busy ? "Saving…" : "Save address"}
            </button>
          </form>
        </div>
      )}
      {returning && (
        <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-yara-ink/50 p-3 sm:p-6">
          <form
            onSubmit={submitReturn}
            className="my-auto w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-soft sm:p-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Return request</p>
                <h2 className="mt-2 text-2xl">{returning.order_number}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReturning(null);
                  setEvidenceFiles([]);
                  setUploadProgress(0);
                }}
                className="glass-icon h-11 w-11"
                aria-label="Close return form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-yara-taupe">
              Select unopened items or items that arrived damaged, defective, or
              incorrect. Every request is reviewed and inspected; approval is
              not automatic.
            </p>
            <div className="mt-5 grid gap-3">
              {returning.order_items.map((item) => (
                <fieldset
                  key={item.id}
                  className="grid gap-3 rounded-2xl border border-yara-rose p-4 sm:grid-cols-2"
                >
                  <legend className="px-1 text-sm font-semibold">
                    {item.products?.name ?? "Product"}{" "}
                    <span className="text-yara-taupe">
                      · {item.quantity - item.returned_quantity} remaining
                    </span>
                  </legend>
                  <label>
                    <span className="field-label">Quantity</span>
                    <input
                      name={`quantity_${item.id}`}
                      type="number"
                      min="0"
                      max={item.quantity - item.returned_quantity}
                      defaultValue="0"
                      className="field"
                      aria-label={`Return quantity for ${item.products?.name ?? "product"}`}
                    />
                  </label>
                  <label>
                    <span className="field-label">Reason</span>
                    <select name={`reason_${item.id}`} className="field">
                      <option value="damaged">Damaged</option>
                      <option value="defective">Defective</option>
                      <option value="incorrect_item">Incorrect item</option>
                      <option value="unopened_return">Unused and unopened</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label className="sm:col-span-2">
                    <span className="field-label">Item details (optional)</span>
                    <input
                      name={`note_${item.id}`}
                      maxLength={1000}
                      className="field"
                    />
                  </label>
                </fieldset>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="field-label">Overall details</span>
              <textarea
                name="note"
                maxLength={2000}
                className="field min-h-24"
              />
            </label>
            <div className="mt-4 rounded-2xl border border-dashed border-yara-rose p-4">
              <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-yara-blush px-4 text-sm font-semibold text-yara-wine">
                <Paperclip className="h-4 w-4" />
                Add evidence images
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    selectEvidence(event.currentTarget.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <p className="mt-2 text-xs text-yara-taupe">
                Up to 5 private JPG, PNG, or WebP images, 5 MB each.
              </p>
              {evidenceFiles.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {evidenceFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-yara-rose"
                    >
                      <EvidencePreview file={file} index={index} />
                      <button
                        type="button"
                        onClick={() =>
                          setEvidenceFiles((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                        className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-red-700"
                        aria-label={`Remove evidence image ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {busy && evidenceFiles.length > 0 && (
                <div className="mt-3">
                  <div
                    className="h-2 overflow-hidden rounded-full bg-yara-rose"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={uploadProgress}
                  >
                    <div
                      className="h-full bg-yara-wine transition-[width]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-yara-taupe">
                    Uploading {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
            <button
              disabled={busy}
              className="btn-primary mt-6 w-full"
              type="submit"
            >
              {busy ? "Submitting…" : "Submit for review"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function EvidencePreview({ file, index }: { file: File; index: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url ? (
    <img
      src={url}
      alt={`Evidence preview ${index + 1}`}
      className="aspect-square w-full object-cover"
    />
  ) : (
    <div className="aspect-square w-full animate-pulse bg-yara-blush" />
  );
}

function AddressFields({ address }: { address?: Address }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label>
        <span className="field-label">Label</span>
        <input
          className="field"
          name="label"
          required
          maxLength={60}
          defaultValue={address?.label ?? "Home"}
        />
      </label>
      <label>
        <span className="field-label">Country</span>
        <select
          className="field"
          name="country"
          required
          defaultValue={address?.country ?? "sri-lanka"}
        >
          <option value="sri-lanka">Sri Lanka</option>
          <option value="uae">UAE / Dubai</option>
        </select>
      </label>
      <label>
        <span className="field-label">Full name</span>
        <input
          className="field"
          name="recipient_name"
          required
          minLength={2}
          maxLength={200}
          defaultValue={address?.recipient_name}
          autoComplete="name"
        />
      </label>
      <label>
        <span className="field-label">Phone</span>
        <input
          className="field"
          name="phone"
          type="tel"
          required
          pattern="[+0-9 ()-]{6,50}"
          defaultValue={address?.phone}
          autoComplete="tel"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="field-label">Address line 1</span>
        <input
          className="field"
          name="address"
          required
          minLength={5}
          maxLength={500}
          defaultValue={address?.address}
          autoComplete="address-line1"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="field-label">Address line 2</span>
        <input
          className="field"
          name="address_line_2"
          maxLength={300}
          defaultValue={address?.address_line_2}
          autoComplete="address-line2"
        />
      </label>
      <label>
        <span className="field-label">District / area</span>
        <input
          className="field"
          name="district_area"
          maxLength={160}
          defaultValue={address?.district_area}
          autoComplete="address-level1"
        />
      </label>
      <label>
        <span className="field-label">City / emirate</span>
        <input
          className="field"
          name="city"
          required
          minLength={2}
          maxLength={160}
          defaultValue={address?.city}
          autoComplete="address-level2"
        />
      </label>
      <label>
        <span className="field-label">Building / villa</span>
        <input
          className="field"
          name="building_details"
          maxLength={200}
          defaultValue={address?.building_details}
        />
      </label>
      <label>
        <span className="field-label">Landmark</span>
        <input
          className="field"
          name="landmark"
          maxLength={200}
          defaultValue={address?.landmark}
        />
      </label>
      <label>
        <span className="field-label">Postal code</span>
        <input
          className="field"
          name="postal_code"
          maxLength={40}
          defaultValue={address?.postal_code}
          autoComplete="postal-code"
        />
      </label>
    </div>
  );
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(Number(value ?? 0));
}

function isReturnEligible(order: Order) {
  if (order.order_status !== "delivered" || !order.delivered_at) return false;
  const delivered = new Date(order.delivered_at).getTime();
  return (
    Number.isFinite(delivered) &&
    Date.now() - delivered <= 14 * 24 * 60 * 60 * 1000
  );
}

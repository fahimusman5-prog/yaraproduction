"use client";

import {
  ArrowLeft,
  Banknote,
  Barcode,
  CreditCard,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Product } from "@/lib/supabase/types";
import type { StaffContext } from "@/lib/supabase/auth";
import { completePosSaleAction, initialPosActionState } from "./actions";

interface CartLine {
  product: Product;
  quantity: number;
}
const money = (value: number, currency: "LKR" | "AED") =>
  new Intl.NumberFormat(currency === "LKR" ? "en-LK" : "en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

export function PosTerminal({
  products,
  staff,
}: {
  products: Product[];
  staff: StaffContext;
}) {
  const [query, setQuery] = useState("");
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [receiptCart, setReceiptCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState("cash");
  const [currency, setCurrency] = useState<"LKR" | "AED">("LKR");
  const [state, action] = useActionState(
    completePosSaleAction,
    initialPosActionState,
  );
  const barcodeRef = useRef<HTMLInputElement>(null);
  const lastSale = useRef<string | null>(null);
  const visible = useMemo(
    () =>
      products.filter((p) =>
        `${p.name} ${p.sku} ${p.barcode ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [products, query],
  );
  const productPrice = (product: Product) =>
    Number(currency === "LKR" ? product.price_lkr : product.price_aed);
  const subtotal = cart.reduce(
    (sum, line) => sum + productPrice(line.product) * line.quantity,
    0,
  );
  const total = Math.max(0, subtotal - discount);

  useEffect(() => {
    if (
      state.status === "success" &&
      state.sale &&
      lastSale.current !== state.sale.id
    ) {
      lastSale.current = state.sale.id;
      setCart([]);
      setDiscount(0);
    }
  }, [state]);
  const add = (product: Product) => {
    if (product.stock_quantity < 1) return;
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing)
        return current.map((line) =>
          line.product.id === product.id
            ? {
                ...line,
                quantity: Math.min(line.quantity + 1, product.stock_quantity),
              }
            : line,
        );
      return [...current, { product, quantity: 1 }];
    });
  };
  const change = (id: string, delta: number) =>
    setCart((current) =>
      current.flatMap((line) => {
        if (line.product.id !== id) return [line];
        const quantity = Math.min(
          line.product.stock_quantity,
          line.quantity + delta,
        );
        return quantity > 0 ? [{ ...line, quantity }] : [];
      }),
    );
  const scan = (event: FormEvent) => {
    event.preventDefault();
    const product = products.find(
      (p) =>
        p.barcode?.toLowerCase() === barcode.trim().toLowerCase() ||
        p.sku.toLowerCase() === barcode.trim().toLowerCase(),
    );
    if (product) {
      add(product);
      setBarcode("");
    } else {
      setQuery(barcode);
    }
    barcodeRef.current?.focus();
  };
  const beforeComplete = (event: FormEvent<HTMLFormElement>) => {
    if (!cart.length || discount > subtotal) {
      event.preventDefault();
      return;
    }
    setReceiptCart(cart.map((line) => ({ ...line })));
  };

  if (state.status === "success" && state.sale)
    return (
      <div className="grid min-h-dvh place-items-center p-4">
        <section className="staff-receipt staff-panel w-full max-w-md p-6 sm:p-8">
          <div className="text-center">
            <p className="text-xl font-bold tracking-[.2em]">YARA</p>
            <p className="mt-2 text-sm text-slate-500">Sale completed</p>
          </div>
          <div className="mt-6 border-y border-dashed border-slate-300 py-4 text-sm">
            <div className="flex justify-between">
              <span>Sale</span>
              <strong className="font-mono">{state.sale.number}</strong>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Cashier</span>
              <span>{state.sale.cashier}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Date</span>
              <span>
                {new Date(state.sale.createdAt).toLocaleString("en-LK", {
                  timeZone: "Asia/Colombo",
                })}
              </span>
            </div>
          </div>
          <ul className="my-5 space-y-3">
            {receiptCart.map((line) => (
              <li
                key={line.product.id}
                className="flex justify-between gap-3 text-sm"
              >
                <span>
                  {line.product.name} × {line.quantity}
                </span>
                <strong>
                  {money(
                    Number(
                      state.sale!.currency === "LKR"
                        ? line.product.price_lkr
                        : line.product.price_aed,
                    ) * line.quantity,
                    state.sale!.currency,
                  )}
                </strong>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-200 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{money(state.sale.total, state.sale.currency)}</span>
            </div>
            <p className="mt-2 text-xs capitalize text-slate-500">
              Paid by {state.sale.paymentMethod.replace("_", " ")}
            </p>
          </div>
          <div className="staff-no-print mt-7 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => window.print()}
              className="staff-button staff-button-secondary"
            >
              <Printer className="h-4 w-4" />
              Print receipt
            </button>
            <button
              onClick={() => {
                lastSale.current = state.sale?.id ?? null;
                window.location.reload();
              }}
              className="staff-button staff-button-primary"
            >
              New sale
            </button>
          </div>
        </section>
      </div>
    );

  return (
    <div className="min-h-dvh">
      <header className="staff-no-print flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-[var(--staff-line)] bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[var(--staff-line)]"
            aria-label="Back to admin"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-lg font-bold tracking-[.14em]">YARA POS</p>
            <p className="text-xs text-slate-500">
              Cashier: {staff.profile.full_name || staff.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pos/history"
            className="staff-button staff-button-secondary"
          >
            History
          </Link>
          <select
            aria-label="Currency"
            value={currency}
            onChange={(event) => {
              setCurrency(event.target.value as "LKR" | "AED");
              setCart([]);
              setDiscount(0);
            }}
            className="staff-input !min-h-10 w-24"
          >
            <option>LKR</option>
            <option>AED</option>
          </select>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500">
              {new Date().toLocaleDateString("en-LK", {
                dateStyle: "full",
                timeZone: "Asia/Colombo",
              })}
            </p>
            <p className="mt-1 text-xs text-emerald-700">Terminal ready</p>
          </div>
        </div>
      </header>
      <main className="grid gap-4 p-4 xl:grid-cols-[1fr_430px] xl:p-6">
        <section className="space-y-4">
          <form onSubmit={scan} className="staff-panel flex gap-2 p-3">
            <label className="relative flex-1">
              <span className="sr-only">Barcode or SKU</span>
              <Barcode className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                ref={barcodeRef}
                className="staff-input pl-11"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan barcode or enter SKU"
                autoFocus
              />
            </label>
            <button className="staff-button staff-button-primary">Add</button>
          </form>
          <div className="staff-panel">
            <div className="border-b border-[var(--staff-line)] p-3">
              <label className="relative block">
                <span className="sr-only">Search products</span>
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="staff-input pl-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products"
                />
              </label>
            </div>
            <div className="grid max-h-[calc(100dvh-230px)] gap-3 overflow-y-auto p-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {visible.map((product) => {
                const low = product.stock_quantity <= product.low_stock_alert;
                return (
                  <button
                    key={product.id}
                    onClick={() => add(product)}
                    disabled={product.stock_quantity < 1}
                    className="min-h-36 rounded-xl border border-[var(--staff-line)] bg-white p-4 text-left transition hover:border-yara-wine hover:shadow-md disabled:opacity-45"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-yara-rose font-bold text-yara-wine">
                        {product.name[0]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[.65rem] font-bold ${low ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {product.stock_quantity} stock
                      </span>
                    </div>
                    <p className="mt-4 font-semibold leading-5">
                      {product.name}
                    </p>
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>{product.sku}</span>
                      <strong className="staff-metric text-yara-wine">
                        {money(productPrice(product), currency)}
                      </strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        <aside className="staff-panel flex min-h-[540px] flex-col xl:sticky xl:top-6 xl:h-[calc(100dvh-112px)]">
          <div className="flex items-center justify-between border-b border-[var(--staff-line)] p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-yara-wine" />
              <h1 className="font-bold">Current sale</h1>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="staff-button staff-button-danger"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length ? (
              <ul className="space-y-3">
                {cart.map((line) => (
                  <li
                    key={line.product.id}
                    className="rounded-xl border border-[var(--staff-line)] p-3"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {line.product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {money(productPrice(line.product), currency)} each
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setCart((c) =>
                            c.filter((x) => x.product.id !== line.product.id),
                          )
                        }
                        className="grid min-h-11 min-w-11 place-items-center text-slate-400"
                        aria-label={`Remove ${line.product.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-[var(--staff-line)]">
                        <button
                          onClick={() => change(line.product.id, -1)}
                          className="grid min-h-11 min-w-11 place-items-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="staff-metric min-w-8 text-center font-bold">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => change(line.product.id, 1)}
                          disabled={
                            line.quantity >= line.product.stock_quantity
                          }
                          className="grid min-h-11 min-w-11 place-items-center disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <strong className="staff-metric">
                        {money(
                          productPrice(line.product) * line.quantity,
                          currency,
                        )}
                      </strong>
                    </div>
                    {line.product.stock_quantity - line.quantity <=
                      line.product.low_stock_alert && (
                      <p className="mt-2 text-xs font-semibold text-amber-700">
                        Low stock after this sale
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid h-full min-h-56 place-items-center text-center">
                <div>
                  <ShoppingCart className="mx-auto h-9 w-9 text-slate-300" />
                  <p className="mt-3 font-semibold">Cart is empty</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Scan or select a product.
                  </p>
                </div>
              </div>
            )}
          </div>
          <form
            action={action}
            onSubmit={beforeComplete}
            className="border-t border-[var(--staff-line)] p-4"
          >
            <input type="hidden" name="currency" value={currency} />
            <input
              type="hidden"
              name="items"
              value={JSON.stringify(
                cart.map((line) => ({
                  product_id: line.product.id,
                  quantity: line.quantity,
                })),
              )}
            />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <strong>{money(subtotal, currency)}</strong>
              </div>
              <label className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Discount</span>
                <input
                  className="staff-input !min-h-10 max-w-36 text-right"
                  type="number"
                  name="discount"
                  min="0"
                  max={subtotal}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </label>
              <div className="flex justify-between border-t border-[var(--staff-line)] pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="staff-metric text-yara-wine">
                  {money(total, currency)}
                </span>
              </div>
            </div>
            <fieldset className="mt-4">
              <legend className="staff-label">Payment method</legend>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "cash", label: "Cash", icon: Banknote },
                  { value: "card", label: "Card", icon: CreditCard },
                  { value: "bank_transfer", label: "Bank", icon: Barcode },
                ].map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    className={`flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-xl border text-xs font-semibold ${payment === value ? "border-yara-wine bg-yara-rose text-yara-wine" : "border-[var(--staff-line)]"}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="payment_method"
                      value={value}
                      checked={payment === value}
                      onChange={() => setPayment(value)}
                    />
                    <Icon className="mb-1 h-4 w-4" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            {state.status === "error" && (
              <div role="alert" className="staff-error mt-4">
                {state.message}
              </div>
            )}
            <button
              disabled={!cart.length || discount > subtotal}
              className="staff-button staff-button-primary mt-4 w-full"
              type="submit"
            >
              Complete sale · {money(total, currency)}
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}

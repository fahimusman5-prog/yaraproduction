"use client";

import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { NewsletterSubscriber } from "@/lib/supabase/types";
import { setNewsletterSubscriberStatusAction } from "../actions";
import { formatDate } from "../lib/format";

function StatusForm({ subscriber }: { subscriber: NewsletterSubscriber }) {
  const nextStatus = subscriber.status === "subscribed" ? "unsubscribed" : "subscribed";
  const action = setNewsletterSubscriberStatusAction.bind(null, subscriber.id, nextStatus);
  return <form action={action}><button type="submit" className={nextStatus === "unsubscribed" ? "staff-button staff-button-danger" : "staff-button staff-button-primary"}>{nextStatus === "unsubscribed" ? "Unsubscribe" : "Reactivate"}</button></form>;
}

export function NewsletterSubscriberManager({ subscribers }: { subscribers: NewsletterSubscriber[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? subscribers.filter((subscriber) => [subscriber.email, subscriber.status, subscriber.source, subscriber.locale, subscriber.country].some((value) => value?.toLowerCase().includes(needle))) : subscribers;
  }, [query, subscribers]);
  return <section className="staff-panel overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--staff-line)] p-5 sm:flex-row sm:items-center sm:justify-between"><label className="relative block w-full sm:max-w-sm"><span className="sr-only">Search subscribers</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="staff-input pl-9" placeholder="Search email, status, source, locale…" /></label><a href="/api/admin/newsletter/export" className="staff-button staff-button-secondary shrink-0"><Download className="h-4 w-4" />Export CSV</a></div>{filtered.length ? <div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>Email</th><th>Status</th><th>Source</th><th>Locale / country</th><th>Subscribed</th><th>Manage</th></tr></thead><tbody>{filtered.map((subscriber) => <tr key={subscriber.id}><td className="font-medium">{subscriber.email}</td><td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${subscriber.status === "subscribed" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{subscriber.status}</span></td><td>{subscriber.source}</td><td className="text-slate-500">{[subscriber.locale, subscriber.country].filter(Boolean).join(" / ") || "—"}</td><td className="text-xs text-slate-500">{formatDate(subscriber.subscribed_at)}</td><td><StatusForm subscriber={subscriber} /></td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-slate-500">No subscribers match your search.</p>}</section>;
}

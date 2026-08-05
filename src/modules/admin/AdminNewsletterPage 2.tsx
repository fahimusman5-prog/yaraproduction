import { Mail } from "lucide-react";
import { getNewsletterSubscribers } from "./data";
import { NewsletterSubscriberManager } from "./components/NewsletterSubscriberManager";
import { PageHeader } from "./components/PageHeader";

export async function AdminNewsletterPage() {
  const subscribers = await getNewsletterSubscribers();
  const active = subscribers.filter((subscriber) => subscriber.status === "subscribed").length;
  const inactive = subscribers.length - active;
  const cards = [{ label: "Total subscribers", value: subscribers.length }, { label: "Active subscribers", value: active }, { label: "Unsubscribed", value: inactive }];
  return <><PageHeader eyebrow="Relationships" title="Newsletter" description="Manage the YARA inner circle and export subscribers securely." action={<a href="/api/admin/newsletter/export" className="staff-button staff-button-primary"><Mail className="h-4 w-4" />Export subscribers</a>} /><section className="mb-6 grid gap-4 sm:grid-cols-3">{cards.map((card) => <article key={card.label} className="staff-panel p-5"><p className="text-xs font-bold uppercase tracking-[.08em] text-slate-500">{card.label}</p><p className="staff-metric mt-3 text-3xl font-bold">{card.value.toLocaleString()}</p></article>)}</section><NewsletterSubscriberManager subscribers={subscribers} /></>;
}

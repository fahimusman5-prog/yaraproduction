import { Inbox } from "lucide-react";

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="grid min-h-48 place-items-center p-8 text-center"><div><Inbox className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm text-slate-500">{detail}</p></div></div>;
}

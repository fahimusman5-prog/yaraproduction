import { AlertTriangle } from "lucide-react";

export function AdminLoadFailure({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="staff-panel mx-auto max-w-xl p-8 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" />
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

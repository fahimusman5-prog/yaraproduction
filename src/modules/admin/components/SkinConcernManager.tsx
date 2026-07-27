"use client";

import { Pencil, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SkinConcern } from "@/lib/supabase/types";
import { deleteSkinConcernAction, setSkinConcernActiveAction } from "../actions";
import { ConfirmActionButton } from "./ConfirmActionButton";
import { EmptyState } from "./EmptyState";
import { SkinConcernForm } from "./SkinConcernForm";
import { StatusBadge } from "./StatusBadge";
import { SubmitButton } from "./SubmitButton";

function SkinConcernRow({ concern, onSaved }: { concern: SkinConcern; onSaved: (concern: SkinConcern) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const assignments = concern.product_count ?? 0;
  return (
    <tr>
      <td><p className="font-semibold">{concern.name}</p>{concern.description && <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{concern.description}</p>}</td>
      <td><p className="font-mono text-xs text-slate-500">{concern.slug}</p></td>
      <td><StatusBadge value={concern.is_active ? "active" : "inactive"} /></td>
      <td className="staff-metric">{concern.sort_order}</td>
      <td className="staff-metric">{assignments}</td>
      <td>
        <div className="flex justify-end gap-2">
          <button type="button" className="staff-button staff-button-secondary" onClick={() => dialogRef.current?.showModal()} aria-label={`Edit ${concern.name}`}><Pencil className="h-4 w-4" /></button>
          {concern.is_active ? (
            <ConfirmActionButton action={setSkinConcernActiveAction.bind(null, concern.id, false)} label="Deactivate" title={`Deactivate ${concern.name}?`} detail={assignments > 0 ? `It remains attached to ${assignments} product${assignments === 1 ? "" : "s"}, but disappears from new products and the public storefront.` : "It disappears from new products and the public storefront until reactivated."} />
          ) : (
            <form action={setSkinConcernActiveAction.bind(null, concern.id, true)}><SubmitButton className="staff-button staff-button-secondary" pendingLabel="Activating…">Activate</SubmitButton></form>
          )}
          {!concern.is_active && assignments === 0 && <ConfirmActionButton action={deleteSkinConcernAction.bind(null, concern.id)} label="Delete" title={`Permanently delete ${concern.name}?`} detail="This concern has no product assignments. Permanent deletion cannot be undone." />}
        </div>
        <dialog ref={dialogRef} className="staff-dialog">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Edit skin concern</h2><button type="button" className="grid min-h-11 min-w-11 place-items-center rounded-xl" onClick={() => dialogRef.current?.close()} aria-label="Close edit skin concern dialog"><X className="h-5 w-5" /></button></div>
            <div className="mt-5"><SkinConcernForm concern={concern} onSaved={(saved) => { onSaved({ ...saved, product_count: assignments }); dialogRef.current?.close(); }} onCancel={() => dialogRef.current?.close()} /></div>
          </div>
        </dialog>
      </td>
    </tr>
  );
}

export function SkinConcernManager({ concerns }: { concerns: SkinConcern[] }) {
  const router = useRouter();
  const addDialogRef = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState(concerns);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [addFormVersion, setAddFormVersion] = useState(0);
  useEffect(() => setRows(concerns), [concerns]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((concern) => {
      const statusMatches = status === "all" || (status === "active" ? concern.is_active : !concern.is_active);
      return statusMatches && (!normalized || `${concern.name} ${concern.slug} ${concern.description ?? ""}`.toLowerCase().includes(normalized));
    });
  }, [query, rows, status]);

  const saveRow = (concern: SkinConcern) => {
    setRows((current) => [...new Map([...current, concern].map((item) => [item.id, item])).values()].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)));
    router.refresh();
  };

  return (
    <>
      <section className="staff-panel mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="relative"><span className="sr-only">Search skin concerns</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="staff-input pl-9" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, slug, or description…" /></label>
            <label><span className="sr-only">Filter by status</span><select className="staff-input" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          </div>
          <button type="button" className="staff-button staff-button-primary" onClick={() => addDialogRef.current?.showModal()}><Plus className="h-4 w-4" />Add Skin Concern</button>
        </div>
      </section>

      <section className="staff-panel">
        {visible.length ? (
          <div className="staff-table-wrap"><table className="staff-table !min-w-[920px]"><thead><tr><th>Name</th><th>Slug</th><th>Status</th><th>Sort</th><th>Products</th><th className="text-right">Actions</th></tr></thead><tbody>{visible.map((concern) => <SkinConcernRow key={concern.id} concern={concern} onSaved={saveRow} />)}</tbody></table></div>
        ) : (
          <EmptyState title={rows.length ? "No matching concerns" : "No skin concerns yet"} detail={rows.length ? "Adjust the search or status filter." : "Add the first concern to make it available in product forms."} />
        )}
      </section>

      <dialog ref={addDialogRef} className="staff-dialog">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-yara-wine">Catalog</p><h2 className="mt-1 text-xl font-bold">Add Skin Concern</h2></div><button type="button" className="grid min-h-11 min-w-11 place-items-center rounded-xl" onClick={() => addDialogRef.current?.close()} aria-label="Close add skin concern dialog"><X className="h-5 w-5" /></button></div>
          <div className="mt-5"><SkinConcernForm key={addFormVersion} defaultSortOrder={Math.max(0, ...rows.map((concern) => concern.sort_order)) + 1} onSaved={(concern) => { saveRow({ ...concern, product_count: 0 }); setAddFormVersion((current) => current + 1); addDialogRef.current?.close(); }} onCancel={() => addDialogRef.current?.close()} /></div>
        </div>
      </dialog>
    </>
  );
}

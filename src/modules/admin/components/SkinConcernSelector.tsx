"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { SkinConcern } from "@/lib/supabase/types";

export function SkinConcernSelector({
  concerns,
  selectedIds,
  onSelectedIdsChange,
  onAdd,
}: {
  concerns: SkinConcern[];
  selectedIds: Set<string>;
  onSelectedIdsChange: (selected: Set<string>) => void;
  onAdd: () => void;
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...new Map(concerns.map((concern) => [concern.id, concern])).values()]
      .filter((concern) => concern.is_active || selectedIds.has(concern.id))
      .filter((concern) => !normalized || `${concern.name} ${concern.slug}`.toLowerCase().includes(normalized))
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [concerns, query, selectedIds]);

  const toggle = (concernId: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(concernId); else next.delete(concernId);
    onSelectedIdsChange(next);
  };

  return (
    <div className="mt-4 rounded-2xl border border-[var(--staff-line)] bg-[#fdfbfc] p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold">Selected: {selectedIds.size}</p>
          <p className="mt-1 text-xs text-slate-500">Choose every concern this product addresses.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && <button type="button" className="staff-button staff-button-secondary" onClick={() => onSelectedIdsChange(new Set())}><X className="h-4 w-4" />Clear all</button>}
          <button type="button" className="staff-button staff-button-primary" onClick={onAdd}><Plus className="h-4 w-4" />Add Skin Concern</button>
        </div>
      </div>
      {concerns.length > 8 && (
        <label className="relative mt-4 block">
          <span className="sr-only">Search skin concerns</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="staff-input pl-9" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search concerns…" />
        </label>
      )}
      <div className="mt-4 max-h-72 overflow-y-auto pr-1">
        {visible.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((concern) => (
              <label key={concern.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--staff-line)] bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-yara-wine/30">
                <input type="checkbox" name="skin_concern_ids" value={concern.id} checked={selectedIds.has(concern.id)} onChange={(event) => toggle(concern.id, event.target.checked)} className="h-4 w-4 accent-yara-wine" />
                <span>{concern.name}{!concern.is_active && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[.65rem] font-semibold uppercase text-slate-500">Inactive</span>}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--staff-line)] bg-white p-6 text-center text-sm text-slate-500">No matching active concerns.</p>
        )}
      </div>
    </div>
  );
}

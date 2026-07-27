"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { SkinConcern } from "@/lib/supabase/types";
import { createSkinConcernAction, type SkinConcernActionState, updateSkinConcernAction } from "../actions";
import { initialActionState } from "../action-state";
import { toSlug } from "../lib/format";
import { ActionMessage } from "./ActionMessage";
import { SubmitButton } from "./SubmitButton";

export function SkinConcernForm({
  concern,
  defaultSortOrder = 0,
  onSaved,
  onCancel,
}: {
  concern?: SkinConcern;
  defaultSortOrder?: number;
  onSaved?: (concern: SkinConcern) => void;
  onCancel?: () => void;
}) {
  const action = concern ? updateSkinConcernAction.bind(null, concern.id) : createSkinConcernAction;
  const [state, formAction] = useActionState<SkinConcernActionState, FormData>(action, initialActionState);
  const [name, setName] = useState(concern?.name ?? "");
  const [slug, setSlug] = useState(concern?.slug ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const slugEdited = useRef(Boolean(concern));
  const handledConcernId = useRef<string | null>(null);

  useEffect(() => {
    if (!state.concern || state.status !== "success" || handledConcernId.current === state.concern.id) return;
    handledConcernId.current = state.concern.id;
    onSaved?.(state.concern);
    if (!concern) {
      formRef.current?.reset();
      setName("");
      setSlug("");
      slugEdited.current = false;
    }
  }, [concern, onSaved, state.concern, state.status]);

  const updateName = (value: string) => {
    setName(value);
    if (!slugEdited.current) setSlug(toSlug(value));
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <ActionMessage state={state} />
      <label>
        <span className="staff-label">Name *</span>
        <input className="staff-input" name="name" required minLength={2} maxLength={120} value={name} onChange={(event) => updateName(event.target.value)} autoFocus />
      </label>
      <label>
        <span className="staff-label">Slug *</span>
        <input className="staff-input" name="slug" required maxLength={140} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={(event) => { slugEdited.current = true; setSlug(event.target.value.toLowerCase()); }} placeholder="Generated from name" />
      </label>
      <label>
        <span className="staff-label">Description</span>
        <textarea className="staff-input min-h-24 resize-y" name="description" maxLength={1000} defaultValue={concern?.description ?? ""} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="staff-label">Sort order</span>
          <input className="staff-input" name="sort_order" type="number" min="0" step="1" defaultValue={concern?.sort_order ?? defaultSortOrder} />
        </label>
        <label>
          <span className="staff-label">Status</span>
          <select className="staff-input" name="is_active" defaultValue={concern?.is_active === false ? "false" : "true"}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="staff-button staff-button-secondary" onClick={onCancel}>Cancel</button>}
        <SubmitButton pendingLabel={concern ? "Updating…" : "Creating…"}>{concern ? "Update concern" : "Add concern"}</SubmitButton>
      </div>
    </form>
  );
}

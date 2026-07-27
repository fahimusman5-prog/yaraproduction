"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import type { Category } from "@/lib/supabase/types";
import { initialActionState } from "../action-state";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "../actions";
import { ActionMessage } from "./ActionMessage";
import { ConfirmActionButton } from "./ConfirmActionButton";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";
import { SubmitButton } from "./SubmitButton";

function CategoryForm({ category, close }: { category?: Category; close?: () => void }) {
  const action = category ? updateCategoryAction.bind(null, category.id) : createCategoryAction;
  const [state, formAction] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!category && state.status === "success") formRef.current?.reset();
  }, [category, state.status]);
  return <form ref={formRef} action={formAction} className="space-y-4"><ActionMessage state={state} /><label><span className="staff-label">Name *</span><input className="staff-input" name="name" required defaultValue={category?.name} /></label><label><span className="staff-label">Slug</span><input className="staff-input" name="slug" defaultValue={category?.slug} placeholder="Generated from name" /></label><label><span className="staff-label">Status</span><select className="staff-input" name="status" defaultValue={category?.status ?? "active"}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><div className="flex justify-end gap-3">{close && <button type="button" className="staff-button staff-button-secondary" onClick={close}>Cancel</button>}<SubmitButton>{category ? "Update category" : "Add category"}</SubmitButton></div></form>;
}

function CategoryRow({ category }: { category: Category }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const assignedProducts = category.product_count ?? 0;
  return <tr><td><p className="font-semibold">{category.name}</p><p className="mt-1 font-mono text-xs text-slate-400">{category.slug}</p></td><td><StatusBadge value={category.status} /></td><td><div className="flex justify-end gap-2"><button className="staff-button staff-button-secondary" onClick={() => dialogRef.current?.showModal()} aria-label={`Edit ${category.name}`}><Pencil className="h-4 w-4" /></button>{assignedProducts > 0 ? <button type="button" className="staff-button staff-button-secondary" disabled title={`${assignedProducts} product${assignedProducts === 1 ? " is" : "s are"} assigned to this category`}>In use</button> : <ConfirmActionButton action={deleteCategoryAction.bind(null, category.id)} label="Delete" title={`Delete ${category.name}?`} detail="Only empty categories can be deleted. This cannot be undone." />}</div><dialog ref={dialogRef} className="staff-dialog"><div className="p-6 sm:p-8"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Edit category</h2><button onClick={() => dialogRef.current?.close()} className="grid min-h-11 min-w-11 place-items-center" aria-label="Close"><X className="h-5 w-5" /></button></div><div className="mt-5"><CategoryForm category={category} close={() => dialogRef.current?.close()} /></div></div></dialog></td></tr>;
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  return <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]"><section className="staff-panel p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><Plus className="h-5 w-5 text-yara-wine" /><h2 className="font-bold">New category</h2></div><CategoryForm /></section><section className="staff-panel">{categories.length ? <div className="staff-table-wrap"><table className="staff-table !min-w-[540px]"><thead><tr><th>Category</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{categories.map((category) => <CategoryRow key={category.id} category={category} />)}</tbody></table></div> : <EmptyState title="No categories yet" detail="Create the first category using the form." />}</section></div>;
}

"use client";

import { AlertTriangle } from "lucide-react";
import { useRef } from "react";
import { SubmitButton } from "./SubmitButton";

export function ConfirmActionButton({ action, label, title, detail }: { action: () => Promise<void>; label: string; title: string; detail: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return <><button type="button" className="staff-button staff-button-danger" onClick={() => dialogRef.current?.showModal()}>{label}</button><dialog ref={dialogRef} className="staff-dialog"><div className="p-6 sm:p-8"><span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-700"><AlertTriangle className="h-5 w-5" /></span><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p><div className="mt-6 flex justify-end gap-3"><button type="button" className="staff-button staff-button-secondary" onClick={() => dialogRef.current?.close()}>Cancel</button><form action={action}><SubmitButton className="staff-button staff-button-danger" pendingLabel="Working…">Confirm</SubmitButton></form></div></div></dialog></>;
}

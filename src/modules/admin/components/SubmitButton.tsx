"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "staff-button staff-button-primary", pendingLabel = "Saving…" }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={className}>{pending && <LoaderCircle className="h-4 w-4 animate-spin" />}{pending ? pendingLabel : children}</button>;
}

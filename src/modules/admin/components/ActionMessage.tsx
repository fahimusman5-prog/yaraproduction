import type { ActionState } from "../action-state";

export function ActionMessage({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;
  return <div role={state.status === "error" ? "alert" : "status"} aria-live="polite" className={state.status === "error" ? "staff-error" : "staff-toast"}>{state.message}</div>;
}

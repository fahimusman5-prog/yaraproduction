"use client";

import { BarChart3, Boxes, ChevronRight, FolderHeart, FolderTree, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, Store, Users, X, Star } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { StaffContext } from "@/lib/supabase/auth";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/skin-concerns", label: "Skin Concerns", icon: FolderHeart },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
] as const;

export function StaffShell({ staff, children }: { staff: StaffContext; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => {
    await getSupabaseBrowserClient()?.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const sidebar = <div className="flex h-full flex-col bg-[#21191d] text-white"><div className="flex h-20 items-center justify-between border-b border-white/10 px-6"><Link href="/admin" className="staff-link text-xl font-bold tracking-[.2em]">YARA</Link><button className="grid min-h-11 min-w-11 place-items-center lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button></div><nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto p-4">{navItems.map(({ href, label, icon: Icon }) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`staff-link flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-yara-wine text-white" : "text-white/65 hover:bg-white/8 hover:text-white"}`}><Icon className="h-4.5 w-4.5" />{label}{active && <ChevronRight className="ml-auto h-4 w-4" />}</Link>; })}</nav><div className="space-y-2 border-t border-white/10 p-4"><Link href="/pos" className="staff-link flex min-h-11 items-center gap-3 rounded-xl bg-white/8 px-3 text-sm font-semibold text-white"><Store className="h-4.5 w-4.5" />Open POS</Link><button onClick={signOut} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/65 hover:bg-white/8 hover:text-white"><LogOut className="h-4.5 w-4.5" />Sign out</button></div></div>;

  return <div className="staff-root"><aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>{mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/45" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" /><aside className="relative h-full w-[84%] max-w-72">{sidebar}</aside></div>}<div className="lg:pl-64"><header className="staff-no-print sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[var(--staff-line)] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8"><button className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[var(--staff-line)] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button><div className="hidden sm:block"><p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Commerce workspace</p><p className="mt-1 text-sm font-semibold">Admin &amp; operations</p></div><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-yara-rose font-bold text-yara-wine">{staff.profile.full_name?.[0]?.toUpperCase() || "Y"}</span><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{staff.profile.full_name || staff.email}</p><p className="text-xs capitalize text-slate-500">{staff.profile.role}</p></div></div></header><main id="main-content" className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main></div></div>;
}

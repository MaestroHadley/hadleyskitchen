"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarBlank, GearSix, House, Notebook, Plus } from "@phosphor-icons/react";
import { Brand } from "@/components/brand";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: House },
  { href: "/recipes", label: "Recipes", icon: Notebook },
  { href: "/events/new", label: "New event", icon: CalendarBlank },
  { href: "/account", label: "Account", icon: GearSix },
];

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/dashboard" ? pathname === href : href === "/events/new" ? pathname.startsWith("/events") : pathname.startsWith(href);
  const initials = email.slice(0, 2).toLocaleUpperCase();

  return <div className="app-shell">
    <header className="topbar">
      <Brand compact />
      <div className="topbar-actions"><span className="secure-state"><i />Private workspace</span><Link className="avatar" href="/account" aria-label="Open account settings">{initials}</Link></div>
    </header>
    <aside className="sidebar">
      <nav aria-label="Planner navigation">
        {navigation.slice(0, 3).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "nav-link active" : "nav-link"}><Icon weight={isActive(href) ? "fill" : "regular"} /><span>{label}</span>{label === "New event" && <Plus className="nav-plus" weight="bold" />}</Link>)}
      </nav>
      <div className="sidebar-account"><span>{initials}</span><div><strong>{email.split("@")[0]}</strong><small>{email}</small></div><Link href="/account" aria-label="Account settings"><GearSix /></Link></div>
    </aside>
    <main className="workspace">{children}</main>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "mobile-link active" : "mobile-link"}><Icon weight={isActive(href) ? "fill" : "regular"} /><span>{label === "New event" ? "Plan" : label}</span></Link>)}
    </nav>
  </div>;
}

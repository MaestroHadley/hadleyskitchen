"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarBlank, GearSix, House, Notebook } from "@phosphor-icons/react";
import { Brand } from "@/components/brand";
import type { ThemeId } from "@/lib/themes";

const navigation = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/recipes", label: "Recipes", icon: Notebook },
  { href: "/events", label: "Bake plans", icon: CalendarBlank },
  { href: "/account", label: "Account", icon: GearSix },
];

export function AppShell({ children, email, bakeryName, themeId }: { children: React.ReactNode; email: string; bakeryName: string; themeId: ThemeId }) {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  const initials = email.slice(0, 2).toLocaleUpperCase();

  useEffect(() => {
    const previewTheme = sessionStorage.getItem("bakery-theme-preview");
    if (previewTheme === "studio" || previewTheme === "garden" || previewTheme === "confetti") {
      document.querySelector<HTMLElement>(".app-shell")?.setAttribute("data-theme", previewTheme);
    }
  }, [pathname]);

  return <div className="app-shell" data-theme={themeId}>
    <header className="topbar">
      <Brand compact workspaceName={bakeryName} />
      <div className="topbar-actions"><span className="secure-state"><i />Private workspace</span><Link className="avatar" href="/account" aria-label="Open account settings">{initials}</Link></div>
    </header>
    <aside className="sidebar">
      <nav aria-label="Planner navigation">
        {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "nav-link active" : "nav-link"}><Icon weight={isActive(href) ? "fill" : "regular"} /><span>{label}</span></Link>)}
      </nav>
      <Link className="sidebar-account" href="/account" aria-label={`Open account settings for ${bakeryName}`}><span>{initials}</span><div><strong>{bakeryName}</strong><small>{email}</small></div><GearSix aria-hidden="true" /></Link>
    </aside>
    <main className="workspace">{children}</main>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "mobile-link active" : "mobile-link"}><Icon weight={isActive(href) ? "fill" : "regular"} /><span>{label}</span></Link>)}
    </nav>
  </div>;
}

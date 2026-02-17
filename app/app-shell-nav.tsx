"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/ingredients", label: "Ingredients" },
  { href: "/app/recipes", label: "Recipes" },
  { href: "/app/weekly-plan", label: "Weekly Plan" },
  { href: "/app/reports", label: "Reports" },
];

export default function AppShellNav() {
  const pathname = usePathname();
  if (!pathname.startsWith("/app")) return null;

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(6px)",
        borderBottom: "1px solid #d8d2af",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 999,
                border: active ? "1px solid #823a12" : "1px solid #d1d5db",
                background: active ? "#f6e5dc" : "#ffffff",
                color: active ? "#823a12" : "#1f2937",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/sozlamalar", label: "Do‘kon", exact: true },
  { href: "/sozlamalar/xodimlar", label: "Xodimlar" },
  { href: "/sozlamalar/qurilmalar", label: "Kassa qurilmalari" },
];

export function SettingsNav() {
  const path = usePathname();
  return (
    <nav className="subnav" aria-label="Sozlamalar bo‘limlari">
      {TABS.map((t) => {
        const active = t.exact ? path === t.href : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

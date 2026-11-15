"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/bosh", label: "Bosh sahifa", ownerOnly: true },
  { href: "/kassa", label: "Kassa", ownerOnly: false },
  { href: "/mahsulotlar", label: "Mahsulotlar", ownerOnly: false },
  { href: "/ombor", label: "Ombor", ownerOnly: true },
  { href: "/sotuvlar", label: "Sotuvlar", ownerOnly: false },
  { href: "/hisobotlar", label: "Hisobotlar", ownerOnly: true },
  { href: "/sozlamalar", label: "Sozlamalar", ownerOnly: true },
];

export function NavLinks({ isOwner }: { isOwner: boolean }) {
  const path = usePathname();
  return (
    <nav className="sidebar-nav">
      {ITEMS.filter((i) => isOwner || !i.ownerOnly).map((i) => {
        const active = path === i.href || path.startsWith(`${i.href}/`);
        return (
          <Link key={i.href} href={i.href} className="nav-link" aria-current={active ? "page" : undefined}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

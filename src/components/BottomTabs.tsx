"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/map", label: "지도", icon: "🗺️" },
  { href: "/list", label: "목록", icon: "📋" },
] as const;

export default function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-cream-deep bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-1 flex-col items-center py-2 text-xs ${
              active ? "text-coral-deep font-semibold" : "text-mocha"
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

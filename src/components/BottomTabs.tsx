"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, Map } from "lucide-react";

// 이모지는 OS별로 모양이 달라서 SVG 아이콘(lucide)으로 통일
const tabs = [
  { href: "/map", label: "지도", Icon: Map },
  { href: "/list", label: "목록", Icon: List },
] as const;

export default function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-cream-deep bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
              active ? "font-semibold text-coral-deep" : "text-mocha"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

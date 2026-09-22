import {
  CreditCard,
  Grid2X2,
  History,
  UserRound,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const items = [
  { href: "/", label: "Bosh sahifa", icon: Grid2X2 },
  { href: "/wallet", label: "Hamyon", icon: CreditCard },
  { href: "/history", label: "Tarix", icon: History },
  { href: "/profile", label: "Profil", icon: UserRound },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/history") {
    return pathname === "/history" || pathname === "/track" || pathname.startsWith("/orders/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      aria-label="Asosiy navigatsiya"
      className="fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-[1.75rem] border border-amber-300/25 bg-slate-950/80 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl md:bottom-6 md:max-w-sm"
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isItemActive(location, href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition-colors ${
                active
                  ? "bg-amber-300/12 text-amber-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_rgba(252,211,77,0.45)]" : ""}`} strokeWidth={1.8} />
              <span className="max-w-full truncate text-[10px] font-medium leading-tight sm:text-[11px]">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
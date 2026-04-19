import { Link, useLocation } from "@tanstack/react-router";
import { Eye, Camera, MapPin, Phone, Settings as SettingsIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Item = {
  label: string;
  to: "/" | "/camera" | "/location" | "/emergency" | "/settings";
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  match: (path: string) => boolean;
};

const ITEMS: Item[] = [
  { label: "Home", to: "/", icon: Eye, match: (p) => p === "/" },
  { label: "Camera", to: "/camera", icon: Camera, match: (p) => p.startsWith("/camera") },
  { label: "Location", to: "/location", icon: MapPin, match: (p) => p.startsWith("/location") },
  { label: "SOS", to: "/emergency", icon: Phone, match: (p) => p.startsWith("/emergency") },
  { label: "Settings", to: "/settings", icon: SettingsIcon, match: (p) => p.startsWith("/settings") },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-card"
      style={{ borderColor: "var(--border)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {ITEMS.map(({ label, to, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-1 py-1.5"
              >
                <Icon
                  className="h-6 w-6"
                  style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                  aria-hidden
                />
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

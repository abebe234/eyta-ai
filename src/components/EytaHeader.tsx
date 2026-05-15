import { Eye } from "lucide-react";
import { EthiopicDiamondBorder } from "./EthiopicDiamondBorder";

interface Props {
  title?: string;
  subtitle?: string;
}

/**
 * Blue app header with logo tile + IntelliGlass AI title,
 * followed by the diamond border.
 */
export function EytaHeader({ title = "IntelliGlass AI", subtitle = "Your Smart Vision Assistant" }: Props) {
  return (
    <header className="w-full" style={{ background: "var(--primary)" }}>
      <div className="mx-auto flex max-w-md items-center gap-4 px-5 pt-8 pb-5">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "color-mix(in oklab, white 18%, transparent)" }}
          aria-hidden
        >
          <Eye className="h-7 w-7 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white">
            {title}
          </h1>
          <p className="text-sm text-white/85">{subtitle}</p>
        </div>
      </div>
      <EthiopicDiamondBorder />
    </header>
  );
}

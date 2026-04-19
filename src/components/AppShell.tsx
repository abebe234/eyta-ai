import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { EthiopicBorder } from "./EthiopicBorder";

interface Props {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export function AppShell({ children, title, showBack = false }: Props) {
  return (
    <div className="relative min-h-screen bg-background">
      <EthiopicBorder side="both" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 py-6">
        {(title || showBack) && (
          <header className="mb-4 flex items-center justify-between">
            {showBack ? (
              <Link
                to="/"
                aria-label="Back to home"
                className="rounded-full bg-secondary px-4 py-2 text-base font-semibold text-secondary-foreground hover:bg-muted"
              >
                ←
              </Link>
            ) : <span />}
            {title && (
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            <span className="w-10" />
          </header>
        )}
        {children}
      </div>
    </div>
  );
}

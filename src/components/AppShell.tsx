import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { EytaHeader } from "./EytaHeader";
import { BottomNav } from "./BottomNav";

interface Props {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  /** When true, render the red EYTA header with the diamond border. */
  withHeader?: boolean;
  /** When true, render the bottom tab bar. */
  withBottomNav?: boolean;
}

export function AppShell({
  children,
  title,
  showBack = false,
  withHeader = false,
  withBottomNav = false,
}: Props) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col">
        {withHeader && <EytaHeader />}
        {(title || showBack) && (
          <header className="mb-2 flex items-center justify-between px-6 pt-6">
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
        <div
          className={`flex flex-1 flex-col px-6 ${withHeader ? "pt-5" : "pt-6"} ${
            withBottomNav ? "pb-24" : "pb-6"
          }`}
        >
          {children}
        </div>
      </div>
      {withBottomNav && <BottomNav />}
    </div>
  );
}

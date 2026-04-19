/**
 * Ethiopic-inspired diamond border strip.
 * Pure CSS — a row of red diamonds with cream centers, framed by thin red rules.
 * Sits flush under the red header to mirror the reference mockup.
 */
export function EthiopicDiamondBorder({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative w-full ${className}`}
      style={{ background: "var(--pattern-cream)" }}
    >
      {/* top hairline */}
      <div className="h-[2px] w-full" style={{ background: "var(--primary)" }} />
      {/* diamond row */}
      <div
        className="flex h-7 w-full items-center justify-around overflow-hidden px-1"
        style={{ background: "var(--pattern-cream)" }}
      >
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className="relative flex h-5 w-5 items-center justify-center"
            style={{
              background: "var(--primary)",
              transform: "rotate(45deg)",
            }}
          >
            <div
              className="h-2 w-2"
              style={{ background: "var(--pattern-cream)" }}
            />
          </div>
        ))}
      </div>
      {/* bottom rules */}
      <div className="h-[2px] w-full" style={{ background: "var(--primary)" }} />
      <div className="h-[3px] w-full" style={{ background: "var(--pattern-cream)" }} />
      <div className="h-[2px] w-full" style={{ background: "var(--primary)" }} />
    </div>
  );
}

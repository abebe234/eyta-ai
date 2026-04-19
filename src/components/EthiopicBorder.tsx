import patternImg from "@/assets/ethiopic-pattern.jpg";

interface Props {
  side?: "both" | "left" | "right" | "top";
  className?: string;
}

/**
 * Decorative Ethiopic woven pattern strips.
 * Renders narrow vertical bands on the sides (or a horizontal band on top).
 */
export function EthiopicBorder({ side = "both", className = "" }: Props) {
  const strip = (pos: "left" | "right") => (
    <div
      key={pos}
      aria-hidden
      className={`pointer-events-none fixed top-0 bottom-0 ${
        pos === "left" ? "left-0" : "right-0"
      } w-3 sm:w-4 z-0 opacity-90`}
      style={{
        backgroundImage: `url(${patternImg})`,
        backgroundSize: "auto 100%",
        backgroundRepeat: "repeat-y",
        backgroundPosition: "center",
      }}
    />
  );

  if (side === "top") {
    return (
      <div
        aria-hidden
        className={`pointer-events-none fixed left-0 right-0 top-0 h-3 sm:h-4 z-0 opacity-90 ${className}`}
        style={{
          backgroundImage: `url(${patternImg})`,
          backgroundSize: "100% auto",
          backgroundRepeat: "repeat-x",
          transform: "rotate(90deg)",
          transformOrigin: "top left",
        }}
      />
    );
  }

  return (
    <>
      {(side === "both" || side === "left") && strip("left")}
      {(side === "both" || side === "right") && strip("right")}
    </>
  );
}

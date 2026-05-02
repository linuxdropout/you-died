import type { ReactNode } from "react";

interface RewindFlashProps {
  readonly visible: boolean;
  readonly secondsBack: number;
}

export function RewindFlash({
  visible,
  secondsBack,
}: RewindFlashProps): ReactNode {
  if (!visible) return null;

  return (
    <div className="rewindFlash">
      <div className="rewindFlashSweep" />
      <div className="rewindFlashLines">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="rewindFlashLine"
            style={{
              top: `${12 + i * 10}%`,
              animationDelay: `${i * 30}ms`,
            }}
          />
        ))}
      </div>
      <div className="rewindFlashCounter">
        -{secondsBack.toFixed(1)}s
      </div>
    </div>
  );
}

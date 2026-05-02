import type { ReactNode } from "react";

interface SeverNoticeProps {
  readonly visible: boolean;
  readonly timelineId?: string;
}

export function SeverNotice({
  visible,
  timelineId,
}: SeverNoticeProps): ReactNode {
  if (!visible) return null;

  return (
    <div className="severNotice">
      <div className="severNoticeBar">
        <span className="severNoticeIcon">~!~</span>
        <span className="severNoticeText">TIMELINE SEVERED</span>
        {timelineId != null && (
          <span className="severNoticeId">#{timelineId.slice(0, 6)}</span>
        )}
      </div>
    </div>
  );
}

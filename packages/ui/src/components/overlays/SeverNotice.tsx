import type { ReactNode } from 'react'

interface SeverNoticeProps {
  readonly visible: boolean
  readonly timelineId?: string
  readonly ticksDelta?: number
}

export function SeverNotice({ visible, timelineId, ticksDelta }: SeverNoticeProps): ReactNode {
  if (!visible) return null

  const penaltyText =
    ticksDelta != null ? `${(Math.abs(ticksDelta) / 60).toFixed(1)}s` : undefined

  return (
    <div className="severNotice">
      <div className="severNoticeVignette" />
      <div className="severNoticeContent">
        <span className="severNoticeIcon">~!~</span>
        <div className="severNoticeGlitch">
          <span className="severNoticeTitle">TIMELINE SEVERED</span>
          <span className="severNoticeGhost" aria-hidden="true">
            TIMELINE SEVERED
          </span>
          <span className="severNoticeGhost2" aria-hidden="true">
            TIMELINE SEVERED
          </span>
        </div>
        {penaltyText != null && <span className="severNoticePenalty">-{penaltyText}</span>}
        {timelineId != null && <span className="severNoticeId">#{timelineId.slice(0, 6)}</span>}
      </div>
      <div className="severNoticeCrackLeft" />
      <div className="severNoticeCrackRight" />
    </div>
  )
}

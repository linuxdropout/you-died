import type { ReactNode } from 'react'

interface SeverNoticeProps {
  readonly visible: boolean
  readonly timelineId?: string
}

export function SeverNotice({ visible, timelineId }: SeverNoticeProps): ReactNode {
  if (!visible) return null

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
        {timelineId != null && <span className="severNoticeId">#{timelineId.slice(0, 6)}</span>}
      </div>
      <div className="severNoticeCrackLeft" />
      <div className="severNoticeCrackRight" />
    </div>
  )
}

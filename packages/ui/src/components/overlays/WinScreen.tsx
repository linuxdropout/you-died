import type { ReactNode } from 'react'

interface WinScreenProps {
  readonly visible: boolean
  readonly winnerName: string
  readonly isLocalWinner: boolean
  readonly kills: number
  readonly deaths: number
}

export function WinScreen({
  visible,
  winnerName,
  isLocalWinner,
  kills,
  deaths,
}: WinScreenProps): ReactNode {
  if (!visible) return null

  return (
    <div className="winScreen">
      <div className="winScreenBg" />
      <div className="winScreenContent">
        {isLocalWinner ? (
          <h1 className="winScreenTitle winScreenTitleVictory">YOU WIN</h1>
        ) : (
          <h1 className="winScreenTitle winScreenTitleDefeat">YOU LOSE</h1>
        )}

        <p className="winScreenWinner">
          {isLocalWinner ? 'AHEAD OF ALL TIMELINES' : `${winnerName} ESCAPED`}
        </p>

        <div className="winScreenStats">
          <div className="winScreenStat">
            <span className="winScreenStatValue">{kills}</span>
            <span className="winScreenStatLabel">KILLS</span>
          </div>
          <div className="winScreenStatDivider">/</div>
          <div className="winScreenStat">
            <span className="winScreenStatValue">{deaths}</span>
            <span className="winScreenStatLabel">DEATHS</span>
          </div>
        </div>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'

interface MatchTimerProps {
  readonly elapsedSeconds: number
  readonly limitSeconds: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MatchTimer({ elapsedSeconds, limitSeconds }: MatchTimerProps): ReactNode {
  const remaining = Math.max(0, limitSeconds - elapsedSeconds)
  const isUrgent = remaining <= 30

  return (
    <div className={`matchTimer ${isUrgent ? 'matchTimerUrgent' : ''}`}>
      <span className="matchTimerTime">{formatTime(remaining)}</span>
    </div>
  )
}

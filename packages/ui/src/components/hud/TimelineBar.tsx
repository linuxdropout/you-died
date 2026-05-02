import type { ReactNode } from 'react'

export interface TimelinePlayer {
  readonly playerId: string
  readonly name: string
  readonly offsetSeconds: number
  readonly isGhost: boolean
  readonly isDead: boolean
  readonly color: string
}

interface TimelineBarProps {
  readonly players: readonly TimelinePlayer[]
  readonly winThreshold: number
  readonly localPlayerId: string
}

export function TimelineBar({ players, winThreshold, localPlayerId }: TimelineBarProps): ReactNode {
  const maxOffset = Math.max(winThreshold, ...players.map((p) => p.offsetSeconds)) || 1

  return (
    <div className="timelineBar">
      <div className="timelineBarTrack">
        <div
          className="timelineBarWinLine"
          style={{ left: `${(winThreshold / maxOffset) * 100}%` }}
        >
          <span className="timelineBarWinLabel">WIN</span>
        </div>

        {players.map((player) => {
          const pct = (player.offsetSeconds / maxOffset) * 100
          const isLocal = player.playerId === localPlayerId

          return (
            <div
              key={player.playerId}
              className={[
                'timelineBarPlayer',
                player.isGhost ? 'timelineBarPlayerGhost' : '',
                player.isDead ? 'timelineBarPlayerDead' : '',
                isLocal ? 'timelineBarPlayerLocal' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ left: `${pct}%` }}
            >
              <div className="timelineBarPip" style={{ backgroundColor: player.color }} />
              <span className="timelineBarName">{isLocal ? 'YOU' : player.name}</span>
              <span className="timelineBarOffset">{player.offsetSeconds.toFixed(1)}s</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

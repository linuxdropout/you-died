import type { PlayerId } from '@you-died/protocol'

interface Props {
  reason: string
  winnerId: PlayerId | undefined
  playerNames: Record<PlayerId, string>
  onPlayAgain: () => void
  onLeave: () => void
}

export function EndScreen({ reason, winnerId, playerNames, onPlayAgain, onLeave }: Props) {
  const winnerName = winnerId !== undefined ? (playerNames[winnerId] ?? winnerId) : undefined

  return (
    <div className="endScreen">
      <div className="endScreenBg" />

      <div className="endScreenContent">
        <h1 className="endScreenTitle">MATCH OVER</h1>
        <p className="endScreenReason">{reason}</p>
        {winnerName !== undefined && (
          <p className="endScreenWinner">WINNER: {winnerName}</p>
        )}

        <div className="endScreenActions">
          <button type="button" className="endScreenBtn" onClick={onPlayAgain}>
            PLAY AGAIN
          </button>
          <button type="button" className="endScreenBtn endScreenBtnLeave" onClick={onLeave}>
            LEAVE
          </button>
        </div>
      </div>
    </div>
  )
}

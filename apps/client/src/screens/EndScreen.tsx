import type { PlayerId } from '@you-died/protocol'

interface Props {
  reason: string
  winnerId: PlayerId | undefined
}

export function EndScreen({ reason, winnerId }: Props) {
  return (
    <div className="endScreen">
      <div className="endScreenBg" />

      <div className="endScreenContent">
        <h1 className="endScreenTitle">MATCH OVER</h1>
        <p className="endScreenReason">{reason}</p>
        {winnerId !== undefined && (
          <p className="endScreenWinner">WINNER: {winnerId}</p>
        )}
      </div>
    </div>
  )
}

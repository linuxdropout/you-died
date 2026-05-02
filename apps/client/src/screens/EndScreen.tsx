import type { PlayerId } from '@you-died/protocol'

interface Props {
  reason: string
  winnerId: PlayerId | undefined
}

export function EndScreen({ reason, winnerId }: Props) {
  return (
    <main>
      <h1>Match Over</h1>
      <p>Reason: {reason}</p>
      {winnerId !== undefined && <p>Winner: {winnerId}</p>}
    </main>
  )
}

import type { ReactNode } from 'react'

export type KillEventKind = 'kill' | 'rewind' | 'sever' | 'paradox' | 'launch' | 'win'

export interface KillEvent {
  readonly id: string
  readonly kind: KillEventKind
  readonly tick: number
  readonly killer?: string
  readonly victim?: string
  readonly weapon?: 'slash' | 'shoot'
  readonly message?: string
}

interface KillFeedProps {
  readonly events: readonly KillEvent[]
  readonly maxVisible?: number
}

const WEAPON_GLYPH: Record<string, string> = {
  slash: '[/]',
  shoot: '[*]',
}

const KIND_PREFIX: Record<KillEventKind, string> = {
  kill: '',
  rewind: '<<',
  sever: '~!~',
  paradox: '?!?',
  launch: '>>>',
  win: '***',
}

const KIND_CLASS: Record<KillEventKind, string> = {
  kill: 'killFeedKill',
  rewind: 'killFeedRewind',
  sever: 'killFeedSever',
  paradox: 'killFeedParadox',
  launch: 'killFeedLaunch',
  win: 'killFeedWin',
}

function formatEvent(event: KillEvent): string {
  if (event.message != null) return event.message

  const prefix = KIND_PREFIX[event.kind]
  const weapon = event.weapon != null ? ` ${WEAPON_GLYPH[event.weapon]} ` : ' '

  switch (event.kind) {
    case 'kill':
      return `${event.killer ?? '?'}${weapon}${event.victim ?? '?'}`
    case 'rewind':
      return `${prefix} ${event.victim ?? '?'} REWOUND`
    case 'sever':
      return `${prefix} ${event.victim ?? '?'} SEVERED`
    case 'paradox':
      return `${prefix} PARADOX ${prefix}`
    case 'launch':
      return `${prefix} ${event.victim ?? '?'} LAUNCHED`
    case 'win':
      return `${prefix} ${event.killer ?? '?'} WINS ${prefix}`
  }
}

export function KillFeed({ events, maxVisible = 6 }: KillFeedProps): ReactNode {
  const visible = events.slice(-maxVisible)

  return (
    <div className="killFeed">
      {visible.map((event, i) => (
        <div
          key={event.id}
          className={`killFeedEntry ${KIND_CLASS[event.kind]}`}
          style={{ opacity: 0.4 + (i / maxVisible) * 0.6 }}
        >
          {formatEvent(event)}
        </div>
      ))}
    </div>
  )
}

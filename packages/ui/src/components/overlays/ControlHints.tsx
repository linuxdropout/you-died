import type { ReactNode } from 'react'

interface ControlHintsProps {
  readonly showMove: boolean
  readonly showJump: boolean
  readonly showDash: boolean
  readonly showShoot: boolean
  readonly showSlash: boolean
}

interface HintItem {
  key: string
  label: string
  show: boolean
}

export function ControlHints({
  showMove,
  showJump,
  showDash,
  showShoot,
  showSlash,
}: ControlHintsProps): ReactNode {
  if (!showMove && !showJump && !showDash && !showShoot && !showSlash) return null

  const items: HintItem[] = [
    { key: 'WASD', label: 'MOVE', show: showMove },
    { key: 'W', label: 'JUMP', show: showJump },
    { key: 'SPACE', label: 'DASH', show: showDash },
    { key: 'LMB', label: 'SHOOT', show: showShoot },
    { key: 'RMB', label: 'SLASH', show: showSlash },
  ]

  return (
    <div className="controlHints">
      {items.map((item) => (
        <div key={item.label} className={`controlHint${item.show ? '' : ' controlHintDismissed'}`}>
          <span className="controlHintKey">{item.key}</span>
          <span className="controlHintAction">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

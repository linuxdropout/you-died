import type { ReactNode } from 'react'

interface ParadoxAlertProps {
  readonly visible: boolean
  readonly playerName?: string
}

export function ParadoxAlert({ visible, playerName }: ParadoxAlertProps): ReactNode {
  if (!visible) return null

  return (
    <div className="paradoxAlert">
      <div className="paradoxAlertVignette" />
      <div className="paradoxAlertStatic" />
      <div className="paradoxAlertGlitch">
        <span className="paradoxAlertText">PARADOX</span>
        <span className="paradoxAlertTextGhost" aria-hidden="true">
          PARADOX
        </span>
        <span className="paradoxAlertTextGhost2" aria-hidden="true">
          PARADOX
        </span>
      </div>
      {playerName != null && <p className="paradoxAlertSub">{playerName} LAUNCHED FORWARD</p>}
      <div className="paradoxAlertRipple" />
      <div className="paradoxAlertRipple2" />
    </div>
  )
}

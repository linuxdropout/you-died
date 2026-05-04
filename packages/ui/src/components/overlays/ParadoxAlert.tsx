import type { ReactNode } from 'react'

interface ParadoxAlertProps {
  readonly visible: boolean
  readonly playerName?: string
  readonly ticksDelta?: number
  readonly victimName?: string
}

export function ParadoxAlert({ visible, playerName, ticksDelta, victimName }: ParadoxAlertProps): ReactNode {
  if (!visible) return null

  const gainText = ticksDelta != null ? `+${(ticksDelta / 60).toFixed(1)}s` : undefined

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
      {gainText != null && <span className="paradoxAlertGain">{gainText}</span>}
      {playerName != null && (
        <p className="paradoxAlertSub">
          {playerName} AVENGED{victimName ? ` vs ${victimName}` : ''}
        </p>
      )}
      <div className="paradoxAlertRipple" />
      <div className="paradoxAlertRipple2" />
    </div>
  )
}

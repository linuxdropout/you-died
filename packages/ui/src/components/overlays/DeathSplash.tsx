import type { ReactNode } from 'react'

interface DeathSplashProps {
  readonly visible: boolean
  readonly killerName?: string
  readonly weapon?: 'slash' | 'shoot'
}

const WEAPON_FLAVOR: Record<string, string> = {
  slash: 'CUT YOU DOWN',
  shoot: 'SHOT YOU DEAD',
}

export function DeathSplash({ visible, killerName, weapon }: DeathSplashProps): ReactNode {
  if (!visible) return null

  return (
    <div className="deathSplash">
      <div className="deathSplashVignette" />
      <div className="deathSplashContent">
        <h1 className="deathSplashTitle">Previously On: You Fucking Died</h1>
        {killerName != null && (
          <p className="deathSplashSubtitle">
            {killerName} {weapon != null ? WEAPON_FLAVOR[weapon] : 'KILLED YOU'}
          </p>
        )}
        <p className="deathSplashHint">REWINDING...</p>
      </div>
      <div className="deathSplashBloodTop" />
      <div className="deathSplashBloodBottom" />
    </div>
  )
}

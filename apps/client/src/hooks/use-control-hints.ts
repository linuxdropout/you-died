import { useState, useCallback } from 'react'
import type { InputAction } from '../input/input'

export interface ControlHintsState {
  move: boolean
  jump: boolean
  dash: boolean
  shoot: boolean
  slash: boolean
}

export function useControlHints() {
  const [hints, setHints] = useState<ControlHintsState>({
    move: true,
    jump: true,
    dash: true,
    shoot: true,
    slash: true,
  })

  const onFirstUse = useCallback((action: InputAction) => {
    setHints(prev => ({ ...prev, [action]: false }))
  }, [])

  const allDismissed = !hints.move && !hints.jump && !hints.dash && !hints.shoot && !hints.slash

  return { hints, onFirstUse, allDismissed }
}

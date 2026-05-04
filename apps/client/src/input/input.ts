import type { PlayerInput } from '@you-died/protocol'

export type InputAction = 'move' | 'jump' | 'dash' | 'shoot' | 'slash'
export type FirstUseCallback = (action: InputAction) => void

const keyState = new Map<string, boolean>()

let firstUseCallback: FirstUseCallback | undefined
const firedActions = new Set<InputAction>()

export function initInputListeners(onFirstUse?: FirstUseCallback): () => void {
  firstUseCallback = onFirstUse
  firedActions.clear()

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') e.preventDefault()
    keyState.set(e.code, true)
  }
  const onKeyUp = (e: KeyboardEvent) => {
    keyState.set(e.code, false)
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    keyState.clear()
    firedActions.clear()
    firstUseCallback = undefined
  }
}

function trackFirstUse(action: InputAction, active: boolean): void {
  if (active && firstUseCallback && !firedActions.has(action)) {
    firedActions.add(action)
    firstUseCallback(action)
  }
}

export function captureInput(): PlayerInput {
  const dash =
    keyState.get('ShiftLeft') === true ||
    keyState.get('ShiftRight') === true ||
    keyState.get('Space') === true
  const slash =
    keyState.get('KeyZ') === true || keyState.get('KeyJ') === true || keyState.get('Comma') === true
  const shoot =
    keyState.get('KeyX') === true || keyState.get('KeyK') === true || keyState.get('Period') === true
  const left = keyState.get('ArrowLeft') === true || keyState.get('KeyA') === true
  const right = keyState.get('ArrowRight') === true || keyState.get('KeyD') === true
  const jump = keyState.get('ArrowUp') === true || keyState.get('KeyW') === true
  const down = keyState.get('ArrowDown') === true || keyState.get('KeyS') === true

  trackFirstUse('move', left || right)
  trackFirstUse('jump', jump)
  trackFirstUse('dash', dash)
  trackFirstUse('slash', slash)
  trackFirstUse('shoot', shoot)

  return {
    left,
    right,
    jump,
    down,
    dash,
    slash,
    shoot,
  }
}

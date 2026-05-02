import type { PlayerInput } from '@you-died/protocol'

export type InputAction = 'move' | 'jump' | 'dash' | 'shoot' | 'slash'
export type FirstUseCallback = (action: InputAction) => void

const keyState = new Map<string, boolean>()
const mouseState = new Map<number, boolean>()

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
  const onMouseDown = (e: MouseEvent) => {
    mouseState.set(e.button, true)
  }
  const onMouseUp = (e: MouseEvent) => {
    mouseState.set(e.button, false)
  }
  const onContextMenu = (e: Event) => {
    e.preventDefault()
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('contextmenu', onContextMenu)

  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('contextmenu', onContextMenu)
    keyState.clear()
    mouseState.clear()
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
  const dash = keyState.get('ShiftLeft') === true || keyState.get('ShiftRight') === true || keyState.get('Space') === true
  const slash = keyState.get('KeyZ') === true || keyState.get('KeyJ') === true || mouseState.get(2) === true
  const shoot = keyState.get('KeyX') === true || keyState.get('KeyK') === true || mouseState.get(0) === true

  const left = keyState.get('ArrowLeft') === true || keyState.get('KeyA') === true
  const right = keyState.get('ArrowRight') === true || keyState.get('KeyD') === true
  const jump = keyState.get('ArrowUp') === true || keyState.get('KeyW') === true

  trackFirstUse('move', left || right)
  trackFirstUse('jump', jump)
  trackFirstUse('dash', dash)
  trackFirstUse('slash', slash)
  trackFirstUse('shoot', shoot)

  return {
    left,
    right,
    jump,
    dash,
    slash,
    shoot,
  }
}

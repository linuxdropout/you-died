import type { PlayerInput } from '@you-died/protocol'

const keyState = new Map<string, boolean>()

export function initKeyboardListener(): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
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
  }
}

export function captureInput(): PlayerInput {
  return {
    left: keyState.get('ArrowLeft') === true || keyState.get('KeyA') === true,
    right: keyState.get('ArrowRight') === true || keyState.get('KeyD') === true,
    jump: keyState.get('ArrowUp') === true || keyState.get('KeyW') === true,
    dash: keyState.get('ShiftLeft') === true || keyState.get('ShiftRight') === true,
    slash: keyState.get('KeyZ') === true || keyState.get('KeyJ') === true,
    shoot: keyState.get('KeyX') === true || keyState.get('KeyK') === true,
  }
}

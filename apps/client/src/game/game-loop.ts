import type { PlayerInput, PlayerId } from '@you-died/protocol'
import { TICK_RATE } from '@you-died/protocol'
import { createInitialState, step, getRenderableState } from '@you-died/sim'
import type { GameState } from '@you-died/sim'
import { GameRenderer } from '@you-died/renderer'
import type { MatchContext, HudData, ScreenEvent } from '@you-died/renderer'
import type { PlayerColor } from '@you-died/assets'
import type { Room } from 'colyseus.js'
import { captureInput, initKeyboardListener } from '../input/keyboard'
import { sendMessage } from '../net/connection'

export interface GameLoopConfig {
  seed: number
  playerId: PlayerId
  playerIds: PlayerId[]
  playerNames: Record<PlayerId, string>
  playerColors: Record<PlayerId, string>
  room: Room
  canvas: HTMLCanvasElement
  onHudUpdate?: (data: HudData) => void
  onScreenEvent?: (event: ScreenEvent) => void
}

export interface GameLoop {
  start(): Promise<void>
  destroy(): void
  pushConfirmedInputs(tick: number, inputs: Record<PlayerId, PlayerInput>): void
}

interface ConfirmedTick {
  tick: number
  inputs: Record<PlayerId, PlayerInput>
}

export function createGameLoop(config: GameLoopConfig): GameLoop {
  const { seed, playerId, playerIds, playerNames, playerColors, room, canvas } = config

  let simState: GameState = createInitialState({ seed, playerIds })
  let localTick = 0
  const confirmedQueue: ConfirmedTick[] = []
  let simInterval: ReturnType<typeof setInterval> | null = null
  let rafId: number | null = null
  let cleanupKeyboard: (() => void) | null = null
  const renderer = new GameRenderer()
  let initialized = false
  let destroyed = false

  function simTick(): void {
    const input = captureInput()
    sendMessage(room, { type: 'input', tick: localTick, input })
    localTick++

    while (confirmedQueue.length > 0) {
      const confirmed = confirmedQueue.shift()
      if (confirmed) {
        simState = step(simState, confirmed.inputs)
      }
    }
  }

  function renderLoop(): void {
    const frame = getRenderableState(simState)
    renderer.renderFrame(frame)
    rafId = requestAnimationFrame(renderLoop)
  }

  return {
    async start() {
      await renderer.init(canvas)
      if (destroyed) {
        renderer.destroy()
        return
      }
      initialized = true

      const context: MatchContext = {
        localPlayerId: playerId,
        playerColors: playerColors as Record<PlayerId, PlayerColor>,
        playerNames,
      }
      renderer.startMatch(context)

      if (config.onHudUpdate) renderer.onHudUpdate(config.onHudUpdate)
      if (config.onScreenEvent) renderer.onScreenEvent(config.onScreenEvent)

      cleanupKeyboard = initKeyboardListener()
      simInterval = setInterval(simTick, 1000 / TICK_RATE)
      rafId = requestAnimationFrame(renderLoop)
    },

    destroy() {
      destroyed = true
      if (simInterval !== null) clearInterval(simInterval)
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (cleanupKeyboard !== null) cleanupKeyboard()
      if (initialized) renderer.destroy()
    },

    pushConfirmedInputs(tick, inputs) {
      confirmedQueue.push({ tick, inputs })
    },
  }
}

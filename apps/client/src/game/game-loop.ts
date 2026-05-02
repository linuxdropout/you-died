import type { PlayerInput, PlayerId } from '@you-died/protocol'
import { TICK_RATE, HASH_CHECK_INTERVAL_TICKS } from '@you-died/protocol'
import { createInitialState, step, getRenderableState, hashState } from '@you-died/sim'
import type { GameState } from '@you-died/sim'
import { GameRenderer, AudioContextGuard } from '@you-died/renderer'
import type { MatchContext, HudData, ScreenEvent } from '@you-died/renderer'
import type { PlayerColor } from '@you-died/assets'
import type { Room } from 'colyseus.js'
import type { FirstUseCallback } from '../input/input'
import { captureInput, initInputListeners } from '../input/input'
import { sendMessage } from '../net/connection'

export interface GameLoopConfig {
  seed: number
  playerId: PlayerId
  playerIds: PlayerId[]
  playerNames: Record<PlayerId, string>
  playerColors: Record<PlayerId, string>
  room: Room
  canvas: HTMLCanvasElement
  audioGuard?: AudioContextGuard
  onHudUpdate?: (data: HudData) => void
  onScreenEvent?: (event: ScreenEvent) => void
  onFirstUse?: FirstUseCallback
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
  const confirmedQueue: ConfirmedTick[] = []
  let simInterval: ReturnType<typeof setInterval> | null = null
  let rafId: number | null = null
  let cleanupInput: (() => void) | null = null
  const renderer = new GameRenderer(config.audioGuard)
  let initialized = false
  let destroyed = false

  const MAX_CATCHUP_PER_TICK = 3

  function simTick(): void {
    const input = captureInput()
    sendMessage(room, { type: 'input', tick: simState.tick, input })

    const steps = Math.min(confirmedQueue.length, MAX_CATCHUP_PER_TICK)
    for (let i = 0; i < steps; i++) {
      const confirmed = confirmedQueue.shift()
      if (confirmed) {
        simState = step(simState, confirmed.inputs)
        if (simState.tick % HASH_CHECK_INTERVAL_TICKS === 0) {
          sendMessage(room, { type: 'stateHash', tick: simState.tick, hash: hashState(simState) })
        }
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
      const base =
        (import.meta as unknown as { env: Record<string, string | undefined> }).env['BASE_URL'] ??
        '/'
      await renderer.init(canvas, `${base}sprites`)
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

      cleanupInput = initInputListeners(config.onFirstUse)
      simInterval = setInterval(simTick, 1000 / TICK_RATE)
      rafId = requestAnimationFrame(renderLoop)
    },

    destroy() {
      destroyed = true
      if (simInterval !== null) clearInterval(simInterval)
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (cleanupInput !== null) cleanupInput()
      if (initialized) renderer.destroy()
    },

    pushConfirmedInputs(tick, inputs) {
      confirmedQueue.push({ tick, inputs })
    },
  }
}

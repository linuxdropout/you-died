import type { GameConfig, GameState, PlayerState } from './types.ts'
import { DEFAULT_ARENA } from './arena.ts'
import { createInitialTimeline } from './timeline.ts'

export function createInitialState(config: GameConfig): GameState {
  const state: GameState = {
    tick: 0,
    seed: config.seed,
    config,
    players: {},
    projectiles: [],
    slashHitboxes: [],
    timelines: [],
    events: [],
    nextEntityId: 1,
    winner: undefined,
    kills: {},
    deaths: {},
  }

  for (let i = 0; i < config.playerIds.length; i++) {
    const playerId = config.playerIds[i]
    if (!playerId) continue

    const spawn = DEFAULT_ARENA.spawnPoints[i % DEFAULT_ARENA.spawnPoints.length]
    if (!spawn) continue

    const timeline = createInitialTimeline(state, playerId)
    state.timelines.push(timeline)

    const player: PlayerState = {
      id: playerId,
      timelineId: timeline.timelineId,
      pos: { x: spawn.x, y: spawn.y },
      vel: { x: 0, y: 0 },
      facingRight: i % 2 === 0,
      grounded: false,
      dashTicksRemaining: 0,
      dashCooldownTicks: 0,
      slashTicksRemaining: 0,
      slashCooldownTicks: 0,
      shootCooldownTicks: 0,
      shootTicksRemaining: 0,
      alive: true,
      isGhost: false,
      timelineOffset: 0,
    }

    state.players[playerId] = player
    state.kills[playerId] = 0
    state.deaths[playerId] = 0
  }

  return state
}

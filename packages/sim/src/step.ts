import type { GameState, PlayerInput } from './types.ts'
import { DEFAULT_ARENA } from './arena.ts'
import { applyMovement, resolvePlayerPlatformCollisions, isOutOfBounds } from './physics.ts'
import {
  processPlayerActions,
  moveProjectiles,
  checkSlashHits,
  checkProjectileHits,
  decayEntities,
} from './combat.ts'
import {
  recordSnapshot,
  handleHeadDeath,
  handlePastDeath,
  processGhostActions,
  checkWinCondition,
} from './timeline.ts'

const NO_INPUT: PlayerInput = {
  left: false,
  right: false,
  jump: false,
  dash: false,
  slash: false,
  shoot: false,
}

export function step(state: GameState, inputs: Record<string, PlayerInput>): GameState {
  if (state.winner !== undefined) return state

  state.events = []

  for (const playerId of state.config.playerIds) {
    const player = state.players[playerId]
    if (!player?.alive) continue
    const input = inputs[playerId] ?? NO_INPUT
    recordSnapshot(state, playerId, input)
  }

  for (const playerId of state.config.playerIds) {
    const player = state.players[playerId]
    if (!player?.alive) continue
    const input = inputs[playerId] ?? NO_INPUT
    processPlayerActions(state, playerId, player, input)
  }

  processGhostActions(state)

  for (const playerId of state.config.playerIds) {
    const player = state.players[playerId]
    if (!player?.alive) continue
    const input = inputs[playerId] ?? NO_INPUT
    applyMovement(player, input)
  }

  moveProjectiles(state)

  for (const playerId of state.config.playerIds) {
    const player = state.players[playerId]
    if (!player?.alive) continue
    resolvePlayerPlatformCollisions(player, DEFAULT_ARENA)
  }

  const boundaryDeaths: string[] = []
  for (const playerId of state.config.playerIds) {
    const player = state.players[playerId]
    if (!player?.alive) continue
    if (isOutOfBounds(player, DEFAULT_ARENA)) {
      player.alive = false
      boundaryDeaths.push(playerId)
    }
  }

  const slashHits = checkSlashHits(state)
  const projectileHits = checkProjectileHits(state)
  const allHits = [...slashHits, ...projectileHits]

  for (const hit of allHits) {
    if (hit.victimIsHead) {
      const victim = state.players[hit.victimId]
      if (victim?.alive) {
        victim.alive = false
      }
    }
  }

  for (const playerId of boundaryDeaths) {
    state.deaths[playerId] = (state.deaths[playerId] ?? 0) + 1
    handleHeadDeath(state, playerId)
  }

  for (const hit of allHits) {
    if (hit.victimIsHead) {
      state.kills[hit.attackerId] = (state.kills[hit.attackerId] ?? 0) + 1
      state.deaths[hit.victimId] = (state.deaths[hit.victimId] ?? 0) + 1
      handleHeadDeath(state, hit.victimId, hit.attackerId)
    } else {
      handlePastDeath(state, hit.victimId, hit.victimTimelineId, hit.attackerTimelineId)
    }
  }

  decayEntities(state)

  const winner = checkWinCondition(state)
  if (winner !== undefined) {
    state.winner = winner
    state.events.push({ tick: state.tick, type: 'win', playerId: winner })
  }

  state.tick++

  return state
}

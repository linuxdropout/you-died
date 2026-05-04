import type { GameState, PlayerInput } from './types.ts'
import { applyMovement, resolvePlayerPlatformCollisions, isOutOfBounds } from './physics.ts'
import {
  processPlayerActions,
  updateSlashPositions,
  moveProjectiles,
  deflectProjectiles,
  checkSlashHits,
  checkProjectileHits,
  decayEntities,
  rectsOverlap,
} from './combat.ts'
import { PROJECTILE_WIDTH, PROJECTILE_HEIGHT, MAX_GHOST_TIMELINES } from './constants.ts'
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

  const arena = state.config.arena

  state.events = []

  for (const playerId of state.config.playerIds) {
    const player = state.players[playerId]
    if (!player?.alive) continue
    if (player.invulTicksRemaining > 0) player.invulTicksRemaining--
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

  state.projectiles = state.projectiles.filter((proj) => {
    const pLeft = proj.pos.x - PROJECTILE_WIDTH / 2
    const pRight = proj.pos.x + PROJECTILE_WIDTH / 2
    const pTop = proj.pos.y - PROJECTILE_HEIGHT / 2
    const pBottom = proj.pos.y + PROJECTILE_HEIGHT / 2
    for (const wall of arena.platforms) {
      if (!wall.isWall) continue
      if (rectsOverlap(pLeft, pTop, pRight, pBottom, wall.x, wall.y, wall.x + wall.width, wall.y + wall.height)) {
        return false
      }
    }
    return true
  })

  for (const playerId of state.config.playerIds) {
    const player = state.players[playerId]
    if (!player?.alive) continue
    resolvePlayerPlatformCollisions(player, arena)
  }

  updateSlashPositions(state)
  deflectProjectiles(state)

  const boundaryDeaths: string[] = []
  for (const playerId of state.config.playerIds) {
    const player = state.players[playerId]
    if (!player?.alive) continue
    if (isOutOfBounds(player, arena)) {
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

  const processedDeaths = new Set<string>()

  for (const playerId of boundaryDeaths) {
    state.deaths[playerId] = (state.deaths[playerId] ?? 0) + 1
    handleHeadDeath(state, playerId)
    processedDeaths.add(playerId)
  }

  for (const hit of allHits) {
    if (hit.victimIsHead) {
      if (!processedDeaths.has(hit.victimId)) {
        state.kills[hit.attackerId] = (state.kills[hit.attackerId] ?? 0) + 1
        state.deaths[hit.victimId] = (state.deaths[hit.victimId] ?? 0) + 1
        handleHeadDeath(state, hit.victimId, hit.attackerId)
        processedDeaths.add(hit.victimId)
      }
    } else {
      handlePastDeath(state, hit.victimId, hit.victimTimelineId, hit.attackerId)
    }
  }

  decayEntities(state)

  const activeTimelines = state.timelines.filter(
    (t) => t.headEndedAtTick !== undefined && !t.replayComplete,
  )
  if (activeTimelines.length > MAX_GHOST_TIMELINES) {
    for (let i = 0; i < activeTimelines.length - MAX_GHOST_TIMELINES; i++) {
      const tl = activeTimelines[i]
      if (tl) tl.replayComplete = true
    }
  }

  for (const playerId of state.config.playerIds) {
    const player = state.players[playerId]
    if (!player?.alive) continue
    player.ticks++
  }

  const winner = checkWinCondition(state)
  if (winner !== undefined) {
    state.winner = winner
    state.events.push({ tick: state.tick, type: 'win', playerId: winner })
  }

  state.tick++

  return state
}

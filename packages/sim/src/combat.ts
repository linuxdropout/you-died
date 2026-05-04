import type { PlayerInput, PlayerState, GameState } from './types.ts'
import {
  PROJECTILE_SPEED,
  PROJECTILE_LIFETIME,
  SHOOT_COOLDOWN,
  SHOOT_DURATION,
  PROJECTILE_WIDTH,
  PROJECTILE_HEIGHT,
  SLASH_DURATION,
  SLASH_COOLDOWN,
  SLASH_WIDTH,
  SLASH_HEIGHT,
  SLASH_OFFSET_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
} from './constants.ts'

export function rectsOverlap(
  aLeft: number,
  aTop: number,
  aRight: number,
  aBottom: number,
  bLeft: number,
  bTop: number,
  bRight: number,
  bBottom: number,
): boolean {
  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop
}

function nextId(state: GameState): number {
  return state.nextEntityId++
}

export function processPlayerActions(
  state: GameState,
  playerId: string,
  player: PlayerState,
  input: PlayerInput,
): void {
  if (!player.alive) return

  if (input.slash && player.slashTicksRemaining === 0 && player.slashCooldownTicks === 0) {
    player.slashTicksRemaining = SLASH_DURATION
    player.slashCooldownTicks = SLASH_COOLDOWN
    const offsetX = player.facingRight ? SLASH_OFFSET_X : -SLASH_OFFSET_X
    state.slashHitboxes.push({
      id: nextId(state),
      ownerId: playerId,
      ownerTimelineId: player.timelineId,
      pos: {
        x: player.pos.x + offsetX,
        y: player.pos.y - PLAYER_HEIGHT / 2,
      },
      offsetX,
      width: SLASH_WIDTH,
      height: SLASH_HEIGHT,
      ticksRemaining: SLASH_DURATION,
      isGhost: player.isGhost,
    })
  }

  if (player.slashTicksRemaining > 0) {
    player.slashTicksRemaining--
  }

  if (player.slashCooldownTicks > 0) {
    player.slashCooldownTicks--
  }

  if (input.shoot && player.shootCooldownTicks === 0) {
    player.shootCooldownTicks = SHOOT_COOLDOWN
    player.shootTicksRemaining = SHOOT_DURATION
    const dir = player.facingRight ? 1 : -1
    state.projectiles.push({
      id: nextId(state),
      ownerId: playerId,
      ownerTimelineId: player.timelineId,
      pos: {
        x: player.pos.x + dir * (PLAYER_WIDTH / 2 + 2),
        y: player.pos.y - PLAYER_HEIGHT / 2,
      },
      vel: { x: dir * PROJECTILE_SPEED, y: 0 },
      ticksRemaining: PROJECTILE_LIFETIME,
      isGhost: player.isGhost,
    })
  }

  if (player.shootCooldownTicks > 0) {
    player.shootCooldownTicks--
  }

  if (player.shootTicksRemaining > 0) {
    player.shootTicksRemaining--
  }
}

export function updateSlashPositions(state: GameState): void {
  for (const slash of state.slashHitboxes) {
    if (slash.isGhost) continue
    const owner = state.players[slash.ownerId]
    if (!owner?.alive) continue
    if (owner.timelineId !== slash.ownerTimelineId) continue
    slash.pos.x = owner.pos.x + slash.offsetX
    slash.pos.y = owner.pos.y - PLAYER_HEIGHT / 2
  }
}

export function moveProjectiles(state: GameState): void {
  for (const proj of state.projectiles) {
    proj.pos.x += proj.vel.x
    proj.pos.y += proj.vel.y
  }
}

interface HitResult {
  victimId: string
  victimTimelineId: string
  victimIsHead: boolean
  attackerId: string
  attackerTimelineId: string
}

export function checkSlashHits(state: GameState): HitResult[] {
  const hits: HitResult[] = []

  for (const slash of state.slashHitboxes) {
    const sLeft = slash.pos.x - slash.width / 2
    const sRight = slash.pos.x + slash.width / 2
    const sTop = slash.pos.y - slash.height / 2
    const sBottom = slash.pos.y + slash.height / 2

    for (const player of Object.values(state.players)) {
      if (!player.alive) continue
      if (player.invulTicksRemaining > 0) continue
      if (player.id === slash.ownerId && player.timelineId === slash.ownerTimelineId) continue
      if (player.isGhost && !slash.isGhost) continue
      if (player.isGhost) continue

      const pLeft = player.pos.x - PLAYER_WIDTH / 2
      const pRight = player.pos.x + PLAYER_WIDTH / 2
      const pTop = player.pos.y - PLAYER_HEIGHT
      const pBottom = player.pos.y

      if (rectsOverlap(sLeft, sTop, sRight, sBottom, pLeft, pTop, pRight, pBottom)) {
        hits.push({
          victimId: player.id,
          victimTimelineId: player.timelineId,
          victimIsHead: true,
          attackerId: slash.ownerId,
          attackerTimelineId: slash.ownerTimelineId,
        })
      }
    }

    for (const timeline of state.timelines) {
      if (timeline.severed) continue
      if (timeline.replayComplete) continue
      if (timeline.headEndedAtTick === undefined) continue
      if (timeline.replayOriginTick === undefined) continue
      if (timeline.snapshots.length === 0) continue

      const elapsed = state.tick - timeline.replayOriginTick
      if (elapsed < 0) continue
      const index = elapsed % timeline.snapshots.length
      const snapshot = timeline.snapshots[index]
      if (!snapshot) continue
      if (!snapshot.state.alive) continue

      if (slash.ownerId === timeline.playerId) continue
      if (snapshot.state.isGhost) continue

      const pLeft = snapshot.state.pos.x - PLAYER_WIDTH / 2
      const pRight = snapshot.state.pos.x + PLAYER_WIDTH / 2
      const pTop = snapshot.state.pos.y - PLAYER_HEIGHT
      const pBottom = snapshot.state.pos.y

      if (rectsOverlap(sLeft, sTop, sRight, sBottom, pLeft, pTop, pRight, pBottom)) {
        hits.push({
          victimId: timeline.playerId,
          victimTimelineId: timeline.timelineId,
          victimIsHead: false,
          attackerId: slash.ownerId,
          attackerTimelineId: slash.ownerTimelineId,
        })
      }
    }
  }

  return hits
}

export function checkProjectileHits(state: GameState): HitResult[] {
  const hits: HitResult[] = []
  const consumedProjectiles = new Set<number>()

  for (const proj of state.projectiles) {
    if (consumedProjectiles.has(proj.id)) continue

    const pjLeft = proj.pos.x - PROJECTILE_WIDTH / 2
    const pjRight = proj.pos.x + PROJECTILE_WIDTH / 2
    const pjTop = proj.pos.y - PROJECTILE_HEIGHT / 2
    const pjBottom = proj.pos.y + PROJECTILE_HEIGHT / 2

    for (const player of Object.values(state.players)) {
      if (!player.alive) continue
      if (player.invulTicksRemaining > 0) continue
      if (player.id === proj.ownerId && player.timelineId === proj.ownerTimelineId) continue
      if (player.isGhost && !proj.isGhost) continue
      if (player.isGhost) continue

      const plLeft = player.pos.x - PLAYER_WIDTH / 2
      const plRight = player.pos.x + PLAYER_WIDTH / 2
      const plTop = player.pos.y - PLAYER_HEIGHT
      const plBottom = player.pos.y

      if (rectsOverlap(pjLeft, pjTop, pjRight, pjBottom, plLeft, plTop, plRight, plBottom)) {
        hits.push({
          victimId: player.id,
          victimTimelineId: player.timelineId,
          victimIsHead: true,
          attackerId: proj.ownerId,
          attackerTimelineId: proj.ownerTimelineId,
        })
        consumedProjectiles.add(proj.id)
        break
      }
    }

    if (consumedProjectiles.has(proj.id)) continue

    for (const timeline of state.timelines) {
      if (timeline.severed) continue
      if (timeline.replayComplete) continue
      if (timeline.headEndedAtTick === undefined) continue
      if (timeline.replayOriginTick === undefined) continue
      if (timeline.snapshots.length === 0) continue

      const elapsed = state.tick - timeline.replayOriginTick
      if (elapsed < 0) continue
      const index = elapsed % timeline.snapshots.length
      const snapshot = timeline.snapshots[index]
      if (!snapshot) continue
      if (!snapshot.state.alive) continue

      if (proj.ownerId === timeline.playerId) continue
      if (snapshot.state.isGhost) continue

      const plLeft = snapshot.state.pos.x - PLAYER_WIDTH / 2
      const plRight = snapshot.state.pos.x + PLAYER_WIDTH / 2
      const plTop = snapshot.state.pos.y - PLAYER_HEIGHT
      const plBottom = snapshot.state.pos.y

      if (rectsOverlap(pjLeft, pjTop, pjRight, pjBottom, plLeft, plTop, plRight, plBottom)) {
        hits.push({
          victimId: timeline.playerId,
          victimTimelineId: timeline.timelineId,
          victimIsHead: false,
          attackerId: proj.ownerId,
          attackerTimelineId: proj.ownerTimelineId,
        })
        consumedProjectiles.add(proj.id)
        break
      }
    }
  }

  state.projectiles = state.projectiles.filter((p) => !consumedProjectiles.has(p.id))
  return hits
}

export function destroyDeflectedProjectiles(state: GameState): void {
  const destroyed = new Set<number>()

  for (const slash of state.slashHitboxes) {
    const sLeft = slash.pos.x - slash.width / 2
    const sRight = slash.pos.x + slash.width / 2
    const sTop = slash.pos.y - slash.height / 2
    const sBottom = slash.pos.y + slash.height / 2

    for (const proj of state.projectiles) {
      if (destroyed.has(proj.id)) continue
      if (proj.ownerId === slash.ownerId && proj.ownerTimelineId === slash.ownerTimelineId) continue

      const pLeft = proj.pos.x - PROJECTILE_WIDTH / 2
      const pRight = proj.pos.x + PROJECTILE_WIDTH / 2
      const pTop = proj.pos.y - PROJECTILE_HEIGHT / 2
      const pBottom = proj.pos.y + PROJECTILE_HEIGHT / 2

      if (rectsOverlap(sLeft, sTop, sRight, sBottom, pLeft, pTop, pRight, pBottom)) {
        destroyed.add(proj.id)
      }
    }
  }

  state.projectiles = state.projectiles.filter((p) => !destroyed.has(p.id))
}

export function decayEntities(state: GameState): void {
  for (const proj of state.projectiles) {
    proj.ticksRemaining--
  }
  state.projectiles = state.projectiles.filter((p) => p.ticksRemaining > 0)

  for (const slash of state.slashHitboxes) {
    slash.ticksRemaining--
  }
  state.slashHitboxes = state.slashHitboxes.filter((s) => s.ticksRemaining > 0)
}

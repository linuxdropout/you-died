import type { GameState } from './types.ts'

function fnv1a(hash: number, value: number): number {
  hash ^= value & 0xff
  hash = Math.imul(hash, 0x01000193)
  hash ^= (value >>> 8) & 0xff
  hash = Math.imul(hash, 0x01000193)
  hash ^= (value >>> 16) & 0xff
  hash = Math.imul(hash, 0x01000193)
  hash ^= (value >>> 24) & 0xff
  hash = Math.imul(hash, 0x01000193)
  return hash
}

function hashFloat(hash: number, value: number): number {
  return fnv1a(hash, Math.round(value * 1000))
}

export function hashState(state: GameState): number {
  let h = 0x811c9dc5

  h = fnv1a(h, state.tick)

  const sortedPlayerIds = state.config.playerIds.slice().sort()
  for (const id of sortedPlayerIds) {
    const p = state.players[id]
    if (!p) continue
    h = hashFloat(h, p.pos.x)
    h = hashFloat(h, p.pos.y)
    h = hashFloat(h, p.vel.x)
    h = hashFloat(h, p.vel.y)
    h = fnv1a(h, p.alive ? 1 : 0)
    h = fnv1a(h, p.isGhost ? 1 : 0)
    h = fnv1a(h, p.timelineOffset)
    h = fnv1a(h, p.dashTicksRemaining)
    h = fnv1a(h, p.dashCooldownTicks)
    h = fnv1a(h, p.slashTicksRemaining)
    h = fnv1a(h, p.slashCooldownTicks)
    h = fnv1a(h, p.shootCooldownTicks)
    h = fnv1a(h, p.shootTicksRemaining)
    h = fnv1a(h, p.grounded ? 1 : 0)
    h = fnv1a(h, p.facingRight ? 1 : 0)
  }

  const sortedProj = state.projectiles.slice().sort((a, b) => a.id - b.id)
  h = fnv1a(h, sortedProj.length)
  for (const proj of sortedProj) {
    h = fnv1a(h, proj.id)
    h = hashFloat(h, proj.pos.x)
    h = hashFloat(h, proj.pos.y)
  }

  h = fnv1a(h, state.slashHitboxes.length)

  for (const tl of state.timelines) {
    h = fnv1a(h, tl.severed ? 1 : 0)
  }

  return h >>> 0
}

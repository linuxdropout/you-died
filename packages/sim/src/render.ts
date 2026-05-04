import type {
  GameState,
  RenderFrame,
  RenderPlayer,
  RenderProjectile,
  RenderSlash,
} from './types.ts'
import { SHOOT_COOLDOWN } from './constants.ts'

export function getRenderableState(state: GameState): RenderFrame {
  const players: RenderPlayer[] = []

  for (const player of Object.values(state.players)) {
    players.push({
      id: player.id,
      timelineId: player.timelineId,
      pos: { ...player.pos },
      facingRight: player.facingRight,
      grounded: player.grounded,
      isGhost: player.isGhost,
      isSlashing: player.slashTicksRemaining > 0,
      isShooting: player.shootTicksRemaining > 0,
      isDashing: player.dashTicksRemaining > 0,
      alive: player.alive,
      ticks: player.ticks,
      isInvulnerable: player.invulTicksRemaining > 0,
      shootCooldownRatio: player.shootCooldownTicks / SHOOT_COOLDOWN,
    })
  }

  for (const timeline of state.timelines) {
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

    players.push({
      id: timeline.playerId,
      timelineId: timeline.timelineId,
      pos: { ...snapshot.state.pos },
      facingRight: snapshot.state.facingRight,
      grounded: snapshot.state.grounded,
      isGhost: timeline.severed,
      isSlashing: snapshot.state.slashTicksRemaining > 0,
      isShooting: snapshot.state.shootTicksRemaining > 0,
      isDashing: snapshot.state.dashTicksRemaining > 0,
      alive: snapshot.state.alive,
      ticks: 0,
      isInvulnerable: false,
      shootCooldownRatio: 0,
    })
  }

  const projectiles: RenderProjectile[] = state.projectiles.map((p) => ({
    id: p.id,
    pos: { ...p.pos },
    vel: { ...p.vel },
    isGhost: p.isGhost,
  }))

  const slashes: RenderSlash[] = state.slashHitboxes.map((s) => ({
    id: s.id,
    pos: { ...s.pos },
    width: s.width,
    height: s.height,
    facingRight: s.offsetX > 0,
    isGhost: s.isGhost,
  }))

  return {
    tick: state.tick,
    players,
    projectiles,
    slashes,
    events: [...state.events],
    winner: state.winner,
  }
}

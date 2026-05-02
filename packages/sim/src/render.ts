import type { GameState, RenderFrame, RenderPlayer, RenderProjectile, RenderSlash } from './types.ts'

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
      isDashing: player.dashTicksRemaining > 0,
      alive: player.alive,
    })
  }

  for (const timeline of state.timelines) {
    if (timeline.replayComplete) continue
    if (timeline.headEndedAtTick === undefined) continue
    if (timeline.replayOriginTick === undefined || timeline.replayStartTick === undefined) continue

    const playbackTick = timeline.replayStartTick + (state.tick - timeline.replayOriginTick)
    const index = playbackTick - timeline.startTick
    if (index < 0 || index >= timeline.snapshots.length) continue

    const snapshot = timeline.snapshots[index]
    if (!snapshot) continue
    if (!snapshot.state.alive) continue

    const isGhost = timeline.severed && playbackTick >= (timeline.severedAtSnapshotTick ?? 0)

    players.push({
      id: timeline.playerId,
      timelineId: timeline.timelineId,
      pos: { ...snapshot.state.pos },
      facingRight: snapshot.state.facingRight,
      grounded: snapshot.state.grounded,
      isGhost,
      isSlashing: snapshot.state.slashTicksRemaining > 0,
      isDashing: snapshot.state.dashTicksRemaining > 0,
      alive: snapshot.state.alive,
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

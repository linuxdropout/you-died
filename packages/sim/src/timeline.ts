import type {
  PlayerId,
  TimelineId,
  PlayerInput,
  PlayerState,
  GameState,
  TimelineRecord,
  TimelineSnapshot,
} from './types.ts'
import { REWIND_TICKS, WIN_THRESHOLD_TICKS, PARADOX_MIN_GAIN_TICKS, INVUL_TICKS } from './constants.ts'
import { nextSeed, seedToFloat } from './rng.ts'
import { processPlayerActions } from './combat.ts'

function clonePlayerState(p: PlayerState): PlayerState {
  return {
    ...p,
    pos: { ...p.pos },
    vel: { ...p.vel },
  }
}

function generateTimelineId(state: GameState, playerId: PlayerId): TimelineId {
  state.seed = nextSeed(state.seed)
  return `${playerId}-${state.seed.toString(36)}`
}

function findCurrentTimeline(
  state: GameState,
  playerId: PlayerId,
): TimelineRecord | undefined {
  const player = state.players[playerId]
  if (!player) return undefined
  return state.timelines.find((t) => t.playerId === playerId && t.timelineId === player.timelineId)
}

export function recordSnapshot(state: GameState, playerId: PlayerId, input: PlayerInput): void {
  const player = state.players[playerId]
  if (!player) return

  const timeline = findCurrentTimeline(state, playerId)
  if (!timeline) return

  const snapshot: TimelineSnapshot = {
    tick: state.tick,
    input: { ...input },
    state: clonePlayerState(player),
  }
  timeline.snapshots.push(snapshot)
}

function findSnapshotInPreviousTimeline(
  state: GameState,
  playerId: PlayerId,
  targetTick: number,
): TimelineSnapshot | undefined {
  for (const timeline of state.timelines) {
    if (timeline.playerId !== playerId) continue
    if (timeline.headEndedAtTick === undefined) continue
    const firstSnap = timeline.snapshots[0]
    if (!firstSnap) continue
    const firstTick = firstSnap.tick
    const index = targetTick - firstTick
    if (index < 0 || index >= timeline.snapshots.length) continue
    const snapshot = timeline.snapshots[index]
    if (snapshot) return snapshot
  }
  return undefined
}

export function handleHeadDeath(state: GameState, playerId: PlayerId, killerId?: PlayerId): void {
  const player = state.players[playerId]
  if (!player) return

  const currentTimeline = findCurrentTimeline(state, playerId)
  if (!currentTimeline) return
  if (currentTimeline.headEndedAtTick !== undefined) return

  currentTimeline.ticksAtDeath = player.ticks
  if (killerId) {
    currentTimeline.killedByPlayerId = killerId
    const killerPlayer = state.players[killerId]
    if (killerPlayer) {
      currentTimeline.killedByTimelineId = killerPlayer.timelineId
    }
  }

  const localRewindTarget = Math.max(currentTimeline.startTick, state.tick - REWIND_TICKS)
  const fullRewindTarget = Math.max(0, state.tick - REWIND_TICKS)

  let snapshot: TimelineSnapshot | undefined
  if (fullRewindTarget < currentTimeline.startTick) {
    snapshot = findSnapshotInPreviousTimeline(state, playerId, fullRewindTarget)
  }
  if (!snapshot) {
    const localIndex = localRewindTarget - currentTimeline.startTick
    if (localIndex >= 0 && localIndex < currentTimeline.snapshots.length) {
      snapshot = currentTimeline.snapshots[localIndex]
    }
  }

  currentTimeline.headEndedAtTick = state.tick
  currentTimeline.replayOriginTick = state.tick
  currentTimeline.replayStartTick = currentTimeline.startTick

  const newTimelineId = generateTimelineId(state, playerId)

  const newTimeline: TimelineRecord = {
    timelineId: newTimelineId,
    playerId,
    startTick: state.tick,
    snapshots: [],
    headEndedAtTick: undefined,
    replayOriginTick: undefined,
    replayStartTick: undefined,
    severed: false,
    severedAtSnapshotTick: undefined,
    severedByTimelineId: undefined,
    replayComplete: false,
    killedByPlayerId: undefined,
    killedByTimelineId: undefined,
    ticksAtDeath: undefined,
  }
  state.timelines.push(newTimeline)

  if (snapshot) {
    const restored = clonePlayerState(snapshot.state)
    restored.timelineId = newTimelineId
    restored.alive = true
    restored.isGhost = false
    restored.invulTicksRemaining = INVUL_TICKS
    restored.slashTicksRemaining = 0
    restored.slashCooldownTicks = 0
    restored.shootCooldownTicks = 0
    restored.shootTicksRemaining = 0
    restored.dashTicksRemaining = 0
    restored.dashCooldownTicks = 0
    state.players[playerId] = restored
  } else {
    player.timelineId = newTimelineId
    player.alive = true
    player.invulTicksRemaining = INVUL_TICKS
    player.vel.x = 0
    player.vel.y = 0
    player.slashTicksRemaining = 0
    player.slashCooldownTicks = 0
    player.shootCooldownTicks = 0
    player.shootTicksRemaining = 0
    player.dashTicksRemaining = 0
    player.dashCooldownTicks = 0
  }

  const p = state.players[playerId]
  if (p) {
    p.ticks = Math.max(0, p.ticks - REWIND_TICKS)
  }

  state.events.push({
    tick: state.tick,
    type: 'death',
    playerId,
    ...(killerId ? { killerId } : {}),
  })
  state.events.push({ tick: state.tick, type: 'rewind', playerId })
}

function severTimeline(state: GameState, timeline: TimelineRecord): void {
  timeline.severed = true

  for (const proj of state.projectiles) {
    if (proj.ownerTimelineId === timeline.timelineId) {
      proj.isGhost = true
    }
  }
  for (const slash of state.slashHitboxes) {
    if (slash.ownerTimelineId === timeline.timelineId) {
      slash.isGhost = true
    }
  }
}

function pickRandomSpawn(state: GameState): { x: number; y: number } {
  const spawns = state.config.arena.spawnPoints
  state.seed = nextSeed(state.seed)
  const idx = Math.floor(seedToFloat(state.seed) * spawns.length)
  const spawn = spawns[idx] ?? spawns[0] ?? { x: 0, y: 0 }
  return { x: spawn.x, y: spawn.y }
}

export function handlePastDeath(
  state: GameState,
  victimId: PlayerId,
  victimTimelineId: TimelineId,
  attackerPlayerId: PlayerId,
): void {
  const timeline = state.timelines.find(
    (t) => t.playerId === victimId && t.timelineId === victimTimelineId,
  )
  if (!timeline) return
  if (timeline.severed) return

  severTimeline(state, timeline)

  state.events.push({ tick: state.tick, type: 'death', playerId: victimId })
  state.events.push({ tick: state.tick, type: 'timelineSevered', playerId: victimId })

  const player = state.players[victimId]
  if (player && timeline.replayOriginTick !== undefined && timeline.snapshots.length > 0) {
    const elapsed = state.tick - timeline.replayOriginTick
    const loopTick = elapsed % timeline.snapshots.length

    if (loopTick < player.ticks) {
      player.ticks = loopTick
      const spawn = pickRandomSpawn(state)
      player.pos.x = spawn.x
      player.pos.y = spawn.y
      player.vel.x = 0
      player.vel.y = 0
      player.invulTicksRemaining = INVUL_TICKS
      player.slashTicksRemaining = 0
      player.slashCooldownTicks = 0
      player.shootCooldownTicks = 0
      player.shootTicksRemaining = 0
      player.dashTicksRemaining = 0
      player.dashCooldownTicks = 0
    }
  }

  checkParadox(state, attackerPlayerId, victimId, victimTimelineId)
}

function checkParadox(
  state: GameState,
  attackerPlayerId: PlayerId,
  victimPlayerId: PlayerId,
  victimTimelineId: TimelineId,
): void {
  const linkedPastLife = state.timelines.find(
    (t) =>
      t.playerId === attackerPlayerId &&
      !t.severed &&
      t.headEndedAtTick !== undefined &&
      t.killedByPlayerId === victimPlayerId &&
      t.killedByTimelineId === victimTimelineId,
  )
  if (!linkedPastLife) return

  severTimeline(state, linkedPastLife)

  const player = state.players[attackerPlayerId]
  if (!player) return

  const gain = Math.max(PARADOX_MIN_GAIN_TICKS, (linkedPastLife.ticksAtDeath ?? 0) - player.ticks)
  player.ticks += gain

  const lastSnap = linkedPastLife.snapshots[linkedPastLife.snapshots.length - 1]
  if (lastSnap) {
    player.pos.x = lastSnap.state.pos.x
    player.pos.y = lastSnap.state.pos.y
  }

  player.vel.x = 0
  player.vel.y = 0
  player.invulTicksRemaining = INVUL_TICKS
  player.slashTicksRemaining = 0
  player.slashCooldownTicks = 0
  player.shootCooldownTicks = 0
  player.shootTicksRemaining = 0
  player.dashTicksRemaining = 0
  player.dashCooldownTicks = 0

  state.events.push({ tick: state.tick, type: 'paradox', playerId: attackerPlayerId })
  state.events.push({ tick: state.tick, type: 'futureLaunch', playerId: attackerPlayerId })
}

export function processGhostActions(state: GameState): void {
  for (const timeline of state.timelines) {
    if (timeline.replayComplete) continue
    if (timeline.headEndedAtTick === undefined) continue
    if (timeline.replayOriginTick === undefined) continue
    if (timeline.snapshots.length === 0) {
      timeline.replayComplete = true
      continue
    }

    const elapsed = state.tick - timeline.replayOriginTick
    if (elapsed < 0) continue
    const index = elapsed % timeline.snapshots.length

    const snapshot = timeline.snapshots[index]
    if (!snapshot) continue
    if (!snapshot.state.alive) continue

    const isGhost = timeline.severed

    const ghostPlayer: PlayerState = {
      ...clonePlayerState(snapshot.state),
      isGhost,
    }

    processPlayerActions(state, timeline.playerId, ghostPlayer, snapshot.input)
  }
}

export function checkWinCondition(state: GameState): PlayerId | undefined {
  const playerIds = state.config.playerIds

  const atThreshold: PlayerId[] = []
  for (const id of playerIds) {
    const p = state.players[id]
    if (!p?.alive) continue
    if (p.ticks >= WIN_THRESHOLD_TICKS) {
      atThreshold.push(id)
    }
  }

  if (atThreshold.length === 1) return atThreshold[0]
  return undefined
}

export function getTimeoutWinner(state: GameState): PlayerId | undefined {
  const playerIds = state.config.playerIds
  if (playerIds.length < 2) return undefined

  let bestId: PlayerId | undefined
  let bestScore = -Infinity
  let bestKills = -1
  let tied = false

  for (const id of playerIds) {
    const k = state.kills[id] ?? 0
    const d = state.deaths[id] ?? 0
    const score = k - d

    if (score > bestScore || (score === bestScore && k > bestKills)) {
      bestId = id
      bestScore = score
      bestKills = k
      tied = false
    } else if (score === bestScore && k === bestKills) {
      tied = true
    }
  }

  return tied ? undefined : bestId
}

export function createInitialTimeline(state: GameState, playerId: PlayerId): TimelineRecord {
  const timelineId = generateTimelineId(state, playerId)

  const timeline: TimelineRecord = {
    timelineId,
    playerId,
    startTick: 0,
    snapshots: [],
    headEndedAtTick: undefined,
    replayOriginTick: undefined,
    replayStartTick: undefined,
    severed: false,
    severedAtSnapshotTick: undefined,
    severedByTimelineId: undefined,
    replayComplete: false,
    killedByPlayerId: undefined,
    killedByTimelineId: undefined,
    ticksAtDeath: undefined,
  }

  return timeline
}

import type {
  PlayerId,
  TimelineId,
  PlayerInput,
  PlayerState,
  GameState,
  TimelineRecord,
  TimelineSnapshot,
} from './types.ts'
import { REWIND_TICKS, WIN_LEAD_TICKS } from './constants.ts'
import { nextSeed } from './rng.ts'
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

export function findCurrentTimeline(
  state: GameState,
  playerId: PlayerId,
): TimelineRecord | undefined {
  const player = state.players[playerId]
  if (!player) return undefined
  return state.timelines.find(
    (t) => t.playerId === playerId && t.timelineId === player.timelineId,
  )
}

export function recordSnapshot(
  state: GameState,
  playerId: PlayerId,
  input: PlayerInput,
): void {
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

export function handleHeadDeath(state: GameState, playerId: PlayerId, killerId?: PlayerId): void {
  const player = state.players[playerId]
  if (!player) return

  const currentTimeline = findCurrentTimeline(state, playerId)
  if (!currentTimeline) return
  if (currentTimeline.headEndedAtTick !== undefined) return

  const rewindTarget = Math.max(currentTimeline.startTick, state.tick - REWIND_TICKS)
  const snapshotIndex = rewindTarget - currentTimeline.startTick
  const snapshot = currentTimeline.snapshots[snapshotIndex]

  currentTimeline.headEndedAtTick = state.tick
  currentTimeline.replayOriginTick = state.tick
  currentTimeline.replayStartTick = rewindTarget

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
  }
  state.timelines.push(newTimeline)

  if (snapshot) {
    const restored = clonePlayerState(snapshot.state)
    restored.timelineId = newTimelineId
    restored.alive = true
    restored.isGhost = false
    restored.slashTicksRemaining = 0
    restored.shootCooldownTicks = 0
    restored.dashTicksRemaining = 0
    restored.dashCooldownTicks = 0
    state.players[playerId] = restored
  } else {
    player.timelineId = newTimelineId
    player.alive = true
    player.vel.x = 0
    player.vel.y = 0
    player.slashTicksRemaining = 0
    player.shootCooldownTicks = 0
    player.dashTicksRemaining = 0
    player.dashCooldownTicks = 0
  }

  const p = state.players[playerId]
  if (p) {
    p.timelineOffset -= state.tick - rewindTarget
  }

  state.events.push({ tick: state.tick, type: 'death', playerId, ...(killerId ? { killerId } : {}) })
  state.events.push({ tick: state.tick, type: 'rewind', playerId })
}

export function handlePastDeath(
  state: GameState,
  victimId: PlayerId,
  victimTimelineId: TimelineId,
  attackerTimelineId: TimelineId,
): void {
  const timeline = state.timelines.find(
    (t) => t.playerId === victimId && t.timelineId === victimTimelineId,
  )
  if (!timeline) return
  if (timeline.severed) return

  const playbackTick =
    timeline.replayStartTick !== undefined && timeline.replayOriginTick !== undefined
      ? timeline.replayStartTick + (state.tick - timeline.replayOriginTick)
      : state.tick

  timeline.severed = true
  timeline.severedAtSnapshotTick = playbackTick
  timeline.severedByTimelineId = attackerTimelineId

  for (const proj of state.projectiles) {
    if (proj.ownerTimelineId === victimTimelineId) {
      proj.isGhost = true
    }
  }
  for (const slash of state.slashHitboxes) {
    if (slash.ownerTimelineId === victimTimelineId) {
      slash.isGhost = true
    }
  }

  state.events.push({ tick: state.tick, type: 'death', playerId: victimId })
  state.events.push({ tick: state.tick, type: 'timelineSevered', playerId: victimId })

  resolveParadoxes(state)
}

export function resolveParadoxes(state: GameState): void {
  let changed = true
  let iterations = 0
  const maxIterations = state.timelines.length * 2

  while (changed && iterations < maxIterations) {
    changed = false
    iterations++

    for (const timeline of state.timelines) {
      if (!timeline.severed) continue
      if (timeline.severedByTimelineId === undefined) continue

      const causingTimeline = state.timelines.find(
        (t) => t.timelineId === timeline.severedByTimelineId,
      )
      if (!causingTimeline) continue

      if (causingTimeline.severed) {
        const causerSeverTick = causingTimeline.severedAtSnapshotTick ?? 0
        const mySeverTick = timeline.severedAtSnapshotTick ?? 0

        if (causerSeverTick <= mySeverTick) {
          timeline.severed = false
          timeline.severedAtSnapshotTick = undefined
          timeline.severedByTimelineId = undefined

          for (const proj of state.projectiles) {
            if (proj.ownerTimelineId === timeline.timelineId) {
              proj.isGhost = false
            }
          }
          for (const slash of state.slashHitboxes) {
            if (slash.ownerTimelineId === timeline.timelineId) {
              slash.isGhost = false
            }
          }

          const player = state.players[timeline.playerId]
          if (player) {
            player.timelineOffset += REWIND_TICKS
          }

          state.events.push({
            tick: state.tick,
            type: 'paradox',
            playerId: timeline.playerId,
          })
          state.events.push({
            tick: state.tick,
            type: 'futureLaunch',
            playerId: timeline.playerId,
          })

          changed = true
        }
      }
    }
  }
}

export function processGhostActions(state: GameState): void {
  for (const timeline of state.timelines) {
    if (timeline.headEndedAtTick === undefined) continue
    if (timeline.replayOriginTick === undefined || timeline.replayStartTick === undefined) continue

    const playbackTick = timeline.replayStartTick + (state.tick - timeline.replayOriginTick)
    const index = playbackTick - timeline.startTick
    if (index < 0 || index >= timeline.snapshots.length) continue

    const snapshot = timeline.snapshots[index]
    if (!snapshot) continue
    if (!snapshot.state.alive) continue

    const isGhost = timeline.severed && playbackTick >= (timeline.severedAtSnapshotTick ?? 0)

    const ghostPlayer: PlayerState = {
      ...clonePlayerState(snapshot.state),
      isGhost,
    }

    processPlayerActions(state, timeline.playerId, ghostPlayer, snapshot.input)
  }
}

export function checkWinCondition(state: GameState): PlayerId | undefined {
  const playerIds = state.config.playerIds
  if (playerIds.length < 2) return undefined

  for (const candidateId of playerIds) {
    const candidate = state.players[candidateId]
    if (!candidate) continue
    if (!candidate.alive) continue

    let isAhead = true
    for (const otherId of playerIds) {
      if (otherId === candidateId) continue
      const other = state.players[otherId]
      if (!other) continue

      if (candidate.timelineOffset - other.timelineOffset < WIN_LEAD_TICKS) {
        isAhead = false
        break
      }
    }

    if (isAhead) return candidateId
  }

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

export function createInitialTimeline(
  state: GameState,
  playerId: PlayerId,
): TimelineRecord {
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
  }

  return timeline
}

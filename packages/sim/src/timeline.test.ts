import type { PlayerInput, PlayerState } from './types.ts'
import { createInitialState } from './state.ts'
import { step } from './step.ts'
import { resolveParadoxes } from './timeline.ts'
import { REWIND_TICKS, WIN_LEAD_TICKS, PLAYER_WIDTH, INVUL_TICKS } from './constants.ts'
import { DEFAULT_ARENA } from './arena.ts'

const NO_INPUT: PlayerInput = {
  left: false,
  right: false,
  jump: false,
  dash: false,
  slash: false,
  shoot: false,
}

function inputWith(overrides: Partial<PlayerInput>): PlayerInput {
  return { ...NO_INPUT, ...overrides }
}

function getPlayer(state: ReturnType<typeof createInitialState>, id: string): PlayerState {
  const p = state.players[id]
  if (!p) throw new Error(`player ${id} not found`)
  return p
}

function runTicks(
  state: ReturnType<typeof createInitialState>,
  n: number,
  inputFn?: (tick: number) => Record<string, PlayerInput>,
): ReturnType<typeof createInitialState> {
  for (let i = 0; i < n; i++) {
    const inputs = inputFn
      ? inputFn(state.tick)
      : Object.fromEntries(state.config.playerIds.map((id) => [id, NO_INPUT]))
    state = step(state, inputs)
  }
  return state
}

describe('timeline', () => {
  it('rewinds player on head death', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 640, y: 10000 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true

    state = runTicks(state, REWIND_TICKS + 100, (tick) => ({
      p1: tick < REWIND_TICKS ? inputWith({ right: true }) : NO_INPUT,
      p2: NO_INPUT,
    }))

    const p1Before = getPlayer(state, 'p1')
    const posBeforeKill = p1Before.pos.x
    const timelineIdBefore = p1Before.timelineId

    const p2b = getPlayer(state, 'p2')
    p2b.pos = { x: posBeforeKill + PLAYER_WIDTH + 10, y: p1Before.pos.y }
    p2b.vel = { x: 0, y: 0 }
    p2b.grounded = true
    p2b.facingRight = false
    p2b.alive = true

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    const p1After = getPlayer(state, 'p1')
    expect(p1After.alive).toBe(true)
    expect(p1After.timelineId).not.toBe(timelineIdBefore)
    expect(p1After.ticks).toBeLessThan(0)

    expect(p1After.pos.x).not.toBe(posBeforeKill)
  })

  it('rewinds position back to where player was REWIND_TICKS ago', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 300, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 300, y: 10000 }
    p2.vel = { x: 0, y: 0 }

    state = runTicks(state, 100)

    const posAtRewindTarget = getPlayer(state, 'p1').pos.x

    state = runTicks(state, REWIND_TICKS)

    const p1Before = getPlayer(state, 'p1')
    const p2b = getPlayer(state, 'p2')
    p2b.pos = { x: p1Before.pos.x + PLAYER_WIDTH + 10, y: p1Before.pos.y }
    p2b.vel = { x: 0, y: 0 }
    p2b.grounded = true
    p2b.facingRight = false
    p2b.alive = true

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    const p1After = getPlayer(state, 'p1')
    expect(p1After.alive).toBe(true)
    expect(p1After.pos.x).toBe(posAtRewindTarget)
  })

  it('creates no ghost on head death', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true

    const p2 = getPlayer(state, 'p2')
    p2.pos = { x: 640, y: 10000 }
    p2.vel = { x: 0, y: 0 }

    state = runTicks(state, 100)

    const p2b = getPlayer(state, 'p2')
    const p1b = getPlayer(state, 'p1')
    p2b.pos = { x: p1b.pos.x + PLAYER_WIDTH + 10, y: p1b.pos.y }
    p2b.vel = { x: 0, y: 0 }
    p2b.grounded = true
    p2b.facingRight = false
    p2b.alive = true

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    const headTimeline = state.timelines.find(
      (t) => t.playerId === 'p1' && t.headEndedAtTick !== undefined,
    )
    if (!headTimeline) throw new Error('no ended timeline found')
    expect(headTimeline.severed).toBe(false)
  })

  it('severs timeline on past self death', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true

    const p2 = getPlayer(state, 'p2')
    p2.pos = { x: 640, y: 10000 }
    p2.vel = { x: 0, y: 0 }

    state = runTicks(state, REWIND_TICKS + 50, (tick) => ({
      p1: tick < REWIND_TICKS ? inputWith({ right: true }) : NO_INPUT,
      p2: NO_INPUT,
    }))

    const p1Before = getPlayer(state, 'p1')
    const p2b = getPlayer(state, 'p2')
    p2b.pos = { x: p1Before.pos.x + PLAYER_WIDTH + 10, y: p1Before.pos.y }
    p2b.vel = { x: 0, y: 0 }
    p2b.grounded = true
    p2b.facingRight = false
    p2b.alive = true

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    const p1After = getPlayer(state, 'p1')
    expect(p1After.alive).toBe(true)

    const oldTimeline = state.timelines.find(
      (t) =>
        t.playerId === 'p1' && t.headEndedAtTick !== undefined && t.replayOriginTick !== undefined,
    )
    expect(oldTimeline).toBeDefined()

    if (!oldTimeline) return

    if (oldTimeline.replayStartTick === undefined || oldTimeline.replayOriginTick === undefined)
      return

    const p1Head = getPlayer(state, 'p1')
    const pastPlaybackTick =
      oldTimeline.replayStartTick + (state.tick - oldTimeline.replayOriginTick)
    const pastIndex = pastPlaybackTick - oldTimeline.startTick
    const pastSnapshot = oldTimeline.snapshots[pastIndex]

    if (!pastSnapshot) return

    const p2c = getPlayer(state, 'p2')
    p2c.pos = { x: pastSnapshot.state.pos.x + PLAYER_WIDTH + 10, y: pastSnapshot.state.pos.y }
    p2c.vel = { x: 0, y: 0 }
    p2c.grounded = true
    p2c.facingRight = false
    p2c.alive = true
    p1Head.pos = { x: 100, y: 550 }

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    const severedTimeline = state.timelines.find((t) => t.playerId === 'p1' && t.severed)
    expect(severedTimeline).toBeDefined()
    expect(state.events.some((e) => e.type === 'timelineSevered')).toBe(true)
  })

  it('win condition triggers when a player is far enough ahead', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 700, y: 550 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true

    p1.ticks = WIN_LEAD_TICKS + 100
    p2.ticks = 0

    state = step(state, { p1: NO_INPUT, p2: NO_INPUT })

    expect(state.winner).toBe('p1')
    expect(state.events.some((e) => e.type === 'win' && e.playerId === 'p1')).toBe(true)
  })

  it('win condition does not trigger when lead is insufficient', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 700, y: 550 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true

    p1.ticks = WIN_LEAD_TICKS - 100
    p2.ticks = 0

    state = step(state, { p1: NO_INPUT, p2: NO_INPUT })

    expect(state.winner).toBeUndefined()
  })

  it('ghost replays loop instead of completing', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 640, y: 10000 }
    p2.vel = { x: 0, y: 0 }

    state = runTicks(state, 60)

    const p2b = getPlayer(state, 'p2')
    const p1b = getPlayer(state, 'p1')
    p2b.pos = { x: p1b.pos.x + PLAYER_WIDTH + 10, y: p1b.pos.y }
    p2b.vel = { x: 0, y: 0 }
    p2b.grounded = true
    p2b.facingRight = false
    p2b.alive = true

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    const endedTimeline = state.timelines.find(
      (t) => t.playerId === 'p1' && t.headEndedAtTick !== undefined,
    )
    if (!endedTimeline) throw new Error('no ended timeline found')
    expect(endedTimeline.snapshots.length).toBeGreaterThan(0)

    const snapshotCount = endedTimeline.snapshots.length
    state = runTicks(state, REWIND_TICKS + 100)

    expect(endedTimeline.replayComplete).toBe(false)
    expect(endedTimeline.snapshots.length).toBe(snapshotCount)
  })

  it('determinism holds through death and rewind cycles', () => {
    const runScenario = (): ReturnType<typeof createInitialState> => {
      let state = createInitialState({ seed: 42, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

      const p1 = getPlayer(state, 'p1')
      const p2 = getPlayer(state, 'p2')
      p1.pos = { x: 400, y: 550 }
      p1.vel = { x: 0, y: 0 }
      p1.grounded = true
      p2.pos = { x: 800, y: 550 }
      p2.vel = { x: 0, y: 0 }
      p2.grounded = true

      state = runTicks(state, REWIND_TICKS + 50, () => ({
        p1: inputWith({ right: true }),
        p2: inputWith({ left: true }),
      }))

      const p1b = getPlayer(state, 'p1')
      const p2b = getPlayer(state, 'p2')
      p2b.pos = { x: p1b.pos.x + PLAYER_WIDTH + 10, y: p1b.pos.y }
      p2b.vel = { x: 0, y: 0 }
      p2b.grounded = true
      p2b.facingRight = false
      p2b.alive = true

      state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

      state = runTicks(state, 100, () => ({
        p1: inputWith({ right: true }),
        p2: inputWith({ left: true }),
      }))

      return state
    }

    const state1 = runScenario()
    const state2 = runScenario()

    const p1a = getPlayer(state1, 'p1')
    const p1b = getPlayer(state2, 'p1')
    expect(p1a.pos.x).toBe(p1b.pos.x)
    expect(p1a.pos.y).toBe(p1b.pos.y)
    expect(p1a.timelineId).toBe(p1b.timelineId)
    expect(p1a.ticks).toBe(p1b.ticks)
    expect(state1.tick).toBe(state2.tick)
    expect(state1.seed).toBe(state2.seed)
    expect(state1.timelines.length).toBe(state2.timelines.length)
  })

  it('paradox cascade grants at most one offset boost per player', () => {
    const state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true

    const p2 = getPlayer(state, 'p2')
    p2.pos = { x: 800, y: 550 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true

    // Simulate a chain of severed timelines for p1:
    // tl-A severed by tl-B, tl-B severed by tl-C, tl-C severed by tl-D (p2's active timeline)
    // When tl-D severs tl-C, the cascade should unsever tl-B then tl-A,
    // but p1 should only get one REWIND_TICKS boost.
    const tlA = {
      timelineId: 'p1-tl-a',
      playerId: 'p1',
      startTick: 0,
      snapshots: [],
      headEndedAtTick: 100,
      replayOriginTick: 100,
      replayStartTick: 0,
      severed: true,
      severedAtSnapshotTick: 50,
      severedByTimelineId: 'p1-tl-b',
      replayComplete: false,
    }
    const tlB = {
      timelineId: 'p1-tl-b',
      playerId: 'p1',
      startTick: 100,
      snapshots: [],
      headEndedAtTick: 200,
      replayOriginTick: 200,
      replayStartTick: 100,
      severed: true,
      severedAtSnapshotTick: 150,
      severedByTimelineId: 'p1-tl-c',
      replayComplete: false,
    }
    const tlC = {
      timelineId: 'p1-tl-c',
      playerId: 'p1',
      startTick: 200,
      snapshots: [],
      headEndedAtTick: 300,
      replayOriginTick: 300,
      replayStartTick: 200,
      severed: true,
      severedAtSnapshotTick: 250,
      severedByTimelineId: 'p2-tl-d',
      replayComplete: false,
    }
    const tlD = {
      timelineId: 'p2-tl-d',
      playerId: 'p2',
      startTick: 0,
      snapshots: [],
      headEndedAtTick: undefined,
      replayOriginTick: undefined,
      replayStartTick: undefined,
      severed: true,
      severedAtSnapshotTick: 200,
      severedByTimelineId: undefined as string | undefined,
      replayComplete: false,
    }

    state.timelines.push(tlA, tlB, tlC, tlD)

    const offsetBefore = p1.ticks

    resolveParadoxes(state)

    expect(p1.ticks).toBe(offsetBefore + REWIND_TICKS)

    const paradoxEvents = state.events.filter((e) => e.type === 'paradox' && e.playerId === 'p1')
    expect(paradoxEvents.length).toBeGreaterThanOrEqual(1)
  })

  it('spawn invulnerability prevents immediate combat death', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 640, y: 10000 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true

    state = runTicks(state, REWIND_TICKS + 100, (tick) => ({
      p1: tick < REWIND_TICKS ? inputWith({ right: true }) : NO_INPUT,
      p2: NO_INPUT,
    }))

    const p1Before = getPlayer(state, 'p1')
    const p2b = getPlayer(state, 'p2')
    p2b.pos = { x: p1Before.pos.x + PLAYER_WIDTH + 10, y: p1Before.pos.y }
    p2b.vel = { x: 0, y: 0 }
    p2b.grounded = true
    p2b.facingRight = false
    p2b.alive = true

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    const p1After = getPlayer(state, 'p1')
    expect(p1After.invulTicksRemaining).toBe(INVUL_TICKS)

    const p2c = getPlayer(state, 'p2')
    p2c.pos = { x: p1After.pos.x + PLAYER_WIDTH + 10, y: p1After.pos.y }
    p2c.vel = { x: 0, y: 0 }
    p2c.grounded = true
    p2c.facingRight = false
    p2c.alive = true
    p2c.invulTicksRemaining = 0
    p2c.slashCooldownTicks = 0

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    const p1Still = getPlayer(state, 'p1')
    expect(p1Still.alive).toBe(true)
    expect(state.events.some((e) => e.type === 'rewind' && e.playerId === 'p1')).toBe(false)
  })

  it('invulnerability expires after INVUL_TICKS', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 400, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 400, y: 10000 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true

    state = runTicks(state, REWIND_TICKS + 50)

    const p1a = getPlayer(state, 'p1')
    const p2a = getPlayer(state, 'p2')
    p2a.pos = { x: p1a.pos.x + PLAYER_WIDTH + 10, y: p1a.pos.y }
    p2a.vel = { x: 0, y: 0 }
    p2a.grounded = true
    p2a.facingRight = false
    p2a.alive = true

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })
    expect(getPlayer(state, 'p1').invulTicksRemaining).toBe(INVUL_TICKS)

    state = runTicks(state, INVUL_TICKS)
    expect(getPlayer(state, 'p1').invulTicksRemaining).toBe(0)

    const p1b = getPlayer(state, 'p1')
    const p2b = getPlayer(state, 'p2')
    p2b.pos = { x: p1b.pos.x + PLAYER_WIDTH + 10, y: p1b.pos.y }
    p2b.vel = { x: 0, y: 0 }
    p2b.grounded = true
    p2b.facingRight = false
    p2b.alive = true
    p2b.invulTicksRemaining = 0
    p2b.slashCooldownTicks = 0

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    expect(state.events.some((e) => e.type === 'death' && e.playerId === 'p1')).toBe(true)
  })

  it('cross-timeline rewind restores position from before current timeline', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 300, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 300, y: 10000 }
    p2.vel = { x: 0, y: 0 }

    state = runTicks(state, 100)
    const posAt100 = getPlayer(state, 'p1').pos.x

    state = runTicks(state, REWIND_TICKS)

    // First death: rewinds to tick 100
    const p1a = getPlayer(state, 'p1')
    const p2a = getPlayer(state, 'p2')
    p2a.pos = { x: p1a.pos.x + PLAYER_WIDTH + 10, y: p1a.pos.y }
    p2a.vel = { x: 0, y: 0 }
    p2a.grounded = true
    p2a.facingRight = false
    p2a.alive = true
    p2a.invulTicksRemaining = 0

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })
    expect(getPlayer(state, 'p1').pos.x).toBe(posAt100)

    // Run a short time (less than REWIND_TICKS)
    state = runTicks(state, INVUL_TICKS + 10)

    // Second death: should still rewind to around tick 100
    const p1b = getPlayer(state, 'p1')
    const p2b = getPlayer(state, 'p2')
    p2b.pos = { x: p1b.pos.x + PLAYER_WIDTH + 10, y: p1b.pos.y }
    p2b.vel = { x: 0, y: 0 }
    p2b.grounded = true
    p2b.facingRight = false
    p2b.alive = true
    p2b.invulTicksRemaining = 0

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    // Player should be restored to a position from well before the current timeline started
    const p1c = getPlayer(state, 'p1')
    expect(p1c.alive).toBe(true)
    expect(p1c.pos.x).toBe(posAt100)
  })
})

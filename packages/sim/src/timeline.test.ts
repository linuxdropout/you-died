import type { PlayerInput, PlayerState } from './types.ts'
import { createInitialState } from './state.ts'
import { step } from './step.ts'
import { REWIND_TICKS, WIN_LEAD_TICKS, PLAYER_WIDTH } from './constants.ts'

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
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'] })

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
    expect(p1After.timelineOffset).toBeLessThan(0)
  })

  it('creates no ghost on head death', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'] })

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
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'] })

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
      (t) => t.playerId === 'p1' && t.headEndedAtTick !== undefined && t.replayOriginTick !== undefined,
    )
    expect(oldTimeline).toBeDefined()

    if (!oldTimeline) return

    if (oldTimeline.replayStartTick === undefined || oldTimeline.replayOriginTick === undefined)
      return

    const p1Head = getPlayer(state, 'p1')
    const pastPlaybackTick = oldTimeline.replayStartTick + (state.tick - oldTimeline.replayOriginTick)
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

    const severedTimeline = state.timelines.find(
      (t) => t.playerId === 'p1' && t.severed,
    )
    expect(severedTimeline).toBeDefined()
    expect(state.events.some((e) => e.type === 'timelineSevered')).toBe(true)
  })

  it('win condition triggers when a player is far enough ahead', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'] })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 700, y: 550 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true

    p1.timelineOffset = WIN_LEAD_TICKS + 100
    p2.timelineOffset = 0

    state = step(state, { p1: NO_INPUT, p2: NO_INPUT })

    expect(state.winner).toBe('p1')
    expect(state.events.some((e) => e.type === 'win' && e.playerId === 'p1')).toBe(true)
  })

  it('win condition does not trigger when lead is insufficient', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'] })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 700, y: 550 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true

    p1.timelineOffset = WIN_LEAD_TICKS - 100
    p2.timelineOffset = 0

    state = step(state, { p1: NO_INPUT, p2: NO_INPUT })

    expect(state.winner).toBeUndefined()
  })

  it('determinism holds through death and rewind cycles', () => {
    const runScenario = (): ReturnType<typeof createInitialState> => {
      let state = createInitialState({ seed: 42, playerIds: ['p1', 'p2'] })

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
    expect(p1a.timelineOffset).toBe(p1b.timelineOffset)
    expect(state1.tick).toBe(state2.tick)
    expect(state1.seed).toBe(state2.seed)
    expect(state1.timelines.length).toBe(state2.timelines.length)
  })
})

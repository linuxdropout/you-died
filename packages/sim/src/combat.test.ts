import type { PlayerInput, PlayerState } from './types.ts'
import { createInitialState } from './state.ts'
import { step } from './step.ts'
import { SLASH_DURATION, PROJECTILE_LIFETIME, PLAYER_WIDTH } from './constants.ts'

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

function placePlayersAdjacent(state: ReturnType<typeof createInitialState>): void {
  const p1 = getPlayer(state, 'p1')
  const p2 = getPlayer(state, 'p2')
  p1.pos = { x: 400, y: 550 }
  p1.vel = { x: 0, y: 0 }
  p1.grounded = true
  p1.facingRight = true
  p1.alive = true
  p2.pos = { x: 400 + PLAYER_WIDTH + 10, y: 550 }
  p2.vel = { x: 0, y: 0 }
  p2.grounded = true
  p2.facingRight = false
  p2.alive = true
}

function placePlayersFarApart(state: ReturnType<typeof createInitialState>): void {
  const p1 = getPlayer(state, 'p1')
  const p2 = getPlayer(state, 'p2')
  p1.pos = { x: 200, y: 550 }
  p1.vel = { x: 0, y: 0 }
  p1.grounded = true
  p1.facingRight = true
  p1.alive = true
  p2.pos = { x: 900, y: 550 }
  p2.vel = { x: 0, y: 0 }
  p2.grounded = true
  p2.facingRight = false
  p2.alive = true
}

describe('combat', () => {
  it('slash kills an adjacent player', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'] })
    placePlayersAdjacent(state)

    state = step(state, { p1: inputWith({ slash: true }), p2: NO_INPUT })

    const hasDeathEvent = state.events.some(
      (e) => e.type === 'death' && e.playerId === 'p2',
    )
    expect(hasDeathEvent).toBe(true)
  })

  it('slash misses a distant player', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'] })
    placePlayersFarApart(state)

    for (let i = 0; i < SLASH_DURATION + 2; i++) {
      state = step(state, { p1: inputWith({ slash: true }), p2: NO_INPUT })
    }

    const p2 = getPlayer(state, 'p2')
    expect(p2.alive).toBe(true)
  })

  it('projectile kills a distant player', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'] })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 300, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p1.facingRight = true
    p2.pos = { x: 400, y: 550 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true

    state = step(state, { p1: inputWith({ shoot: true }), p2: NO_INPUT })

    for (let i = 0; i < 30; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
      if (state.timelines.some((t) => t.playerId === 'p2' && t.headEndedAtTick !== undefined)) break
    }

    const hitHappened = state.timelines.some(
      (t) => t.playerId === 'p2' && t.headEndedAtTick !== undefined,
    )
    expect(hitHappened).toBe(true)
  })

  it('projectile expires after its lifetime', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'] })
    placePlayersFarApart(state)

    const p2 = getPlayer(state, 'p2')
    p2.pos = { x: 10000, y: 550 }

    state = step(state, { p1: inputWith({ shoot: true }), p2: NO_INPUT })
    expect(state.projectiles.length).toBe(1)

    for (let i = 0; i < PROJECTILE_LIFETIME + 5; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }

    expect(state.projectiles.length).toBe(0)
  })

  it('one hit kills — no health bars', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'] })
    placePlayersAdjacent(state)

    state = step(state, { p1: inputWith({ slash: true }), p2: NO_INPUT })

    const deathEvents = state.events.filter((e) => e.type === 'death' && e.playerId === 'p2')
    expect(deathEvents.length).toBeGreaterThanOrEqual(1)
  })
})

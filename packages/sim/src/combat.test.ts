import type { PlayerInput, PlayerState } from './types.ts'
import { createInitialState } from './state.ts'
import { step } from './step.ts'
import {
  SLASH_DURATION,
  SLASH_COOLDOWN,
  SHOOT_COOLDOWN,
  PROJECTILE_LIFETIME,
  PLAYER_WIDTH,
} from './constants.ts'
import { DEFAULT_ARENA } from './arena.ts'

const NO_INPUT: PlayerInput = {
  left: false,
  right: false,
  jump: false,
  down: false,
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
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
    placePlayersAdjacent(state)

    state = step(state, { p1: inputWith({ slash: true }), p2: NO_INPUT })

    const hasDeathEvent = state.events.some((e) => e.type === 'death' && e.playerId === 'p2')
    expect(hasDeathEvent).toBe(true)
  })

  it('slash misses a distant player', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
    placePlayersFarApart(state)

    for (let i = 0; i < SLASH_DURATION + 2; i++) {
      state = step(state, { p1: inputWith({ slash: true }), p2: NO_INPUT })
    }

    const p2 = getPlayer(state, 'p2')
    expect(p2.alive).toBe(true)
  })

  it('projectile kills a distant player', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

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
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
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
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
    placePlayersAdjacent(state)

    state = step(state, { p1: inputWith({ slash: true }), p2: NO_INPUT })

    const deathEvents = state.events.filter((e) => e.type === 'death' && e.playerId === 'p2')
    expect(deathEvents.length).toBeGreaterThanOrEqual(1)
  })

  it('slash has a cooldown between uses', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
    placePlayersFarApart(state)

    state = step(state, { p1: inputWith({ slash: true }), p2: NO_INPUT })
    expect(state.slashHitboxes.length).toBe(1)

    for (let i = 0; i < SLASH_DURATION; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }

    state = step(state, { p1: inputWith({ slash: true }), p2: NO_INPUT })
    expect(state.slashHitboxes.length).toBe(0)

    for (let i = 0; i < SLASH_COOLDOWN; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }

    state = step(state, { p1: inputWith({ slash: true }), p2: NO_INPUT })
    expect(state.slashHitboxes.length).toBe(1)
  })

  it('slash hitbox follows the player during movement', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
    placePlayersFarApart(state)

    const p1 = getPlayer(state, 'p1')
    p1.facingRight = true

    state = step(state, { p1: inputWith({ slash: true, right: true }), p2: NO_INPUT })
    const slashAfterCreate = state.slashHitboxes[0]
    if (!slashAfterCreate) throw new Error('no slash hitbox created')
    const initialSlashX = slashAfterCreate.pos.x

    state = step(state, { p1: inputWith({ right: true }), p2: NO_INPUT })
    const slashAfterMove = state.slashHitboxes[0]
    if (!slashAfterMove) throw new Error('slash hitbox disappeared')
    expect(slashAfterMove.pos.x).toBeGreaterThan(initialSlashX)
  })

  it('ghost projectile from severed timeline can hit own current head', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 300, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p1.facingRight = true
    p2.pos = { x: 900, y: 550 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true

    state = step(state, { p1: inputWith({ shoot: true }), p2: NO_INPUT })
    expect(state.projectiles.length).toBe(1)
    const proj = state.projectiles[0]
    if (!proj) throw new Error('no projectile spawned')
    const projVelX = proj.vel.x
    expect(projVelX).toBeGreaterThan(0)

    for (let i = 0; i < 5; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }

    const projAfter = state.projectiles[0]
    if (!projAfter) throw new Error('projectile disappeared')
    const projX = projAfter.pos.x
    const p1Before = getPlayer(state, 'p1')
    p1Before.pos = { x: -PLAYER_WIDTH - 5, y: 550 }
    state = step(state, { p1: NO_INPUT, p2: NO_INPUT })

    const p1After = getPlayer(state, 'p1')
    expect(p1After.alive).toBe(true)
    const p1OldTimeline = state.timelines.find(
      (t) => t.playerId === 'p1' && t.headEndedAtTick !== undefined,
    )
    expect(p1OldTimeline).toBeDefined()

    const p1Rewound = getPlayer(state, 'p1')
    p1Rewound.pos = { x: projX + projVelX * 8, y: 550 }
    p1Rewound.vel = { x: 0, y: 0 }
    p1Rewound.grounded = true
    p1Rewound.invulTicksRemaining = 0

    for (let i = 0; i < 20; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
      const p1Now = getPlayer(state, 'p1')
      if (
        state.timelines.filter((t) => t.playerId === 'p1' && t.headEndedAtTick !== undefined)
          .length > 1
      ) {
        expect(p1Now.alive).toBe(true)
        return
      }
    }

    throw new Error('ghost projectile did not hit own head from severed timeline')
  })

  it('boundary death and slash death in same tick do not double-rewind', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 640, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p2.pos = { x: 640, y: 10000 }
    p2.vel = { x: 0, y: 0 }

    for (let i = 0; i < 100; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }

    const p2b = getPlayer(state, 'p2')
    const p1b = getPlayer(state, 'p1')
    p2b.pos = { x: p1b.pos.x + PLAYER_WIDTH + 10, y: p1b.pos.y }
    p2b.vel = { x: 0, y: 0 }
    p2b.grounded = true
    p2b.facingRight = false
    p2b.alive = true

    p1b.pos = { x: -PLAYER_WIDTH - 5, y: 550 }
    p1b.grounded = true
    p1b.vel = { x: 0, y: 0 }

    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    const p1After = getPlayer(state, 'p1')
    expect(p1After.alive).toBe(true)

    const p1Timelines = state.timelines.filter(
      (t) => t.playerId === 'p1' && t.headEndedAtTick !== undefined,
    )
    expect(p1Timelines.length).toBe(1)
  })

  it('slash destroys an enemy projectile', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const p2 = getPlayer(state, 'p2')
    p1.pos = { x: 400, y: 550 }
    p1.vel = { x: 0, y: 0 }
    p1.grounded = true
    p1.facingRight = true
    p2.pos = { x: 500, y: 550 }
    p2.vel = { x: 0, y: 0 }
    p2.grounded = true
    p2.facingRight = false

    state = step(state, { p1: inputWith({ shoot: true }), p2: NO_INPUT })
    expect(state.projectiles.length).toBe(1)

    state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    state = step(state, { p1: NO_INPUT, p2: inputWith({ slash: true }) })

    expect(state.projectiles.length).toBe(0)
  })

  it('slash does not destroy own projectile', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
    placePlayersFarApart(state)

    const p1 = getPlayer(state, 'p1')
    p1.facingRight = true

    state = step(state, { p1: inputWith({ shoot: true, slash: true }), p2: NO_INPUT })

    expect(state.projectiles.length).toBe(1)
    expect(state.projectiles[0]?.ownerId).toBe('p1')
  })

  it('shoot cooldown lasts the expected duration', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
    placePlayersFarApart(state)

    const p2 = getPlayer(state, 'p2')
    p2.pos = { x: 10000, y: 550 }

    state = step(state, { p1: inputWith({ shoot: true }), p2: NO_INPUT })
    expect(state.projectiles.length).toBe(1)

    for (let i = 0; i < SHOOT_COOLDOWN - 1; i++) {
      state = step(state, { p1: inputWith({ shoot: true }), p2: NO_INPUT })
    }
    expect(state.projectiles.length).toBe(1)

    state = step(state, { p1: inputWith({ shoot: true }), p2: NO_INPUT })
    expect(state.projectiles.length).toBe(2)
  })
})

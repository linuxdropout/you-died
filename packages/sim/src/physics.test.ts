import type { PlayerInput, PlayerState } from './types.ts'
import { createInitialState } from './state.ts'
import { step } from './step.ts'
import { GRAVITY, MOVE_SPEED, PLAYER_HEIGHT } from './constants.ts'
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

describe('physics', () => {
  it('applies gravity to airborne players', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
    const startY = getPlayer(state, 'p1').pos.y

    for (let i = 0; i < 10; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }

    const p1 = getPlayer(state, 'p1')
    expect(p1.pos.y).toBeGreaterThan(startY)
  })

  it('lands player on a platform', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const platform = DEFAULT_ARENA.platforms[0] ?? { x: 0, y: 0, width: 0, height: 0 }
    p1.pos.x = platform.x + platform.width / 2
    p1.pos.y = platform.y - PLAYER_HEIGHT

    for (let i = 0; i < 60; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }

    const landed = getPlayer(state, 'p1')
    expect(landed.grounded).toBe(true)
    expect(landed.pos.y).toBe(platform.y)
    expect(landed.vel.y).toBe(0)
  })

  it('moves player horizontally', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const platform = DEFAULT_ARENA.platforms[0] ?? { x: 0, y: 0, width: 0, height: 0 }
    p1.pos.x = platform.x + platform.width / 2
    p1.pos.y = platform.y
    p1.grounded = true
    p1.vel.y = 0

    const startX = p1.pos.x

    for (let i = 0; i < 10; i++) {
      state = step(state, { p1: inputWith({ right: true }), p2: NO_INPUT })
    }

    const moved = getPlayer(state, 'p1')
    expect(moved.pos.x).toBeGreaterThan(startX)
    expect(moved.pos.x - startX).toBeCloseTo(MOVE_SPEED * 10, 0)
  })

  it('jumps when grounded', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const platform = DEFAULT_ARENA.platforms[0] ?? { x: 0, y: 0, width: 0, height: 0 }
    p1.pos.x = platform.x + platform.width / 2
    p1.pos.y = platform.y
    p1.grounded = true
    p1.vel.y = 0

    state = step(state, { p1: inputWith({ jump: true }), p2: NO_INPUT })

    const jumped = getPlayer(state, 'p1')
    expect(jumped.vel.y).toBeLessThan(0)
    expect(jumped.grounded).toBe(false)

    const peakY = jumped.pos.y
    for (let i = 0; i < 5; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }
    const rising = getPlayer(state, 'p1')
    expect(rising.pos.y).toBeLessThan(peakY)
  })

  it('allows a double jump while airborne', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const platform = DEFAULT_ARENA.platforms[0] ?? { x: 0, y: 0, width: 0, height: 0 }
    p1.pos.x = platform.x + platform.width / 2
    p1.pos.y = platform.y
    p1.grounded = true
    p1.vel.y = 0

    state = step(state, { p1: inputWith({ jump: true }), p2: NO_INPUT })
    const afterFirstJump = getPlayer(state, 'p1')
    expect(afterFirstJump.grounded).toBe(false)
    expect(afterFirstJump.airJumpsRemaining).toBe(1)

    // Release jump for one tick
    state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    // Let gravity slow us for a few ticks
    for (let i = 0; i < 5; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }
    const beforeDoubleJump = getPlayer(state, 'p1')
    const yBeforeDoubleJump = beforeDoubleJump.pos.y

    // Press jump again while airborne
    state = step(state, { p1: inputWith({ jump: true }), p2: NO_INPUT })
    const afterDoubleJump = getPlayer(state, 'p1')
    expect(afterDoubleJump.airJumpsRemaining).toBe(0)
    expect(afterDoubleJump.vel.y).toBeLessThan(0)

    // Verify upward movement
    for (let i = 0; i < 3; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }
    const rising = getPlayer(state, 'p1')
    expect(rising.pos.y).toBeLessThan(yBeforeDoubleJump)
  })

  it('does not allow triple jump', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    const platform = DEFAULT_ARENA.platforms[0] ?? { x: 0, y: 0, width: 0, height: 0 }
    p1.pos.x = platform.x + platform.width / 2
    p1.pos.y = platform.y
    p1.grounded = true
    p1.vel.y = 0

    // First jump
    state = step(state, { p1: inputWith({ jump: true }), p2: NO_INPUT })
    state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    // Second jump
    state = step(state, { p1: inputWith({ jump: true }), p2: NO_INPUT })
    state = step(state, { p1: NO_INPUT, p2: NO_INPUT })

    // Third jump attempt — should have no air jumps left
    const beforeThird = getPlayer(state, 'p1')
    const velBefore = beforeThird.vel.y

    state = step(state, { p1: inputWith({ jump: true }), p2: NO_INPUT })
    const afterThird = getPlayer(state, 'p1')
    // vel.y should not have been reset to JUMP_VELOCITY
    expect(afterThird.vel.y).not.toBeLessThan(velBefore)
  })

  it('kills player when falling out of bounds', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    const p1 = getPlayer(state, 'p1')
    p1.pos.y = DEFAULT_ARENA.killBoundary - 10

    for (let i = 0; i < 120; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }

    const events = state.timelines.filter(
      (t) => t.playerId === 'p1' && t.headEndedAtTick !== undefined,
    )
    expect(events.length).toBeGreaterThan(0)
  })

  it('applies gravity consistently across ticks', () => {
    let state = createInitialState({ seed: 1, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
    const startY = getPlayer(state, 'p1').pos.y

    const ticks = 20
    for (let i = 0; i < ticks; i++) {
      state = step(state, { p1: NO_INPUT, p2: NO_INPUT })
    }

    let expectedY = startY
    let vy = 0
    for (let i = 0; i < ticks; i++) {
      vy += GRAVITY
      if (vy > 12) vy = 12
      expectedY += vy
    }

    const p1 = getPlayer(state, 'p1')
    if (p1.grounded) {
      expect(p1.pos.y).toBeLessThanOrEqual(expectedY)
    } else {
      expect(p1.pos.y).toBeCloseTo(expectedY, 4)
    }
  })
})

import type { GameState, PlayerInput } from './types.ts'
import { createInitialState } from './state.ts'
import { step } from './step.ts'
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

function runSim(
  seed: number,
  ticks: number,
  inputFn: (tick: number) => Record<string, PlayerInput>,
): GameState {
  let state = createInitialState({ seed, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
  for (let i = 0; i < ticks; i++) {
    state = step(state, inputFn(state.tick))
  }
  return state
}

function stateFingerprint(state: GameState): string {
  const players = state.config.playerIds.map((id) => {
    const p = state.players[id]
    if (!p) return `${id}:missing`
    return `${id}:${p.pos.x.toFixed(6)},${p.pos.y.toFixed(6)},${p.vel.x.toFixed(6)},${p.vel.y.toFixed(6)},${p.alive},${p.ticks},${p.facingRight},${p.grounded}`
  })
  return [
    `tick=${state.tick}`,
    `seed=${state.seed}`,
    `proj=${state.projectiles.length}`,
    `slash=${state.slashHitboxes.length}`,
    `timelines=${state.timelines.length}`,
    `winner=${state.winner ?? 'none'}`,
    ...players,
  ].join('|')
}

describe('determinism', () => {
  it('produces identical state when replayed with same seed and inputs', () => {
    const inputSequence = (tick: number): Record<string, PlayerInput> => {
      const p1 =
        tick < 30
          ? inputWith({ right: true })
          : tick < 60
            ? inputWith({ right: true, jump: true })
            : tick < 90
              ? inputWith({ left: true })
              : tick < 120
                ? inputWith({ slash: true })
                : tick < 150
                  ? inputWith({ right: true, shoot: true })
                  : inputWith({ left: true, jump: true })

      const p2 =
        tick < 40
          ? inputWith({ left: true })
          : tick < 80
            ? inputWith({ left: true, jump: true })
            : tick < 100
              ? inputWith({ right: true, dash: true })
              : tick < 140
                ? inputWith({ shoot: true })
                : inputWith({ right: true, slash: true })

      return { p1, p2 }
    }

    const state1 = runSim(42, 300, inputSequence)
    const state2 = runSim(42, 300, inputSequence)

    expect(stateFingerprint(state1)).toBe(stateFingerprint(state2))
    expect(state1.tick).toBe(state2.tick)
    expect(state1.seed).toBe(state2.seed)
  })

  it('produces identical state at every tick, not just the final state', () => {
    const inputFn = (tick: number): Record<string, PlayerInput> => ({
      p1: tick % 20 < 10 ? inputWith({ right: true }) : inputWith({ left: true, jump: true }),
      p2: tick % 15 < 8 ? inputWith({ left: true, shoot: true }) : inputWith({ right: true }),
    })

    let state1 = createInitialState({ seed: 99, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })
    let state2 = createInitialState({ seed: 99, playerIds: ['p1', 'p2'], arena: DEFAULT_ARENA })

    for (let i = 0; i < 200; i++) {
      const inputs = inputFn(state1.tick)
      state1 = step(state1, inputs)
      state2 = step(state2, inputs)
      expect(stateFingerprint(state1)).toBe(stateFingerprint(state2))
    }
  })

  it('diverges with different seeds', () => {
    const inputFn = (_tick: number): Record<string, PlayerInput> => ({
      p1: inputWith({ right: true }),
      p2: inputWith({ left: true }),
    })

    const state1 = runSim(42, 100, inputFn)
    const state2 = runSim(43, 100, inputFn)

    expect(state1.seed).not.toBe(state2.seed)
  })

  it('diverges with different inputs', () => {
    const inputFn1 = (_tick: number): Record<string, PlayerInput> => ({
      p1: inputWith({ right: true }),
      p2: inputWith({ left: true }),
    })
    const inputFn2 = (tick: number): Record<string, PlayerInput> => ({
      p1: tick >= 50 ? inputWith({ left: true }) : inputWith({ right: true }),
      p2: inputWith({ left: true }),
    })

    const state1 = runSim(42, 100, inputFn1)
    const state2 = runSim(42, 100, inputFn2)

    const p1a = state1.players['p1']
    const p1b = state2.players['p1']
    if (!p1a || !p1b) throw new Error('players missing')
    expect(p1a.pos.x).not.toBe(p1b.pos.x)
  })

  it('produces identical state with 4 players', () => {
    const inputFn = (tick: number): Record<string, PlayerInput> => ({
      p1: inputWith({ right: tick % 3 === 0 }),
      p2: inputWith({ left: tick % 4 === 0, jump: tick % 7 === 0 }),
      p3: inputWith({ right: tick % 5 === 0, slash: tick % 11 === 0 }),
      p4: inputWith({ left: tick % 6 === 0, shoot: tick % 13 === 0 }),
    })

    const state1 = runSim(777, 200, inputFn)
    const state2 = runSim(777, 200, inputFn)

    expect(stateFingerprint(state1)).toBe(stateFingerprint(state2))
  })

  it('remains deterministic over a full-length match (18000 ticks)', () => {
    const inputFn = (tick: number): Record<string, PlayerInput> => ({
      p1: inputWith({
        right: tick % 7 < 3,
        left: tick % 7 >= 5,
        jump: tick % 23 === 0,
        slash: tick % 19 === 0,
        shoot: tick % 37 === 0,
        dash: tick % 41 === 0,
      }),
      p2: inputWith({
        left: tick % 11 < 5,
        right: tick % 11 >= 8,
        jump: tick % 29 === 0,
        slash: tick % 17 === 0,
        shoot: tick % 31 === 0,
        dash: tick % 43 === 0,
      }),
    })

    const state1 = runSim(42, 18000, inputFn)
    const state2 = runSim(42, 18000, inputFn)

    expect(stateFingerprint(state1)).toBe(stateFingerprint(state2))
    expect(state1.tick).toBe(state2.tick)
  })
})

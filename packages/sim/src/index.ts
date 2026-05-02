export interface GameConfig {
  tickRate: number
  seed: number
  playerCount: number
}

export interface GameState {
  tick: number
  seed: number
}

export interface PlayerInput {
  left: boolean
  right: boolean
  jump: boolean
  dash: boolean
  slash: boolean
  shoot: boolean
}

export interface RenderFrame {
  tick: number
}

export function createInitialState(config: GameConfig): GameState {
  return {
    tick: 0,
    seed: config.seed,
  }
}

export function step(state: GameState, _inputs: Record<string, PlayerInput>): GameState {
  return {
    ...state,
    tick: state.tick + 1,
  }
}

export function getRenderableState(state: GameState): RenderFrame {
  return {
    tick: state.tick,
  }
}

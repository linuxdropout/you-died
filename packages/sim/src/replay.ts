import type { PlayerId, PlayerInput, GameState } from './types.ts'
import { createInitialState } from './state.ts'
import { step } from './step.ts'

export interface ReplayData {
  seed: number
  playerIds: PlayerId[]
  inputLog: Record<PlayerId, PlayerInput>[]
}

export function replayMatch(data: ReplayData): GameState {
  let state = createInitialState({ seed: data.seed, playerIds: data.playerIds })

  for (const inputs of data.inputLog) {
    state = step(state, inputs)
    if (state.winner !== undefined) break
  }

  return state
}

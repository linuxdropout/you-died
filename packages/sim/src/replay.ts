import type { PlayerId, PlayerInput, GameState } from './types.ts'
import { createInitialState } from './state.ts'
import { step } from './step.ts'
import { selectArena } from './maps.ts'

export interface ReplayData {
  seed: number
  playerIds: PlayerId[]
  inputLog: Record<PlayerId, PlayerInput>[]
}

export function replayMatch(data: ReplayData): GameState {
  const arena = selectArena(data.seed, data.playerIds.length)
  let state = createInitialState({ seed: data.seed, playerIds: data.playerIds, arena })

  for (const inputs of data.inputLog) {
    state = step(state, inputs)
    if (state.winner !== undefined) break
  }

  return state
}

export type {
  Vec2,
  GameConfig,
  GameState,
  PlayerState,
  PlayerInput,
  PlayerId,
  TimelineId,
  Projectile,
  SlashHitbox,
  GameEvent,
  GameEventType,
  RenderFrame,
  RenderPlayer,
  RenderProjectile,
  RenderSlash,
} from './types.ts'

export type { Platform } from './arena.ts'
export { DEFAULT_ARENA } from './arena.ts'

export { createInitialState } from './state.ts'
export { step } from './step.ts'
export { getRenderableState } from './render.ts'
export { getTimeoutWinner } from './timeline.ts'
export { replayMatch, type ReplayData } from './replay.ts'
export { hashState } from './hash.ts'

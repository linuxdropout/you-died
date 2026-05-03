import type { PlayerId, TimelineId, PlayerInput } from '@you-died/protocol'
import type { Arena } from './arena.ts'

export type { PlayerId, TimelineId, PlayerInput }

export interface Vec2 {
  x: number
  y: number
}

export interface GameConfig {
  seed: number
  playerIds: PlayerId[]
  arena: Arena
}

export interface PlayerState {
  id: PlayerId
  timelineId: TimelineId
  pos: Vec2
  vel: Vec2
  facingRight: boolean
  grounded: boolean
  dashTicksRemaining: number
  dashCooldownTicks: number
  slashTicksRemaining: number
  slashCooldownTicks: number
  shootCooldownTicks: number
  shootTicksRemaining: number
  airJumpsRemaining: number
  jumpHeld: boolean
  alive: boolean
  isGhost: boolean
  ticks: number
  invulTicksRemaining: number
}

export interface Projectile {
  id: number
  ownerId: PlayerId
  ownerTimelineId: TimelineId
  pos: Vec2
  vel: Vec2
  ticksRemaining: number
  isGhost: boolean
}

export interface SlashHitbox {
  id: number
  ownerId: PlayerId
  ownerTimelineId: TimelineId
  pos: Vec2
  offsetX: number
  width: number
  height: number
  ticksRemaining: number
  isGhost: boolean
}

export interface TimelineSnapshot {
  tick: number
  input: PlayerInput
  state: PlayerState
}

export interface TimelineRecord {
  timelineId: TimelineId
  playerId: PlayerId
  startTick: number
  snapshots: TimelineSnapshot[]
  headEndedAtTick: number | undefined
  replayOriginTick: number | undefined
  replayStartTick: number | undefined
  severed: boolean
  severedAtSnapshotTick: number | undefined
  severedByTimelineId: TimelineId | undefined
  replayComplete: boolean
}

export type GameEventType =
  | 'death'
  | 'rewind'
  | 'timelineSevered'
  | 'paradox'
  | 'futureLaunch'
  | 'win'

export interface GameEvent {
  tick: number
  type: GameEventType
  playerId: PlayerId
  killerId?: PlayerId
}

export interface GameState {
  tick: number
  seed: number
  config: GameConfig
  players: Record<PlayerId, PlayerState>
  projectiles: Projectile[]
  slashHitboxes: SlashHitbox[]
  timelines: TimelineRecord[]
  events: GameEvent[]
  nextEntityId: number
  winner: PlayerId | undefined
  kills: Record<PlayerId, number>
  deaths: Record<PlayerId, number>
}

export interface RenderPlayer {
  id: PlayerId
  timelineId: TimelineId
  pos: Vec2
  facingRight: boolean
  grounded: boolean
  isGhost: boolean
  isSlashing: boolean
  isShooting: boolean
  isDashing: boolean
  alive: boolean
  timelineOffset: number
  isInvulnerable: boolean
}

export interface RenderProjectile {
  id: number
  pos: Vec2
  vel: Vec2
  isGhost: boolean
}

export interface RenderSlash {
  id: number
  pos: Vec2
  width: number
  height: number
  facingRight: boolean
  isGhost: boolean
}

export interface RenderFrame {
  tick: number
  players: RenderPlayer[]
  projectiles: RenderProjectile[]
  slashes: RenderSlash[]
  events: GameEvent[]
  winner: PlayerId | undefined
}

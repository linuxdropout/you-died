export type PlayerId = string
export type TimelineId = string
export type EventId = string

export interface PlayerInput {
  left: boolean
  right: boolean
  jump: boolean
  dash: boolean
  slash: boolean
  shoot: boolean
}

export type ClientMessage =
  | { type: 'ready' }
  | { type: 'setName'; name: string }
  | { type: 'startCountdown' }
  | { type: 'cancelCountdown' }
  | { type: 'input'; tick: number; input: PlayerInput }
  | { type: 'stateHash'; tick: number; hash: number }

export type ServerMessage =
  | { type: 'roomState'; players: LobbyPlayer[]; countdownSeconds: number | null; roomCode: string; hostId: PlayerId }
  | { type: 'startMatch'; seed: number; playerId: PlayerId; playerIds: PlayerId[]; playerNames: Record<PlayerId, string>; playerColors: Record<PlayerId, string> }
  | { type: 'inputs'; tick: number; inputs: Record<PlayerId, PlayerInput> }
  | { type: 'matchEnd'; reason: 'timeout' | 'win'; winnerId?: PlayerId | undefined }
  | { type: 'error'; message: string }

export interface LobbyPlayer {
  id: PlayerId
  name: string
  ready: boolean
  color: string
}

export const MIN_PLAYERS = 1
export const MAX_PLAYERS = 4
export const TICK_RATE = 60
export const REWIND_SECONDS = 10
export const WIN_LEAD_SECONDS = 30
export const MATCH_TIME_LIMIT_SECONDS = 300
export const HASH_CHECK_INTERVAL_TICKS = 60
export const ROOM_CODE_LENGTH = 6

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
  | { type: 'rejoinLobby' }
  | { type: 'addBot' }
  | { type: 'removeBot'; playerId: PlayerId }

export type ServerMessage =
  | {
      type: 'roomState'
      players: LobbyPlayer[]
      countdownSeconds: number | null
      roomCode: string
      hostId: PlayerId
    }
  | {
      type: 'startMatch'
      seed: number
      playerId: PlayerId
      playerIds: PlayerId[]
      playerNames: Record<PlayerId, string>
      playerColors: Record<PlayerId, string>
    }
  | { type: 'inputs'; tick: number; inputs: Record<PlayerId, PlayerInput> }
  | { type: 'matchEnd'; reason: 'timeout' | 'win'; winnerId?: PlayerId | undefined }
  | { type: 'playerLeft'; playerId: PlayerId }
  | { type: 'error'; message: string }

export interface LobbyPlayer {
  id: PlayerId
  name: string
  ready: boolean
  color: string
  isBot: boolean
}

export const BOT_ID_PREFIX = 'bot-'

export function isBotId(id: PlayerId): boolean {
  return id.startsWith(BOT_ID_PREFIX)
}

export const MIN_PLAYERS = 1
export const MAX_PLAYERS = 12
export const TICK_RATE = 60
export const REWIND_SECONDS = 10
export const WIN_LEAD_SECONDS = 30
export const PARADOX_MIN_GAIN_SECONDS = 5
export const MATCH_TIME_LIMIT_SECONDS = 300
export const HASH_CHECK_INTERVAL_TICKS = 60
export const ROOM_CODE_LENGTH = 6
